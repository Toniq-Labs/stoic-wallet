# Stoic ICRC signer — integration handoff

Authoritative contract for the **signer side** (this repo, `stoic-wallet`) so the
**client library** (`stoic-identity`) and **relying-party** integrations
(`entrepot.app`) can build against it. Signer implementation lives in
`src/components/SignerListener.js` + `src/ic/icrc/`.

Stoic implements: **ICRC-25, ICRC-27, ICRC-28, ICRC-29, ICRC-34, ICRC-49**
(+ ICRC-21 consent for calls). It runs **alongside** the legacy
`stoic-connect`/`?stoicTunnel` protocol — legacy is unchanged, so nothing here
breaks existing dapps.

## 1. Connecting (ICRC-29)

1. The relying party (RP) opens the Stoic signer in a new window at Stoic's
   origin (e.g. `https://www.stoicwallet.com/`). No special path/query is needed.
2. The RP posts `{ jsonrpc:"2.0", id, method:"icrc29_status" }` to that window
   (`targetOrigin` = the signer origin) and repeats every ~1s.
3. The signer replies `{ jsonrpc:"2.0", id, result:"ready" }`. The channel is
   established on the first `ready`; the signer pins the RP's **origin + window**
   and ignores messages from any other origin/window thereafter.
4. Keep sending `icrc29_status` as a heartbeat if you want liveness.

All messages are JSON-RPC 2.0. The signer only ever touches messages with
`jsonrpc:"2.0"`, so it coexists with the legacy `{action,target}` protocol.

## 2. Methods

| Method | Scope-gated | Notes |
|---|---|---|
| `icrc29_status` | no | handshake/heartbeat → `"ready"` |
| `icrc25_supported_standards` | no | → `{ supportedStandards: [{name,url}] }` |
| `icrc25_request_permissions` | no | prompts the user; grants scopes |
| `icrc25_permissions` | no | current scope states |
| `icrc25_revoke_permissions` | no | revoke some/all scopes |
| `icrc27_accounts` | `icrc27_accounts` | → `{ accounts: [{owner, subaccount?}] }` |
| `icrc34_delegation` | `icrc34_delegation` | session delegation (see §4) |
| `icrc49_call_canister` | `icrc49_call_canister` | contentMap + certificate (see §5) |

Scope model (ICRC-25): a scope's state is `granted`, `denied`, or `ask_on_use`.
Ungranted scoped methods are `ask_on_use` — the signer prompts on first use and,
on approval, persists the grant (visible/removable in Stoic's Applications view).
Permission denied → error **3000**; user rejected → **3001**.

## 3. Accounts (ICRC-27)

`{ accounts: [{ owner: <principal text>, subaccount?: <Uint8Array(32)> }] }`.
One entry per Stoic sub-account; the default account has no `subaccount`.

## 4. Delegation (ICRC-34)

Request `params`: `{ publicKey, targets?, maxTimeToLive? }`.
- `publicKey`: RP session key, **DER-encoded**. Accepted as raw bytes
  (Uint8Array/ArrayBuffer), or a **hex** or **base64** string.
- `targets`: optional canister-id text array → an account (scoped) delegation.
- `maxTimeToLive`: optional nanoseconds (string/number/bigint); capped at 15 min.

Response:
```
{
  publicKey: <Uint8Array>,                      // the user identity's root DER key
  signerDelegation: [
    {
      delegation: {
        pubkey: <Uint8Array>,                   // = the RP session key
        expiration: "<base-10 nanoseconds>",    // string
        targets?: ["<canisterId>", ...]         // present only for scoped delegations
      },
      signature: <Uint8Array>
    }
  ]
}
```
Internet-Identity accounts return a **2-link chain** (anchor → Stoic session →
RP), with `publicKey` = the II anchor root key.

**ICRC-28 (targets):** a scoped delegation is only issued if the RP origin is
listed in **every** target canister's `icrc28_trusted_origins` (called as an
update for a certified response; fails closed). A target canister must therefore
implement:
```
icrc28_trusted_origins : () -> (record { trusted_origins : vec text });
```
and include the RP origin. A no-`targets` delegation is **unrestricted** (acts as
the user on any canister) and requires an explicit warning approval.

## 5. Call canister (ICRC-49)

Request `params`: `{ canisterId, sender, method, arg, nonce? }` where `arg`/`nonce`
are bytes or hex/base64. `sender` must equal the connected account's principal.

The signer fetches an **ICRC-21** consent message
(`icrc21_canister_call_consent_message`) and shows it; if the canister has no
ICRC-21 support it shows a blind-approval warning. Approval is never skipped.

Response: `{ contentMap: <Uint8Array>, certificate: <Uint8Array> }` — the exact
CBOR request content map and the read_state certificate, so the RP recomputes the
request id and verifies the reply itself.

## 6. Blob encoding — the one thing to pin in e2e

- **Inbound** (RP → signer): blobs accepted as raw bytes, hex, or base64
  (`src/ic/icrc/bytes.js#bytesFromParam`). Robust.
- **Outbound** (signer → RP): blobs are **`Uint8Array`**, carried natively by the
  ICRC-29 `postMessage` structured clone; `expiration` is a **base-10 string**.

⚠️ **Open item:** confirm the target client library's expected outbound encoding.
`@slide-computer/signer`'s postMessage transport passes structured-cloned objects
(so `Uint8Array` is expected), but some JSON-first clients expect base64 strings.
If the chosen client wants base64, adjust the outbound mapping in
`delegation.js#toIcrc34Response` and the ICRC-49 response in `SignerListener.js`.
This is the main thing to verify end-to-end.

## 7. Recommended client approach (`stoic-identity`)

- Build on a standard signer client, e.g. **`@slide-computer/signer`** with a
  `PostMessageTransport` whose `signerUrl` is Stoic's origin, then use
  `Signer`/`SignerAgent` (or `DelegationIdentity` from the ICRC-34 result).
- Keep the **legacy** `ic-stoic-identity` API exported for a deprecation window;
  add the ICRC path as the new default.
- Verify §6 against Stoic before publishing.

## 8. Testing

- **Harness (in this repo):** `public/icrc-signer-test.html` — a dependency-free
  RP that runs the ICRC-29 handshake and calls permissions/accounts/delegation.
  On the Netlify preview it's served at `/icrc-signer-test.html`; set the signer
  URL to `/` (same origin) or the deployed Stoic origin.
- **entrepot.app:** the real-world RP — integrate the updated `stoic-identity`
  client and confirm login (delegation) + a signed call end-to-end.

## 9. e2e checklist before GA

- [ ] handshake → `ready`
- [ ] `request_permissions` grants + persists (shows in Applications view)
- [ ] `icrc27_accounts` returns the expected principal/subaccounts
- [ ] `icrc34_delegation` (no targets) → usable `DelegationIdentity` whose
      principal matches the Stoic account
- [ ] `icrc34_delegation` with `targets` blocked unless origin is in
      `icrc28_trusted_origins`
- [ ] II-account delegation verifies (2-link chain)
- [ ] `icrc49_call_canister` reply verifies from `contentMap` + `certificate`
- [ ] outbound blob encoding matches the client (§6)

# Stoic as an ICRC Signer — design & plan

Goal: replace Stoic's proprietary `stoic-identity` / `stoic-connect` protocol with
the **ICRC signer standards** from the [wg-identity-authentication] working group,
and move third-party apps onto **delegated identities** instead of per-call
remote signing.

Standards in scope: **ICRC-25** (signer interaction), **ICRC-29** (postMessage
transport), **ICRC-27** (accounts), **ICRC-28** (trusted origins), **ICRC-34**
(delegation), **ICRC-49** (call canister), **ICRC-21** (consent messages).

[wg-identity-authentication]: https://github.com/dfinity/wg-identity-authentication

---

## 1. Where we are today

Stoic currently exposes a **bespoke** connect protocol (see
`src/index.js` `?stoicTunnel` bridge and `src/views/AccountDetail.js`
`?authorizeApp` handshake):

- A dapp uses the `ic-stoic-identity` client lib, which opens Stoic in a
  popup/iframe and exchanges `initiateStoicConnect` / `requestAuthorization` /
  `confirmAuthorization` messages.
- The dapp registers an **ECDSA P-384 apikey** (its public key). Stoic stores
  `{host, apikey}` per principal in the `apps` array.
- For each canister call, the dapp builds the request, sends the **payload blob**
  to Stoic (`action: 'sign'`), Stoic signs it with the user's key and returns the
  signature (plus, for II identities, the delegation `chain`). i.e. **Stoic is a
  remote signer invoked on every call** — a round-trip per request.

Limitations: non-standard (only works with Stoic's own lib), a network hop per
call, and no canister-scoped phishing protection (ICRC-28) or human-readable
consent (ICRC-21).

## 2. Where we want to be

Stoic becomes a **standards-compliant ICRC signer**. Any dapp using a standard
signer client (e.g. `@slide-computer/signer` with a postMessage transport, or the
`signer-js` ecosystem) can:

1. Open Stoic and complete the **ICRC-29** handshake (`icrc29_status → "ready"`).
2. Request **ICRC-25** permissions for the scopes it needs.
3. Read **ICRC-27** accounts.
4. Obtain an **ICRC-34** *delegation* to its session key — a **delegated
   identity** the dapp then uses to sign its own calls directly (no per-call
   round-trip). Before issuing a canister-scoped (targets) delegation, Stoic
   validates the dapp origin against each target canister's **ICRC-28**
   `icrc28_trusted_origins` (anti-phishing).
5. Optionally, for canisters that don't fit the delegation model, ask Stoic to
   **ICRC-49** `call_canister` on its behalf, with **ICRC-21** consent shown.

This is the same model Internet Identity / NFID / OISY expose.

## 3. Architecture

```
dapp (relying party)                         Stoic (signer)
  │  window.open(signerUrl)  ───────────────▶  signer window (this app)
  │  postMessage icrc29_status  ────────────▶  RPC listener (always on)
  │  ◀───────────────── { result: "ready" }
  │  postMessage icrc25_request_permissions ▶  ┌─ JSON-RPC dispatch ─┐
  │  ◀──────────────── { result: scopes }      │ permissions manager │
  │  postMessage icrc27_accounts  ──────────▶  │ accounts            │
  │  postMessage icrc34_delegation  ────────▶  │ delegation builder  │──▶ ICRC-28 check
  │  ◀──────── { publicKey, signerDelegation } └─────────────────────┘
```

New module tree: **`src/ic/icrc/`**
- `jsonrpc.js` — JSON-RPC 2.0 request/response helpers + ICRC error codes
  (1000 generic, 2000 not-supported, 2001 no-consent, 3000 permission-denied,
  3001 user-aborted, 4000 network, 4001 channel-closed). *Pure, unit-tested.*
- `standards.js` — the `icrc25_supported_standards` list and the scope→method
  registry (which methods are permission-gated). *Pure, unit-tested.*
- `transport.js` — ICRC-29 postMessage listener: validate origin/source, answer
  `icrc29_status` with `ready`, hand real requests to the dispatcher. Installed
  early (harmless when Stoic is opened normally — no RP posts `icrc29_status`).
- `permissions.js` — per-origin granted scopes, persisted in the store
  (extends/replaces the `apps` array; see §5).
- `delegation.js` — build an ICRC-34 delegation with `@dfinity/identity`
  `DelegationChain.create(userIdentity, sessionPubKey, expiration, {targets,
  previous})`; map the chain to the ICRC-34 response shape. For II-derived
  identities the existing II delegation chain is passed as `previous`.
- `trustedOrigins.js` — ICRC-28 check: for each target canister, call
  `icrc28_trusted_origins` (anonymous agent) and confirm the RP origin is listed.
- `candid/icrc28.did.js`, `candid/icrc21.did.js` — minimal IDLs.
- UI: a **Signer** container rendering the approval prompts (connect/permissions,
  account selection, delegation approval, ICRC-49 call consent) in the existing
  Material-UI design system.

### Entry point
The RP opens whatever `signerUrl` it configures (Stoic's origin). So Stoic
installs the ICRC-29 responder **early and unconditionally**; when the first real
request arrives it ensures the wallet is unlocked and mounts the Signer approval
UI. No special path/query needed by dapps.

### Delegation & identity types
- **seed / pem** identities → direct `DelegationChain.create(userId, sessionKey…)`.
- **Internet Identity** → chain onto the existing II delegation via `previous`.
- **watch** identities → cannot sign; delegation/call scopes are unavailable.

## 4. Phasing (small, reviewable PRs)

1. **Foundation** (this PR, no behavior change): design doc + pure core modules
   (`jsonrpc`, `standards`), ICRC-28/21 IDLs, `delegation`/`trustedOrigins`
   builders, unit tests. Nothing wired into the running app yet.
2. **Connect + accounts**: ICRC-29 transport + ICRC-25 permissions + ICRC-27
   accounts + Signer approval UI + permissions store. Delivers standards-based
   connect and account sharing.
3. **Delegation**: ICRC-34 issuance + ICRC-28 trusted-origins validation +
   approval UI. Delivers the "delegated identity that matches".
4. **Calls + consent**: ICRC-49 `call_canister` + ICRC-21 consent message
   fetch/display.
5. **Client + migration**: update/ship the Stoic client lib on top of the
   standard transport; keep the legacy protocol during a deprecation window.

## 5. Key decision needed — backward compatibility

The legacy `?stoicTunnel` / `?authorizeApp` protocol is used by **every existing
dapp** integrated via the current `ic-stoic-identity` lib. Options:

- **(A) Additive (recommended):** ship the ICRC signer *alongside* the legacy
  protocol; migrate the client lib to the standard transport; deprecate legacy
  later. Zero breakage for existing integrations.
- **(B) Hard switch:** remove legacy and require all dapps to adopt the ICRC
  flow. Breaks existing apps until they update.

Recommendation: **(A)**. It's the only non-breaking path and matches "keep PRs
small". The `apps` store gains a `scopes` (and delegation session) field; legacy
`apikey` stays for the old flow until removed.

## 6. Notable spec details baked into the build

- **ICRC-29**: RP↔signer messages only accepted when `origin === establishedOrigin`
  **and** `source === establishedSource`; malformed messages are ignored;
  periodic `icrc29_status` acts as a heartbeat.
- **ICRC-34** response: `{ publicKey, signerDelegation: [{ delegation: { pubkey,
  expiration (base-10 ns string), targets? }, signature }] }`. Signature domain
  separator `\x1Aic-request-auth-delegation` (handled by `@dfinity/identity`).
- **ICRC-28**: only issue a **targets** (account) delegation if the RP origin is
  in *all* target canisters' trusted origins; otherwise offer a relying-party
  (no-targets) delegation only.
- **ICRC-49/21**: user approval is **never** skipped; try ICRC-21 consent first,
  and if the canister has no consent support, either refuse (error 2001) or warn
  with decoded args before proceeding.

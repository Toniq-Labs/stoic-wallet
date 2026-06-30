# Odin Ledger — ICRC Integration Guide for Wallets

How to read balances and move BTC, tokens, and LP tokens on the **Odin ledger
canister**. Odin is a single multi-token ledger that implements **ICRC-1, ICRC-2,
ICRC-4**, and a multi-token addressing convention Odin calls **ICRC-80**. It also
advertises ICRC-10 and ICRC-28.

> Canister IDs
> - **Dev:** `w5cxm-6iaaa-aaaaj-az4jq-cai`
> - **Prod:** *(your production Odin canister id)*

`icrc1_supported_standards` returns: ICRC-1, ICRC-2, ICRC-4, ICRC-10, ICRC-28, ICRC-80.

---

## 1. The one big idea: one ledger, many tokens, addressed by subaccount (ICRC-80)

Odin is **not** one canister per token. It is **a single ledger** that holds
every token: BTC, the rewards token, every launched token, and every token's LP
position. Which token an operation touches is determined entirely by the
**`subaccount`** field of the ICRC `Account` — Odin calls this the **token
pointer**.

| Asset | Token id (text) | Subaccount (token pointer) |
|---|---|---|
| BTC | `"btc"` | `null` (or 32 zero bytes) |
| Rewards | `"rew"` | system pointer, index 1 |
| A launched token | `"<tokenid>"` e.g. `"hjsu"` | `odin_token_pointer("<tokenid>")` |
| A token's LP | `"lp_<tokenid>"` e.g. `"lp_hjsu"` | `odin_token_pointer("lp_<tokenid>")` |

**Golden rule (ICRC-80):** on **every** transfer, `from_subaccount`,
`to.subaccount`, and (for `transfer_from`) `spender_subaccount` **must all be the
same token pointer**. You are not moving "to a subaccount" — the subaccount **is
the token selector**. A transfer where `to.subaccount != from_subaccount` is
rejected with error code `80`.

So to send 1,000 units of token `hjsu` from Alice to Bob:
- `from_subaccount = odin_token_pointer("hjsu")`
- `to = { owner = Bob; subaccount = odin_token_pointer("hjsu") }`

To send BTC, all subaccounts are `null`.

### Resolving token pointers

Two query methods convert between a text token id and its 32-byte pointer:

```candid
odin_token_pointer    : (tokenid : text) -> (blob)        query;  // text id   -> 32-byte subaccount
odin_token_by_pointer : (pointer : blob) -> (opt Token)   query;  // subaccount -> token record
```

**Always obtain the pointer from `odin_token_pointer` (or cache it).** The pointer
encodes Odin's *internal numeric index* for the token, **not** the text id, so you
cannot derive it from the text id alone. (The byte layout is in §7 for reference,
but the index lookup is internal — use the query.)

---

## 1b. Implementing Odin tokens in a wallet — add by token ID, main account only

Treat an Odin token like a **custom token you add by identifier** (the way a wallet
adds an ERC‑20 by contract address). The user supplies **one thing: the token ID**
(e.g. `hjsu`); the wallet derives everything else from the Odin ledger.

**Registration = `(Odin ledger canister id, token ID)`.** From the token ID:

| Need | How |
|---|---|
| Subaccount (token pointer) | `odin_token_pointer(tokenId)` → 32-byte blob (cache it) |
| Balance | `icrc1_balance_of({ owner = userPrincipal; subaccount = pointer })` |
| Send / receive | `icrc1_transfer` / `icrc2_*` with that pointer on **all** subaccount fields (§4–§5) |
| Decimals | **11** for Odin-launched tokens (scale `1e11`, same as BTC). External tokens may differ — confirm via the token's `divisibility`. |
| On-chain market data | `odin_token_by_pointer(pointer)` → `Token`: `supply`, `max_supply`, `pool` (AMM reserves), `lp_supply`, `bonded_btc`, `bonding_threshold`, `creator`, `rune`. |
| Display name / ticker / image | **Not on the ledger's `Token` record** — source from Odin's off-chain metadata (Odin API keyed by token id), or fall back to showing the token ID. |

So a wallet's "Add token" form for Odin needs only the **token ID** (plus the fixed
ledger canister id). No address, no subaccount input.

### These tokens live ONLY on the main account — there are no user subaccounts

This is the single most important rule for displaying Odin assets correctly.

On a normal ICRC ledger, the `subaccount` field lets one principal hold many
independent balances ("sub-wallets"). **On Odin that field is repurposed to
identify the token (the token pointer), so it is NOT available as a per-user
subaccount.** Consequences a wallet must honour:

- Every Odin asset for a user (BTC, each token, each LP) is held under that user's
  **one main account = their principal**, with `subaccount = the token's pointer`.
  There is exactly **one balance per (principal, token)** — no second/third
  sub-wallet for the same token.
- The wallet **MUST**:
  - Always use `owner = the user's principal`.
  - Always set `subaccount` to the **token pointer from `odin_token_pointer`** — and
    nothing else.
  - **NOT** offer "create subaccount / add sub-wallet" for Odin assets, and **NOT**
    derive subaccounts from an account index / random bytes / HD path. That byte
    range is the token selector; putting anything else there points at the wrong
    token or traps on decode.
  - Group and display **all** Odin balances under the single main account.
- **Receive address = just the user's principal.** The subaccount is implied by the
  token (the sender sets it), so there is no subaccount to encode into a receive
  address or show to the user. Don't generate per-token deposit subaccounts.

In short: one account (the principal), many tokens — selected by the pointer the
wallet computes, never by a user-chosen subaccount.

---

## 2. Units & decimals

- **BTC** reports `icrc1_decimals = 11`. Balances/amounts are in **msats**.
  - `1 sat = 1,000 msats`
  - `1 BTC = 100,000,000 sats = 100,000,000,000 msats (1e11)`
- **Tokens / LP**: Odin-launched tokens use **11 decimals** by default (internal
  scale `10^(8 + 3) = 1e11`). External/custom tokens may use a different
  `divisibility`; confirm per token. Read raw integer balances with
  `icrc1_balance_of` using the token's pointer.

---

## 3. Fees — read this carefully

Every ledger operation costs a flat fee, and there are two non-obvious rules:

1. **The fee is always paid in BTC**, deducted from the caller's **BTC balance** —
   even when transferring a *token* or *LP*. A user who holds a token but **0 BTC
   cannot transfer it** (no BTC to pay the fee).
2. **The fee is taken from the balance, not from the allowance or the amount.**

| Operation | Fee (msats) | Fee (sats) | Paid by |
|---|---|---|---|
| `icrc1_transfer` | 100,000 | 100 | sender (in BTC) |
| `icrc2_approve` | 100,000 | 100 | approver (in BTC) |
| `icrc2_transfer_from` | 100,000 | 100 | the `from` account (in BTC) |
| `icrc4_transfer_batch` | 100,000 **per transfer** | 100 each | sender (in BTC) |
| AMM add/remove liquidity | 100,000 | 100 | caller (in BTC) |

`icrc1_fee()` returns the transfer fee (`100000`).

**The `fee` field must be `null`.** Odin rejects any ICRC call that sets `fee`
(or `memo`, or `expires_at`) — see the error table. Do not populate them.

**Practical balance math:**
- BTC transfer of `X` msats → caller needs `X + 100000` msats BTC.
- Token transfer of `Y` units → caller needs `Y` of the token **and** `≥ 100000`
  msats BTC for the fee.
- `approve(A)` then `transfer_from(amount = M)`: the allowance must be `≥ M` (the
  fee is **not** drawn from the allowance). Each call separately costs the 100-sat
  BTC fee, so an approve→pull flow costs **two** BTC fees total.

---

## 4. ICRC-1 — balances & transfers

```candid
icrc1_name          : ()        -> (text) query;            // "Bitcoin"
icrc1_symbol        : ()        -> (text) query;            // "BTC"
icrc1_decimals      : ()        -> (nat8) query;            // 11
icrc1_fee           : ()        -> (nat64) query;           // 100000
icrc1_metadata      : ()        -> (vec record { key:text; value:text }) query;
icrc1_total_supply  : ()        -> (nat64) query;
icrc1_balance_of    : (Account) -> (nat)  query;
icrc1_transfer      : (TransferArgs) -> (variant { Ok:nat; Err:TransferError });

type Account = record { owner : principal; subaccount : opt blob };

type TransferArgs = record {
  from_subaccount : opt blob;   // = the token pointer (null for BTC)
  to              : Account;     // to.subaccount MUST equal from_subaccount
  amount          : nat;
  fee             : opt nat;     // MUST be null
  memo            : opt blob;    // MUST be null
  created_at_time : opt nat64;
};
```

`icrc1_name`/`symbol`/`decimals`/`metadata` describe **BTC** (the ledger's primary
asset), not individual tokens. For per-token market data read the `Token` record
via `odin_token_by_pointer`; for display name/ticker use Odin's off-chain metadata.

**Balance of any asset** = `icrc1_balance_of({ owner; subaccount = <pointer> })`:
- BTC: `subaccount = null`
- token `hjsu`: `subaccount = odin_token_pointer("hjsu")`
- LP of `hjsu`: `subaccount = odin_token_pointer("lp_hjsu")`

**On success** Odin returns `#Ok(index)` where `index` is the ledger operation
index (treat it as an opaque receipt, not a classic block index).

---

## 5. ICRC-2 — approvals & delegated transfers

```candid
icrc2_approve       : (ApproveArgs)      -> (variant { Ok:nat; Err:ApproveError });
icrc2_transfer_from : (TransferFromArgs) -> (variant { Ok:nat; Err:TransferFromError });
icrc2_allowance     : (AllowanceArgs)    -> (Allowance) query;

type ApproveArgs = record {
  from_subaccount   : opt blob;   // = the token pointer of the asset being approved
  spender           : Account;     // spender.subaccount MUST be null (unsupported otherwise)
  amount            : nat;
  expected_allowance: opt nat;     // optional CAS check
  expires_at        : opt nat64;   // MUST be null (unsupported)
  fee               : opt nat;     // MUST be null
  memo              : opt blob;    // MUST be null
  created_at_time   : opt nat64;
};

type TransferFromArgs = record {
  spender_subaccount : opt blob;   // MUST equal from.subaccount (the token pointer)
  from               : Account;
  to                 : Account;     // to.subaccount MUST equal from.subaccount
  amount             : nat;
  fee                : opt nat;     // MUST be null
  memo               : opt blob;    // MUST be null
  created_at_time    : opt nat64;
};
```

Key Odin specifics:
- **Allowances are keyed by `(owner, spender, tokenid)`** — i.e. per asset. An
  approval on `hjsu` does not authorize spending BTC.
- **Spender subaccounts are not supported** (`spender.subaccount` must be null).
- **`transfer_from` checks `allowance >= amount` only.** The 100-sat BTC fee is
  charged to the `from` account's BTC balance separately — it does **not** come out
  of the allowance. Approve exactly the `amount` you intend to be pulled.
- `expires_at` is **not** supported (must be null); allowances do not auto-expire.

**`icrc2_allowance`** returns `{ allowance : nat; expires_at : opt nat64 }` for a
given `{ account, spender }` — `account.subaccount` selects the asset.

---

## 6. ICRC-4 — batch transfers

```candid
icrc4_transfer_batch : (TransferBatchArgs) -> (variant { Ok: vec record { TransferArgs; TransferResult }; Err: TransferBatchError });

type TransferBatchArgs = record {
  batch_fee    : opt nat;          // MUST be null
  pre_validate : bool;             // MUST be false (pre-validation unsupported)
  transactions : vec TransferArgs; // each follows the ICRC-1 rules above
};
```

- Max **500** transactions per batch (else `#Err(#TooManyTransactions{ max = 500 })`).
- `pre_validate = true` is rejected (code `930`); `batch_fee != null` is rejected (code `901`).
- Each inner transfer is processed independently and follows all ICRC-1/ICRC-80
  rules; the response pairs each input with its individual result. Each successful
  inner transfer costs its own 100-sat BTC fee.

---

## 7. Token pointer encoding (reference)

You normally get pointers from `odin_token_pointer`. For completeness, the 32-byte
layout is:

```
byte[0]      = length  = (id byte count) + 2
byte[1]      = token type   (0 = system, 1 = token, 2 = LP)
byte[2..]    = token index, big-endian (minimal bytes)
byte[len]    = 0x7f  (flag)
byte[len+1..]= 0x00 padding to 32 bytes
```

- **All 32 bytes zero ⇒ BTC** (this is why `null` and all-zero both mean BTC).
- System (type 0): index `0 = btc`, index `1 = rew`.
- Token (type 1) / LP (type 2): index is Odin's **internal numeric index** for the
  token (assigned at mint), *not* the text id — which is why you must use
  `odin_token_pointer("<id>")` / `odin_token_by_pointer` to map text ⇄ pointer.

Example: token at internal index 41 → `03 01 29 7f 00 …00`
(`len=3`, `type=1`, `id=0x29=41`, flag `0x7f`, then zeros).

Decode is the inverse; a malformed pointer (bad flag, non-zero padding, wrong
length) traps — only ever send pointers you got from `odin_token_pointer`.

---

## 8. Errors

Standard ICRC error variants apply (`#InsufficientFunds`, `#InsufficientAllowance`,
`#BadFee`, `#TooOld`, `#TemporarilyUnavailable`, `#TooManyTransactions`, …). Odin
also returns `#GenericError{ message; error_code }` for its own rules:

| code | meaning |
|---|---|
| 80  | ICRC-80 violation: `from` and `to` subaccounts differ |
| 300 | 2FA required / failed (see §9) |
| 900 / 911 / 913 | `memo` / (approve) `memo` / `expires_at` not supported |
| 901 / 912 | `fee` field not supported (transfer / approve / batch) |
| 910 | spender subaccount not supported (approve) / transfer failed (transfer_from) |
| 914 | `spender_subaccount` must equal `from.subaccount` |
| 915 | sender and receiver are the same |
| 920 | insufficient BTC to cover the approval fee |
| 930 | batch `pre_validate` not supported |
| 1000 | ledger in admin shutdown |
| 1001 | account blacklisted |
| 1002 | anonymous principal not allowed |

Common balance errors carry a human message, e.g. *"Insufficient BTC funds to
cover transfer fee of 100 sats"* or *"Insufficient BTC balance: have … need …"*.

---

## 9. 2FA (important for wallets)

Several mutating methods are guarded by Odin's optional 2FA:
- `icrc1_transfer`, `icrc2_approve`, `icrc4_transfer_batch` — challenged **if the
  user has 2FA enabled**.
- `icrc2_transfer_from`, `token_liquidity` — challenged **if the token/account is
  locked**.

If a 2FA challenge is required and not satisfied, the call returns
`#GenericError{ error_code = 300; message = <reason> }`. A wallet that lets users
enable 2FA must complete Odin's 2FA flow before these calls; if your users never
enable 2FA, these behave as normal ICRC calls.

---

## 10. Worked examples (dfx / candid)

> Replace `LEDGER` with the Odin canister id and `OWNER` with a principal.

**Get the pointer for a token**
```bash
dfx canister --network ic call LEDGER odin_token_pointer '("hjsu")'
# -> (blob "\03\01\29\7f\00...")   # 32-byte subaccount for hjsu
```

**BTC balance** (null subaccount)
```bash
dfx canister --network ic call LEDGER icrc1_balance_of '(record { owner = principal "OWNER"; subaccount = null })'
```

**Token balance** (pass the pointer blob from above)
```bash
dfx canister --network ic call LEDGER icrc1_balance_of \
  '(record { owner = principal "OWNER"; subaccount = opt blob "\03\01\29\7f\00..." })'
```

**Transfer a token** (from/to subaccounts identical; fee/memo null)
```bash
dfx canister --network ic call LEDGER icrc1_transfer '(record {
  from_subaccount = opt blob "\03\01\29\7f\00...";
  to = record { owner = principal "RECIPIENT"; subaccount = opt blob "\03\01\29\7f\00..." };
  amount = 1000 : nat;
  fee = null; memo = null; created_at_time = null;
})'
```

**Approve + pull (ICRC-2)** — e.g. authorize a dapp canister to pull BTC
```bash
# 1) approve exactly the amount to be pulled (BTC = null subaccount)
dfx canister --network ic call LEDGER icrc2_approve '(record {
  from_subaccount = null;
  spender = record { owner = principal "DAPP_CANISTER"; subaccount = null };
  amount = 10000000 : nat;            # 10,000 sats in msats
  expected_allowance = null; expires_at = null; fee = null; memo = null; created_at_time = null;
})'
# 2) the dapp later pulls (spender_subaccount must equal from.subaccount)
#    transfer_from(from = user, to = dapp, amount = 10000000), fee = null
```

---

## 11. Wallet integration checklist

- [ ] Register Odin tokens **by token ID** (`(ledger canister id, tokenId)`); derive
      the pointer, balance, and transfers from it. No address/subaccount input.
- [ ] Treat the ledger as **multi-token**; the **subaccount is the token id**.
- [ ] Resolve every non-BTC asset's subaccount via `odin_token_pointer` (cache it).
- [ ] **Display all Odin assets on the user's single main account (their
      principal).** Do **not** create/derive user subaccounts — that field is the
      token selector. Receive address = the principal only.
- [ ] BTC = `null` subaccount, 11 decimals (msats), `1 sat = 1000 msats`;
      launched tokens default to 11 decimals too.
- [ ] On transfers: set `from_subaccount`, `to.subaccount` (and `spender_subaccount`
      for `transfer_from`) to the **same** pointer.
- [ ] Always send `fee = null`, `memo = null`, `expires_at = null`.
- [ ] Ensure the user holds **≥ 100 sats of BTC** for the fee on *any* transfer,
      including token/LP transfers; for BTC sends, need `amount + 100 sats`.
- [ ] ICRC-2 allowance is **per asset**, keyed by `(owner, spender, tokenid)`;
      approve exactly the amount (fee is charged separately in BTC).
- [ ] ICRC-4 batches: ≤ 500 txs, `pre_validate = false`, `batch_fee = null`;
      each inner transfer pays its own fee.
- [ ] Handle `#GenericError{ error_code }` (esp. `80`, `300`, `901/912`, `920`).
- [ ] If supporting 2FA users, complete Odin's 2FA flow before mutating calls.

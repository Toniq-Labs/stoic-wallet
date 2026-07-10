# @dfinity/* → @icp-sdk/core migration — spike assessment

Ran a real spike on branch `agent/icp-sdk-spike`: installed **`@icp-sdk/core@6.0.0`**,
rewrote imports, and built to catalog what actually breaks. Verdict: **very
tractable** — smaller than feared — but it touches core signing/identity, so it
needs a dedicated, tested pass (not a blind bump).

## Scope
Only **11 files** import `@dfinity/*` (~15 imports). Package maps:
- `@dfinity/agent` → `@icp-sdk/core/agent`
- `@dfinity/candid` → `@icp-sdk/core/candid`
- `@dfinity/identity` → `@icp-sdk/core/identity`
- `@dfinity/principal` → `@icp-sdk/core/principal`
- `@dfinity/auth-client` → **NOT in @icp-sdk/core** — stays a separate package (Internet Identity).

## What the spike proved
After the 4 import rewrites **+ one fix** (`blobFromText` removed from candid →
use `new TextEncoder().encode()`), the app **compiles successfully**. So the
import surface is essentially mechanical. BUT a clean compile is misleading: the
old `@dfinity/*` packages were still installed (covering auth-client + two deep
imports), and webpack can't catch the **runtime API changes** below — that's the
real work.

## Runtime breakages to fix (with exact remedy)
| # | Where | Change | Fix |
|---|---|---|---|
| 1 | `extjs.js` (+ caller/consent/trustedOrigins) — 4 sites | `new HttpAgent()` is deprecated | `HttpAgent.createSync(opts)` (sync drop-in — **no async refactor needed** 🎉) |
| 2 | `caller.js` | `new Certificate(state, agent)` — ctor now private | `await Certificate.create({certificate, canisterId, rootKey})` (async) |
| 3 | `caller.js` | `new Expiry(ms)` — ctor private | `Expiry.fromDeltaInMilliseconds(ms)` |
| 4 | `caller.js` | `blobFromText` removed from candid | `new TextEncoder().encode(...)` (done in spike) |
| 5 | `utils.js` | deep imports `@dfinity/principal/lib/esm/utils/{getCrc,sha224}` — not exported by the new package | vendor ~40 lines (CRC32 + sha224) into the repo |
| 6 | `identity.js` | `@dfinity/auth-client@0.9.3` (Internet Identity) | move to a current `@dfinity/auth-client` compatible with `@icp-sdk/core` identities; needs an II login test |
| 7 | tests | jsdom can't import `@dfinity`/`@icp-sdk` (no `TextEncoder`) | add a `src/setupTests.js` polyfill (`TextEncoder`/`crypto`) — unlocks unit-testing this layer for the first time |

Notes: `requestIdOf` stays sync (no change); `pollForResponse` signature changed
(`(agent, effectiveTarget, requestId, options)`), only relevant if we adopt it.
Certificate verification now uses `@noble/hashes` + BLS — confirm mainnet root-key
handling still works without `fetchRootKey` (it should, same as today).

## Effort & risk
**~2–3 focused days**, medium risk. Breakdown:
- Imports + `createSync` + `Expiry`/`blobFromText`: ~2 hrs (mostly done).
- `caller.js` async `Certificate` rewrite + re-verify the ICRC-49 envelope offline: ~2–3 hrs.
- Vendor CRC32/sha224: ~1 hr.
- Internet Identity auth-client modernization + login test: ~½ day (biggest unknown).
- Test polyfill + unit tests + manual smoke (unlock, balances, send ICP/ICRC, receive, signer flow, neuron): ~½ day+.

Risk is concentrated in **signing/identity** (thin test coverage today) and **II
login** — so it must be manually smoke-tested (and ideally the signer flow re-run
via the test harness).

## Recommendation
**Do it, as a dedicated tested PR** — the import surface is tiny and `createSync`
removes the scary async ripple. Bonus: on v6 I can *simplify* `caller.js` and
`delegation.js` using native APIs. Sequence it as one focused branch:
1. imports + `createSync` + `Expiry`/`blobFromText` (compiles).
2. `caller.js` Certificate/Expiry rewrite + offline re-verify.
3. vendor CRC32/sha224; drop the deep imports.
4. auth-client/II upgrade + login test.
5. remove `@dfinity/*` from deps; add test polyfill + unit tests; manual smoke.

New code in the **stoic-identity** and **entrepot** projects should start on
`@icp-sdk/core` directly regardless of when the wallet migrates.

Spike branch `agent/icp-sdk-spike` has steps 1 (compiling) staged as a starting point.

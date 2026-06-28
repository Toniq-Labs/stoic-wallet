# Mobile responsiveness

These screenshots document the mobile-responsiveness pass on the wallet UI.
They are captured with Playwright against the production build at a phone
viewport (390×844) and, for comparison, a desktop viewport (1280×800). A
watch-only wallet is seeded into `localStorage` so the authenticated UI renders
without secrets or live IC connectivity (balances show their loading state —
the focus is layout, not data).

## Regenerating

Playwright is not a project dependency; install it once (like the puppeteer
smoke test):

```bash
npm install --no-save playwright
npx playwright install chromium      # may also need: npx playwright install-deps
npm run build
npm run screenshots                  # writes ./screenshots/<screen>-<device>.png
```

## What changed

- Dialogs (Connect, Receive, Add Token, Wallet create/import, Neuron forms)
  now open **full screen** on phones instead of as a cramped floating modal,
  matching the existing Send/Top-up/Unlock behaviour. The shared
  `src/useIsMobile.js` hook drives this.
- Data tables (Transactions, Applications) no longer force a fixed 650px width
  on phones, so the page no longer scrolls sideways.
- NFT list pagination uses a flex layout instead of `float: right`.
- The account header heading and page padding scale down on small screens.
- The app-authorization popup is capped at `90vw` so it fits narrow viewports.

| Screen | Before | After |
| --- | --- | --- |
| Connect | `connect-mobile-before.png` | `connect-mobile-after.png` |
| Account | `account-mobile-before.png` | `account-mobile-after.png` |

Desktop layout is unchanged (`account-desktop-after.png`).

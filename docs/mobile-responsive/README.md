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

- Dialogs (Connect, Receive, Add Token, Wallet create/import, Neuron forms and
  the shared InputForm) now open **full screen** on phones instead of as a
  cramped floating modal, matching the existing Send/Top-up/Unlock behaviour.
  The shared `src/useIsMobile.js` hook drives this.
- Data tables (Transactions, Applications, NFT list) no longer force a fixed
  650px width on phones, so the page no longer scrolls sideways. The NFT list
  additionally drops its fixed per-column widths on phones so columns size to
  fit the viewport.
- NFT list pagination uses a flex layout instead of `float: right`.
- The account header heading and page padding scale down on small screens.
- The app-authorization popup is capped at `90vw` so it fits narrow viewports.
- The top app-bar keeps its action icons on a single row when the page title is
  long (e.g. "Neuron Management") — the title ellipsizes instead of the icons
  wrapping.

## Screens captured

All screens are captured at a phone viewport; the NFT list also has a desktop
shot to show the table is unchanged there. The NFT screen is captured with a
mocked nftgeek response so the populated list renders.

| Screen | Before | After |
| --- | --- | --- |
| Connect | `connect-mobile-before.png` | `connect-mobile-after.png` |
| Account | `account-mobile-before.png` | `account-mobile-after.png` |
| Transactions | — | `transactions-mobile-after.png` |
| NFT list | — | `nft-mobile-after.png` / `nft-desktop-after.png` |
| Neurons | — | `neurons-mobile-after.png` |
| Address Book | — | `addressbook-mobile-after.png` |
| Applications | — | `applications-mobile-after.png` |
| Settings | — | `settings-mobile-after.png` |
| Navigation drawer | — | `nav-drawer-mobile-after.png` |

Desktop layout is unchanged (`account-desktop-after.png`).

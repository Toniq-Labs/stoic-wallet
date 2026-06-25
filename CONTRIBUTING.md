# Contributing to Stoic Wallet

Thanks for helping improve Stoic Wallet!

## Development setup

This is a Create React App project that currently requires **Node 16** (see `.nvmrc`).

```bash
nvm use            # Node 16
npm install
npm start          # http://localhost:3000
npm test           # run unit tests
npm run build      # production build -> ./build
```

## Pull requests

- Keep PRs small and focused on a single concern.
- Make sure `npm run build` passes (the Netlify deploy preview must be green).
- Add or update tests where it makes sense.
- Follow the existing code style (`.editorconfig` is provided).

## Reporting issues

Use the issue templates. For **security** reports, see [SECURITY.md](SECURITY.md) — please don't open a public issue.

## Smoke test

A headless smoke test boots the built app in a browser and fails on runtime errors
(e.g. a missing webpack polyfill) — the kind a plain `npm run build` can't catch:

```bash
npm install --no-save puppeteer   # one-time, pulls Chromium
npm run build && npm run smoke
```

Network errors (no IC mainnet in CI) are ignored; it only fails on fatal JS errors or a blank app.

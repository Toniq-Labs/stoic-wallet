# Stoic Wallet

Example repo of a simple Stoic implementation: https://github.com/Toniq-Labs/stoic-identity.

Note: the redirect does not require any approvals or whitelisting from Stoic. It is similar to single sign-on.

## Local development

Stoic Wallet is a [Create React App](https://create-react-app.dev/) project built with [CRACO](https://craco.js.org/) (react-scripts 5 / webpack 5).

### Prerequisites

- **Node.js 20** (see `.nvmrc` and the `engines` field in `package.json`).
  Use [nvm](https://github.com/nvm-sh/nvm): `nvm install 20 && nvm use 20`.

### Install & run

```bash
npm install
npm start          # dev server at http://localhost:3000
```

### Production build

```bash
npm run build      # outputs to ./build
```

### Notes

- Talks to IC **mainnet** (`icp0.io`) by default.
- See #55 for ongoing build/dependency health, and
  [stoic-identity](https://github.com/Toniq-Labs/stoic-identity) for integrating Stoic login.

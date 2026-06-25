# Stoic Wallet

Example repo of a simple Stoic implementation: https://github.com/Toniq-Labs/stoic-identity.

Note: the redirect does not require any approvals or whitelisting from Stoic. It is similar to single sign-on.

## Local development

Stoic Wallet is a [Create React App](https://create-react-app.dev/) project.

### Prerequisites

- **Node.js 16** — the `react-scripts@4` toolchain doesn't build on Node ≥ 17.
  Use [nvm](https://github.com/nvm-sh/nvm): `nvm install 16 && nvm use 16` (see `.nvmrc`).

### Install & run

```bash
npm install
npm start          # dev server at http://localhost:3000
```

### Production build

```bash
npm run build      # outputs to ./build
```

> If a build fails with an OpenSSL error on a newer Node, prefix with
> `NODE_OPTIONS=--openssl-legacy-provider`.

### Notes

- Talks to IC **mainnet** (`icp0.io`) by default.
- See #55 for ongoing build/dependency health, and
  [stoic-identity](https://github.com/Toniq-Labs/stoic-identity) for integrating Stoic login.

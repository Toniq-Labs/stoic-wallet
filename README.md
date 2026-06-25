# Stoic Wallet

Example repo of a simple Stoic implementation: https://github.com/Toniq-Labs/stoic-identity.

Note: the redirect does not require any approvals or whitelisting from Stoic. It is similar to single sign-on.

## Local development

Stoic Wallet is a [Create React App](https://create-react-app.dev/) project.

### Prerequisites

- **Node.js 16.** The current `react-scripts@4` toolchain does **not** build on Node ≥ 17
  (`ERR_PACKAGE_PATH_NOT_EXPORTED`). Use [nvm](https://github.com/nvm-sh/nvm):
  `nvm install 16 && nvm use 16`.
- Installing dependencies currently requires a GitHub token with `read:packages` for the private
  `@psychedelic` package, exported as `PAT` (see issue #55 for context / cleanup).

### Install & run

```bash
npm install
npm start            # dev server at http://localhost:3000
```

### Production build

```bash
npm run build        # outputs to ./build
```

> If the build/start scripts fail with an OpenSSL error, prefix them with
> `NODE_OPTIONS=--openssl-legacy-provider`.

### Notes

- The wallet talks to IC **mainnet** (`icp0.io`) by default.
- To integrate Stoic login into your own app, see
  [stoic-identity](https://github.com/Toniq-Labs/stoic-identity).

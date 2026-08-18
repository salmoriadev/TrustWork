# TrustWork web app

React and TypeScript interface for the TrustWork Base Sepolia engineering demo.

- `/` is a static portfolio landing. It initializes neither the API nor a wallet provider.
- `/app` is an anonymously browsable marketplace for indexed testnet escrows.
- Wallet connection is optional and uses one EIP-1193 session for SIWE authentication, message signing, and every contract write.
- Evidence files and notes are SHA-256 hashed in the browser; original contents remain with the user.

## Run locally

Use Node 20:

```bash
npm ci
npm run dev
```

Copy the repository `.env.example` to `.env` when connecting to a local or deployed API. Vite fixtures are development-only and require `VITE_ENABLE_DEMO_DATA=true`.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build:production
npm run lighthouse
npm audit --omit=dev
```

Playwright covers direct `/app` routing, anonymous browsing, cold-start recovery, wallet cancellation, wrong-network rejection, axe accessibility checks, and responsive widths. Lighthouse enforces the portfolio thresholds defined in `lighthouserc.json`.

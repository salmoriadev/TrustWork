# Portfolio deployment runbook

This runbook creates the fixed free-tier architecture: Vercel Hobby, Render free Docker web service, Neon free PostgreSQL, and Base Sepolia. Koyeb is the documented fallback if Render's free service is unavailable at deployment time.

## 1. Provider checkpoint

Create provider accounts and store secrets only in encrypted keystores, provider stores, or GitHub secret stores. Required secrets are: dedicated deployer keystore password, scoped Base Sepolia RPC URL, Neon `DATABASE_URL`, `JWT_SECRET`, independent `INDEXER_TOKEN`, WalletConnect project ID, and GitHub deployment credentials. Never paste these values into issues, logs, screenshots, shell variables, or repository files.

## 2. Deploy and verify the escrow

1. Create a dedicated Base Sepolia-only deployer in an encrypted Foundry keystore and fund its public address with faucet ETH.
2. Set the public `DEPLOYER_ADDRESS`, optional role addresses, fee, cap, and RPC URL. Keep the keystore password out of shell variables.
3. From `contracts/`, run `DeploySepolia.s.sol` with `--account <keystore-name> --sender "$DEPLOYER_ADDRESS" --broadcast --verify` against Base Sepolia. Foundry prompts for the keystore password without exposing the private key.
4. Confirm the immutable accepted token is official Base Sepolia USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`.
5. Record the escrow address, deployment block, transaction hash, verification URL, admin, arbitrator, fee recipient, fee, and cap in the release notes. Do not commit the key or RPC credential.

Rollback before application launch: deploy a corrected contract, update provider configuration, and do not seed the superseded address. Contracts cannot be undeployed.

## 3. Create public portfolio jobs

Create a small set of clearly labelled testnet jobs using test USDC. Do not invent user, revenue, performance, adoption, or volume claims. Run reconciliation, then attach English titles and summaries idempotently:

```bash
cd backend
SEED_JOBS_JSON='[{"onchain_job_id":"<id>","title":"<title>","public_summary":"<summary>"}]' \
  uv run python scripts/seed_portfolio.py
```

The seed command fails rather than creating metadata for a job that was not indexed from chain events.

## 4. Provision Neon

1. Create a free PostgreSQL project in the nearest practical region.
2. Copy the pooled TLS connection string directly into Render's `DATABASE_URL` secret.
3. From a trusted shell, run `cd backend && DATABASE_URL='<Neon URL>' uv run alembic upgrade head`.
4. Confirm `alembic current` reports `0002_auth_and_cursor (head)`.

Rollback: restore the pre-migration Neon branch or run a reviewed Alembic downgrade only when the migration explicitly supports it.

## 5. Deploy Render

1. Push the reviewed commit to GitHub.
2. In Render, create a Blueprint from `render.yaml`.
3. Fill every `sync: false` variable. Use the final Vercel origin for CORS/SIWE after Vercel is assigned.
4. Confirm the Docker build includes the ABI and Alembic reaches head.
5. Confirm `/health/live` returns 200 and `/health/ready` reports database, RPC, chain ID 84532, bytecode, and ABI as ready.

If Render free web services are no longer viable, create an equivalent Koyeb Docker service with the same environment and health routes. Record the substitution in the release.

## 6. Deploy Vercel

Import the repository using root configuration in `vercel.json`. Set all `VITE_*` values from `.env.portfolio.example`. Browser variables are public by design; never use a deployer key, JWT secret, indexer token, private database URL, or privileged RPC credential as a `VITE_*` value.

Deploy a preview first. Confirm direct navigation to `/app` works, then promote the tested deployment to production. Update Render's `API_CORS_ORIGINS`, `SIWE_DOMAIN`, and `SIWE_ORIGIN` to the final production hostname.

Rollback: promote the previous Vercel deployment and restore the corresponding Render environment values.

## 7. Scheduled reconciliation

Keep the repository variable `PORTFOLIO_DEPLOYED` set to `false` until the API passes the live smoke test. Add repository secrets `TRUSTWORK_API_URL` and `INDEXER_TOKEN`, set `PORTFOLIO_DEPLOYED=true`, then manually run `Reconcile Base Sepolia events`. Confirm the protected endpoint returns the latest and indexed-through blocks before relying on its six-hour schedule. When the variable is not `true`, the workflow succeeds with an explicit deployment-pending notice; after activation, missing secrets or an unhealthy API fail the run.

## 8. Live smoke test

- `/` metadata is English and the landing triggers no API or wallet initialization.
- Direct `/app` navigation returns the SPA and shows the persistent testnet notice.
- Render readiness confirms Neon, Base Sepolia 84532, contract bytecode, and baked ABI.
- Anonymous browsing returns the seeded indexed jobs.
- CORS accepts only the final Vercel origin.
- Wrong-chain wallet attempts are switched or rejected before signing.
- A small testnet write progresses through signature, submitted, confirmed, indexed, and BaseScan link states.
- Evidence content is absent from API requests and database records.
- Production bundles contain no fixtures, local chain addresses, secrets, stock image URLs, or mainnet claims.

Only after these checks pass should the README, GitHub About section, social preview, release, and LinkedIn post receive live URLs and verified transaction links.

# TrustWork API

FastAPI service for TrustWork's off-chain metadata, wallet authentication, Base Sepolia event projection, evidence-integrity records, and reputation snapshots.

## Local development

Use Python 3.12 and [uv](https://docs.astral.sh/uv/):

```bash
docker compose up -d postgres
uv sync --extra dev --locked
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

Run these commands from `backend/`; the Compose command may also be run from the repository root. Configuration is read from `backend/.env` or the root `.env`.

## API boundaries

- `GET /health/live` checks process liveness.
- `GET /health/ready` checks PostgreSQL, RPC chain ID, escrow bytecode, and the baked ABI.
- Anonymous visitors may read indexed jobs, public profiles, escrow configuration, and reputation.
- `POST /auth/challenge` and `POST /auth/verify` provide a single-use EIP-4361-compatible login flow.
- Profile, interest, evidence, reputation-refresh, job-preparation, and receipt-sync mutations require a short-lived bearer token.
- `POST /indexer/reconcile` and the bulk reputation refresh require the separate `X-Indexer-Token` secret.

The API derives every mutation actor from the verified token. Evidence bodies are rejected; only a `bytes32` digest and bounded metadata are accepted.

## Indexer

The event indexer stores a persistent confirmed-block cursor and replays a small window on every reconciliation. Its event identity makes repeat processing idempotent. Run it continuously with:

```bash
uv run python -m app.services.event_indexer
```

The portfolio deployment instead uses scheduled reconciliation plus an exact receipt-block synchronization after authenticated browser writes.

## Tests and migrations

```bash
uv run ruff check app tests scripts migrations
uv run pytest
uv run alembic upgrade head
uv run pip-audit
```

See the [deployment runbook](../docs/deployment.md) for Neon and Render setup.

# Database model

Alembic migrations in `backend/migrations/versions/` are the authoritative PostgreSQL schema. Apply them with `uv run alembic upgrade head`; do not initialize a deployment from a handwritten SQL dump.

## Core records

| Table | Purpose | Important guarantees |
| --- | --- | --- |
| `users` | Public wallet profiles | Wallet address is unique and normalized. |
| `jobs` | Indexed escrow jobs plus public portfolio metadata | Chain, contract, and positive on-chain job ID are unique together. |
| `milestones` | Indexed milestone state and amounts | Belongs to one job and one on-chain index. |
| `disputes` | Indexed dispute state | References the projected job and milestone. |
| `evidence` | Integrity-proof metadata | Stores digest, filename, media type, size, job reference, and verified uploader—never the original body. |
| `swipes` / `matches` | Authenticated opportunity interests | Actor wallet is derived from the bearer token. |
| `reputation_snapshots` | Derived public execution signals | Rebuilt from indexed chain state. |
| `indexed_events` | Idempotent raw event ledger | Log identity is unique; block hash supports replay handling. |
| `indexer_cursors` | Persistent indexing progress | One cursor per chain and escrow contract. |
| `auth_challenges` | Single-use wallet login challenges | Stores hashed nonce/message with expiry and consumption time. |

## Privacy and security boundaries

- Authentication challenges expire and cannot be replayed.
- Access tokens are not persisted in PostgreSQL or browser storage.
- Evidence content and encryption keys are outside the database contract.
- The indexer replays a configurable window and upserts projections idempotently.
- Production database credentials exist only in Neon and Render secret stores.

See the generated `backend/openapi.json` for request/response shapes and [deployment.md](deployment.md) for migration and rollback operations.

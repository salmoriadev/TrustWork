# Backend FastAPI

Backend operacional para metadados off-chain, projecao dos eventos do escrow, cache/notificacoes Redis e metricas de reputacao.

## Rodar localmente

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Suba Postgres e Redis pelo compose na raiz:

```bash
docker compose up -d postgres redis
```

## Endpoints iniciais

- `GET /health`
- `GET /jobs/{onchain_job_id}`
- `GET /reputation/{wallet_address}`

## Indexer

O indexer deve ser executado como processo separado:

```bash
python -m app.services.event_indexer
```

Ele persiste eventos por `(chain_id, contract_address, block_number, tx_hash, log_index)` antes de publicar notificacoes no Redis. A evolucao natural e mover os handlers para workers transacionais por evento.

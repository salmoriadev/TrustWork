# Resultado - Fase 00 Validacao da Base

Data: 2026-06-28

## Status Geral

Fase 00 implementada. A base foi validada em contratos, frontend, backend e infraestrutura local.

## Correcoes Aplicadas

- `backend/pyproject.toml`: configurado `build-system` e descoberta explicita de pacotes `app*`, corrigindo falha de `pip install -e .` causada por deteccao indevida de `sql` como pacote Python.
- `backend/pyproject.toml`: trocado `uvicorn[standard]` por `uvicorn`, reduzindo dependencias extras desnecessarias para o MVP local.
- `backend/pyproject.toml`: adicionado `httpx2` em dependencias de desenvolvimento para compatibilidade com `fastapi.testclient`/Starlette atual.
- `backend/pyproject.toml`: configurado Ruff para ignorar `B008`, padrao comum em rotas FastAPI com `Depends(...)`.
- `backend/app/core/config.py`, `backend/app/models.py`, `backend/app/services/event_projector.py`: ajustes de lint sem mudar regra de negocio.
- `docker-compose.yml`: portas de Postgres e Redis passaram a aceitar override por variavel de ambiente, mantendo os defaults `5432` e `6379`.
- `contracts/lib/forge-std` e `contracts/lib/openzeppelin-contracts`: dependencias Solidity instaladas via Foundry.

## Validacoes Executadas

### Ferramentas

- `node --version`: `v25.2.1`
- `npm --version`: `11.12.1`
- `python --version`: `Python 3.14.3`
- `docker --version`: `Docker version 29.3.0`
- `docker compose version`: `Docker Compose version 5.1.0`
- `forge --version`: `forge 1.7.1`

### Contratos

Comandos:

```bash
forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts
forge test
```

Resultado:

- Compilacao Solidity concluida com sucesso.
- Testes Foundry: `6 passed; 0 failed; 0 skipped`.
- Aviso residual: `_sign` em `contracts/test/FreelanceEscrow.t.sol` pode ser `pure`; nao bloqueia o MVP.

### Frontend

Comando:

```bash
npm ci && npm run build
```

Resultado:

- Install concluido.
- Build Vite concluido com sucesso.
- Observacao: `npm audit` reportou `20 vulnerabilities` em dependencias transitivas. Nao bloqueia a Fase 00, mas deve ser tratado antes de beta publico.

### Backend

Comandos:

```bash
python -m venv .venv
.venv/bin/pip install -e ".[dev]"
.venv/bin/python -c "from app.main import app; print(app.title, app.version)"
.venv/bin/python -c "from fastapi.testclient import TestClient; from app.main import app; response = TestClient(app).get('/health'); print(response.status_code, response.json())"
.venv/bin/ruff check app
```

Resultado:

- Dependencias instaladas com sucesso apos ajustes no `pyproject.toml`.
- App FastAPI importa corretamente: `Freelance Escrow API 0.1.0`.
- `GET /health` retorna `200 {'status': 'ok'}`.
- Ruff: `All checks passed!`.

### Infra Local

Comandos:

```bash
docker compose up -d postgres redis
POSTGRES_PORT=55432 docker compose up -d postgres
POSTGRES_PORT=55432 docker compose ps
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:55432/freelance_escrow .venv/bin/python -c "from sqlalchemy import text; from app.db.session import engine; conn = engine.connect(); print(conn.execute(text('select 1')).scalar()); conn.close()"
```

Resultado:

- Redis subiu saudavel na porta default `6379`.
- Postgres nao pode usar a porta default `5432` porque ela ja estava ocupada no host.
- Postgres foi validado com override `POSTGRES_PORT=55432`.
- Conexao SQL via backend retornou `1`.

## Pendencias Nao Bloqueantes

- Investigar e reduzir vulnerabilidades reportadas pelo `npm audit`.
- Se quiser usar Postgres na porta default, liberar a porta local `5432` ou continuar usando `POSTGRES_PORT=55432`.
- Considerar fixar versoes principais de dependencias Python antes de CI/producao para reduzir variacao futura.

## Conclusao

A base esta validada para avancar para a Fase 01 - Demo Local E2E.

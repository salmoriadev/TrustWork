# Resultado - Fase 01 Demo Local E2E

Data: 2026-06-28

## Status Geral

Fase 01 implementada. A demo local ponta a ponta foi validada com Anvil, contrato deployado, job criado/fundeado on-chain, eventos indexados no Postgres, backend expondo os dados e frontend preparado para consumir `GET /jobs`.

## Enderecos Locais

- Chain ID: `31337`
- RPC: `http://127.0.0.1:8545`
- `MockUSDC`: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- `FreelanceEscrow`: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- Client/Admin: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Freelancer demo: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- Job demo: `1001`

## Portas Usadas

- Anvil: `8545`
- Postgres: `55432` no host, mapeado para `5432` no container
- Redis: `6379`
- Backend validado: `18080`
- Frontend Vite validado: `15174`

As portas `8000` e `8001` ja estavam ocupadas no host durante a validacao, por isso o backend foi validado em `18080`.

## Implementacao Aplicada

- Adicionado `GET /jobs` no backend para listar jobs projetados com milestones.
- Adicionado `frontend/src/lib/api.ts` para converter `JobRead` da API em `MarketplaceJob` da UI.
- Atualizado `App.tsx` para buscar jobs reais via `VITE_API_BASE_URL` e cair para mocks se a API estiver indisponivel.
- Atualizados tipos frontend para aceitar todos os estados retornados pelo contrato/backend.
- Atualizado `EscrowTimeline` para reconhecer milestone `Approved`.
- Adicionado `contracts/script/CreateDemoJob.s.sol` para criar e fundear um job local reproduzivel.
- Criado `.env` local ignorado pelo Git com enderecos do deploy Anvil e conexao local.

## Validacoes Executadas

### Anvil

```bash
anvil --host 127.0.0.1 --port 8545
cast block-number --rpc-url http://127.0.0.1:8545
```

Resultado: Anvil respondeu bloco `0` antes dos deploys.

### Deploy Local

```bash
forge script script/DeployLocal.s.sol:DeployLocal \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

Resultado:

- `MockUSDC`: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- `FreelanceEscrow`: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`

### Criacao do Job Demo

```bash
ESCROW_CONTRACT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 \
USDC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3 \
DEMO_JOB_ID=1001 \
forge script script/CreateDemoJob.s.sol:CreateDemoJob \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

Resultado:

- Job `1001` criado.
- Job `1001` fundeado.
- Dois milestones criados: `1_200 USDC` e `800 USDC`.

### Indexer One-Shot

```bash
.venv/bin/python -c "from app.services.event_indexer import EscrowEventIndexer; indexer = EscrowEventIndexer(); latest = indexer.web3.eth.block_number; indexer.poll_range(0, latest); print({'latest_block': latest})"
```

Resultado final da sessao:

- Latest block processado: `5`.
- `indexed_events`: `14` registros apos redeploy/replay local.
- `jobs`: `1` registro.
- `milestones`: `2` registros.
- Job projetado: `1001`, status `Funded`, total `2000000000` unidades raw de USDC.

Observacao: em um banco limpo, o primeiro replay do fluxo gera 7 eventos indexados. Como o Anvil foi reiniciado durante a validacao e o fluxo foi reexecutado, novos logs locais tambem foram gravados em `indexed_events`. A projecao operacional permaneceu correta com 1 job e 2 milestones.

### Backend API

```bash
uvicorn app.main:app --host 127.0.0.1 --port 18080
```

Validacao:

```bash
GET http://127.0.0.1:18080/health
GET http://127.0.0.1:18080/jobs
GET http://127.0.0.1:18080/jobs/1001
```

Resultado:

- `/health`: `200 {'status': 'ok'}`.
- `/jobs`: retornou 1 job, `onchain_job_id=1001`, `status=Funded`.
- `/jobs/1001`: retornou o job projetado.

### Frontend

```bash
VITE_API_BASE_URL=http://127.0.0.1:18080 npm run build
VITE_API_BASE_URL=http://127.0.0.1:18080 npm run dev -- --host 127.0.0.1 --port 15174
```

Resultado:

- Build TypeScript/Vite concluido com sucesso.
- Vite serviu a pagina em `http://127.0.0.1:15174`.
- API real retornou o job `1001 Funded` usado pela tela via `fetchMarketplaceJobs()`.

### Regressao

```bash
backend/.venv/bin/ruff check app
frontend: VITE_API_BASE_URL=http://127.0.0.1:18080 npm run build
contracts: forge test
```

Resultado:

- Ruff: `All checks passed!`
- Frontend build: sucesso.
- Foundry: `6 passed; 0 failed; 0 skipped`.

## Como Reproduzir

1. Subir infra:

```bash
POSTGRES_PORT=55432 docker compose up -d postgres redis
```

2. Subir Anvil:

```bash
cd contracts
anvil --host 127.0.0.1 --port 8545
```

3. Deployar contratos:

```bash
cd contracts
forge script script/DeployLocal.s.sol:DeployLocal --rpc-url http://127.0.0.1:8545 --broadcast
```

4. Atualizar `.env` com os enderecos impressos pelo deploy.

5. Criar job demo:

```bash
cd contracts
ESCROW_CONTRACT_ADDRESS=<ESCROW> USDC_CONTRACT_ADDRESS=<USDC> DEMO_JOB_ID=1001 \
  forge script script/CreateDemoJob.s.sol:CreateDemoJob --rpc-url http://127.0.0.1:8545 --broadcast
```

6. Rodar indexer one-shot:

```bash
cd backend
.venv/bin/python -c "from app.services.event_indexer import EscrowEventIndexer; indexer = EscrowEventIndexer(); latest = indexer.web3.eth.block_number; indexer.poll_range(0, latest); print({'latest_block': latest})"
```

7. Subir backend:

```bash
cd backend
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 18080
```

8. Subir frontend:

```bash
cd frontend
VITE_API_BASE_URL=http://127.0.0.1:18080 npm run dev -- --host 127.0.0.1 --port 15174
```

## Observacoes

- O frontend ainda nao cria jobs pela UI; ele apenas consome jobs ja indexados. Isso esta alinhado ao escopo da Fase 01.
- O indexer foi validado em modo one-shot. O modo continuo `poll_forever` fica para fases seguintes ou uso operacional.
- `title` e `public_summary` aparecem nulos porque a Fase 01 projeta somente eventos on-chain. Metadados off-chain completos entram nas fases de produto.

## Conclusao

A Fase 01 esta concluida. A aplicacao ja demonstra o fluxo minimo on-chain -> indexer -> PostgreSQL -> FastAPI -> frontend.

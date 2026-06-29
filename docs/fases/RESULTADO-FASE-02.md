# Resultado - Fase 02 Fluxo Escrow Real

Data: 2026-06-28

## Status Geral

Fase 02 iniciada. Foi implementado o primeiro corte funcional para executar chamadas reais no contrato a partir do frontend, com apoio de endpoints backend para preparar transacoes e sincronizar eventos on-chain sob demanda.

## Implementado Nesta Iteracao

### Backend

- `GET /escrow/config`: expõe `chain_id`, contrato escrow, contrato USDC e arbitro configurado.
- `POST /jobs/prepare`: valida uma carteira de freelancer e valores de milestones, gera/retorna `job_id`, total e parametros para `createJob`/`fundJob`.
- `POST /indexer/poll`: executa replay idempotente do indexer ate o bloco atual para demos locais sem worker continuo.
- Configuracao adicionada para `USDC_CONTRACT_ADDRESS` e `ESCROW_ARBITRATOR`.

### Frontend

- `frontend/src/lib/contracts.ts`: camada Web3 com Viem para chamadas reais:
  - `approve` de USDC.
  - `createJob`.
  - `fundJob`.
  - `submitMilestone`.
  - `approveMilestone`.
  - `requestRevision`.
  - `openDispute`.
  - `releaseAfterTimeout`.
- `EscrowActionPanel`: painel operacional para preparar job, assinar transacoes, executar acoes de milestone e sincronizar eventos.
- `App.tsx`: painel da Fase 02 integrado ao sidebar e refresh dos jobs reais apos sincronizacao.

## Validacoes Executadas

### Backend

```bash
.venv/bin/python -c "from fastapi.testclient import TestClient; from app.main import app; c=TestClient(app); print(c.get('/escrow/config').status_code); r=c.post('/jobs/prepare', json={'freelancer_wallet':'0x70997970C51812dc3A010C7d01b50e0d17dc79C8','milestone_amounts_raw':[1200000000,800000000]}); print(r.status_code, r.json()['total_amount_raw'])"
.venv/bin/ruff check app
```

Resultado:

- `GET /escrow/config`: `200`.
- `POST /jobs/prepare`: `200`, total `2000000000`.
- Ruff: `All checks passed!`.

### Frontend

```bash
npm run build
```

Resultado:

- TypeScript e Vite build passaram.

### Contratos

```bash
forge test
```

Resultado:

- `6 passed; 0 failed; 0 skipped`.

### Demo Local Ativa

- Backend reiniciado em `http://127.0.0.1:18080` com as novas rotas.
- `POST /indexer/poll` validado contra Anvil local, retornando bloco `5`.
- Frontend Vite em `http://127.0.0.1:15174` deve consumir o backend configurado por `VITE_API_BASE_URL=http://127.0.0.1:18080`.

## Como Testar Manualmente

1. Abrir `http://127.0.0.1:15174`.
2. Usar uma carteira EIP-1193, como MetaMask, apontada para Anvil `31337`.
3. Preparar um job com freelancer e milestones no painel `Fase 02`.
4. Assinar `Approve USDC`.
5. Assinar `createJob`.
6. Assinar `fundJob`.
7. Clicar em sincronizar eventos para atualizar a projecao via backend.
8. Usar as acoes de milestone (`submit`, `approve`, `revision`, `dispute`, `releaseAfterTimeout`) conforme a carteira conectada tenha permissao no contrato.

## Ainda Falta Para Concluir A Fase 02

- Testar manualmente cada chamada com carteiras Anvil importadas no navegador.
- Adicionar estados de loading por botao em vez de status unico.
- Melhorar mensagens de erro de permissao por papel: cliente, freelancer e arbitro.
- Automatizar refresh continuo ou orientar execucao do indexer em worker persistente.
- Criar fluxo visual dedicado para job criado pela UI, em vez de painel operacional compacto.

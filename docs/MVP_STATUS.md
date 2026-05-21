# Status do MVP

Este documento resume o que ja foi implementado e o que ainda precisa ser feito para transformar a base atual em um MVP demonstravel de ponta a ponta.

## Ja implementado

### Smart contracts

- `FreelanceEscrow.sol` com lifecycle de jobs e milestones.
- Custodia em ERC-20, preparada para USDC.
- Estados de job: `Created`, `Funded`, `InProgress`, `Completed`, `Cancelled`, `Disputed`, `Resolved`.
- Estados de milestone: `Pending`, `Submitted`, `Released`, `RevisionRequested`, `Disputed`, `Resolved`.
- Fluxos de aprovacao, revisao, disputa, timeout e cancelamento mutuo.
- Fee de plataforma em basis points.
- Cap maximo por job para reduzir risco financeiro no MVP.
- `pause()` administrativo sem permitir saque de fundos dos usuarios.
- Eventos para indexacao off-chain.
- `MockUSDC.sol` para rede local.
- `DeployLocal.s.sol` para deploy local com Anvil.

### Backend

- FastAPI estruturado em `backend/app`.
- Configuracao via variaveis de ambiente.
- SQLAlchemy models para users, jobs, milestones, disputes, indexed events e reputation snapshots.
- Endpoints iniciais:
  - `GET /health`
  - `GET /jobs/{onchain_job_id}`
  - `GET /reputation/{wallet_address}`
- Schema SQL em `backend/sql/schema.sql`.
- Indexer de eventos Web3 com persistencia idempotente.
- Projector de eventos para atualizar tabelas de estado.
- Servico base de reputacao com tiers e calculo em BPS.

### Frontend

- App React + TypeScript + Tailwind.
- Tela principal operacional, sem landing page.
- Deck de swipe com jobs recomendados.
- Timeline de escrow com milestones.
- Painel de reputacao verificavel.
- Barra de wallet preparada para WalletConnect.
- Build Vite validado localmente.

### Infra e documentacao

- `docker-compose.yml` para Postgres e Redis.
- `.env.example` com variaveis esperadas.
- `.gitignore` protegendo arquivos sensiveis, dependencias e artefatos de build.
- Documentacao de arquitetura em `docs/ARQUITETURA_MVP.md`.
- Documentacao de banco em `docs/DATABASE_SCHEMA.md`.
- Roadmap tecnico em `docs/ROADMAP.md`.

## Falta implementar

### Para demo local completa

- Instalar Foundry na maquina dos desenvolvedores.
- Rodar `forge install` e `forge test`.
- Subir `anvil`.
- Deployar `MockUSDC` e `FreelanceEscrow` usando `DeployLocal.s.sol`.
- Copiar os enderecos gerados para `.env`.
- Rodar Postgres e Redis com Docker.
- Rodar backend FastAPI.
- Rodar indexer apontando para `http://127.0.0.1:8545`.
- Trocar dados mockados do frontend por chamadas reais para o backend.

### Produto

- Criar endpoint para criar job off-chain e preparar chamada on-chain.
- Criar fluxo frontend para `createJob`.
- Criar fluxo frontend para approve de USDC e `fundJob`.
- Criar fluxo frontend para submit de milestone com hash de evidencia.
- Criar fluxo frontend para approve, request revision, open dispute e timeout release.
- Implementar upload real de evidencias em storage privado.
- Implementar autenticacao por assinatura de wallet.
- Implementar permissoes privadas de reputacao.
- Implementar painel de arbitragem humana.
- Implementar notificacoes via Redis/WebSocket.
- Implementar deteccao de padroes Sybil no backend.

### Qualidade e deploy

- Adicionar migracoes Alembic.
- Adicionar testes automatizados do backend.
- Adicionar testes de integracao frontend/backend.
- Adicionar CI.
- Validar deploy em Base Sepolia.
- Fazer auditoria do contrato antes de qualquer uso com valor real.

## Como rodar localmente

Terminal 1:

```bash
anvil
```

Terminal 2:

```bash
cd contracts
forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts
forge test
forge script script/DeployLocal.s.sol:DeployLocal --rpc-url http://127.0.0.1:8545 --broadcast
```

Terminal 3:

```bash
docker compose up -d postgres redis
```

Terminal 4:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Terminal 5:

```bash
cd frontend
npm install
npm run dev
```

## Segredos que nao devem ir para Git

- `.env`
- private keys
- mnemonic phrases
- keystores
- RPC URLs privados
- WalletConnect Project IDs privados, se o projeto decidir tratar como segredo operacional
- dumps de banco
- arquivos de evidencia privados

# Swipe-Based Freelance Marketplace com Blockchain Escrow

MVP Web2/Web3 para marketplace freelance internacional com descoberta por swipe, pagamentos em USDC e escrow multifasico em smart contract.

O principio central do projeto e manter aplicacao, recomendacao, chat, arquivos e privacidade off-chain, usando a blockchain somente para liquidacao financeira, maquina de estados de escrow e integridade das evidencias.

## Estrutura do repositorio

```text
.
|-- contracts/              # Foundry + Solidity escrow
|-- backend/                # FastAPI, PostgreSQL, Redis e indexer de eventos
|-- frontend/               # React, TypeScript e Tailwind CSS
|-- docs/                   # Documentacao de arquitetura e modelo de dados
|-- docker-compose.yml      # Infra local para Postgres e Redis
`-- .env.example            # Variaveis base do projeto
```

## Comeco rapido

### 1. Preparar o checkout

Requisitos: Git, Node.js 20+, npm, Python 3.11+, [uv](https://docs.astral.sh/uv/) e Foundry 1.7.1.

```bash
./scripts/bootstrap.sh
```

O comando inicializa os submodulos nas revisoes de `contracts/foundry.lock`, sincroniza o backend
por `backend/uv.lock`, instala o frontend com `npm ci` e compila os contratos.

### 2. Validar tudo

Com PostgreSQL disponivel conforme `DATABASE_URL`:

```bash
./scripts/check.sh
```

Para validar tambem RPC, chain ID e bytecode dos contratos configurados, use
`VALIDATE_CHAIN=1 ./scripts/check.sh` em staging ou producao.

### 3. Executar a stack local

```bash
./demo.sh
```

O script sobe Postgres, Redis, Anvil, contratos, API e frontend. Ele encerra somente os processos
que iniciou e falha caso uma porta necessaria ja esteja ocupada.

### Execucao manual dos contratos

```bash
git submodule update --init --recursive
forge test --root contracts
```

Para rodar localmente como se fosse Ganache, use o Anvil:

```bash
anvil
```

Em outro terminal:

```bash
cd contracts
forge script script/DeployLocal.s.sol:DeployLocal --rpc-url http://127.0.0.1:8545 --broadcast
```

O script local deploya um `MockUSDC` e o contrato `FreelanceEscrow`. Depois do deploy, copie os enderecos impressos para `.env`.

### Execucao manual do backend

```bash
cd backend
uv sync --extra dev --locked
uv run uvicorn app.main:app --reload
```

### Execucao manual do frontend

```bash
cd frontend
npm ci
npm run dev
```

## Documentos principais

- [Arquitetura do MVP](docs/ARQUITETURA_MVP.md)
- [Schema PostgreSQL](docs/DATABASE_SCHEMA.md)
- [Status e pendencias do MVP](docs/MVP_STATUS.md)
- [Trilha de producao e comercializacao](docs/producao/README.md)
- [Roadmap de producao - fases 10 a 18](docs/producao/ROADMAP-PRODUCAO.md)
- [Release gates](docs/producao/RELEASE-GATES.md)
- [Contrato Escrow](contracts/src/FreelanceEscrow.sol)
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)

## O que ja temos

Este repositorio ja contem uma base inicial funcional para evoluir o MVP:

- Contrato Solidity com estados de job, milestones, disputas, timeout, cancelamento mutuo, fee e cap de valor.
- `MockUSDC` para testes locais e script de deploy em rede local Anvil.
- Testes Foundry cobrindo fluxos centrais do escrow.
- Schema PostgreSQL reconstruivel a partir de eventos on-chain.
- Backend FastAPI com modelos, endpoints iniciais, indexer idempotente e projector de eventos.
- Frontend React com experiencia inicial de swipe, wallet, timeline de escrow e reputacao verificavel.
- Docker Compose para Postgres e Redis.
- `.env.example` com variaveis necessarias sem expor segredos.

## Proximo ciclo

As fases 00-09 registram a construcao historica do MVP. O trabalho necessario para completar
identidade, wallet, evidencias, contrato, operacao e compliance esta detalhado na
[trilha de producao](docs/producao/README.md). Esse documento e a fonte vigente para planejar um
deploy comercial.

## O que ainda falta para fechar o MVP

- Integrar WalletConnect ao mesmo provider usado pelas escritas e acompanhar receipts/reverts.
- Tornar o indexador continuo, autenticado, resiliente a reorg e operavel em staging.
- Completar a jornada de criacao, funding, submit, approve, dispute e timeout com estados reais.
- Implementar storage privado para entregas/evidencias.
- Criar autenticacao por wallet de ponta a ponta.
- Adicionar migracoes de banco e scripts de seed para demo.
- Fazer deploy em Base Sepolia depois que o fluxo local estiver estavel.

## Observacoes de seguranca

- Nunca commitar `.env`, private keys, mnemonic phrases, keystores ou dumps de banco.
- O contrato nao possui funcao administrativa para sacar fundos de usuarios.
- Em producao, `ESCROW_ADMIN` deve ser multisig.
- Para Base Mainnet, usar apenas o endereco oficial do USDC da rede Base.

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

### 1. Contratos

```bash
cd contracts
forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts
forge test
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

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

## Documentos principais

- [Arquitetura do MVP](docs/ARQUITETURA_MVP.md)
- [Schema PostgreSQL](docs/DATABASE_SCHEMA.md)
- [Status e pendencias do MVP](docs/MVP_STATUS.md)
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

## O que ainda falta para fechar o MVP

- Instalar Foundry localmente para compilar, testar e fazer deploy dos contratos.
- Rodar `forge test` e corrigir qualquer incompatibilidade de versao/dependencia.
- Subir Anvil, deployar `MockUSDC` + `FreelanceEscrow` e salvar os enderecos no `.env`.
- Conectar o frontend aos endpoints reais do backend, removendo mocks da tela principal.
- Ligar o backend ao contrato local via RPC e rodar o indexer continuamente.
- Criar fluxo completo de criacao de job, aprovacao de USDC, funding, submit, approve, dispute e timeout.
- Implementar storage privado para entregas/evidencias.
- Criar autenticacao por wallet de ponta a ponta.
- Adicionar migracoes de banco e scripts de seed para demo.
- Fazer deploy em Base Sepolia depois que o fluxo local estiver estavel.

## Observacoes de seguranca

- Nunca commitar `.env`, private keys, mnemonic phrases, keystores ou dumps de banco.
- O contrato nao possui funcao administrativa para sacar fundos de usuarios.
- Em producao, `ESCROW_ADMIN` deve ser multisig.
- Para Base Mainnet, usar apenas o endereco oficial do USDC da rede Base.

# Resultado - Fase 07 Staging Base Sepolia

Data: 2026-06-29

## Status Geral

Fase 07 iniciada. Foi criada a base de staging: script de deploy para Base Sepolia,
backend containerizado, documentação de configuração e guia de deploy.

## Implementado Nesta Iteracao

### Contratos

- `contracts/script/DeploySepolia.s.sol`: script Foundry que faz deploy do
  `FreelanceEscrow` em Base Sepolia usando USDC oficial
  (`0x036CbD53842c5426634e7929541eC2318f3dCF7e`) sem deploy de MockUSDC.
- Lê `PRIVATE_KEY`, `ESCROW_ADMIN`, `ESCROW_ARBITRATOR`, `FEE_RECIPIENT`,
  `PLATFORM_FEE_BPS` e `MAX_JOB_AMOUNT` de env vars.

### Backend/DevOps

- `backend/Dockerfile`: imagem slim Python 3.12 para staging.
- `.env.example` reorganizado com seção dedicada a Sepolia, alertas de segurança
  para `PRIVATE_KEY` e referência cruzada ao contrato USDC oficial.

### Documentação

- `docs/fases/FASE-07-STAGING-BASE-SEPOLIA.md` marcada como iniciada.
- `docs/fases/RESULTADO-FASE-07.md` (este arquivo).
- Guia de deploy rápido abaixo.

## Como Deployar em Staging

Pré-requisitos: carteira com ETH Sepolia e PRIVATE_KEY salva em local seguro.

```bash
# 1. Configurar env vars para o deploy
export PRIVATE_KEY=0x...
export ESCROW_ADMIN=0x...
export ESCROW_ARBITRATOR=0x...
export FEE_RECIPIENT=0x...

# 2. Deployar contrato
cd contracts
forge script script/DeploySepolia.s.sol \
    --rpc-url https://sepolia.base.org \
    --broadcast \
    --verify

# 3. Copiar o endereço do output para .env
# ESCROW_CONTRACT_ADDRESS=<address-do-output>

# 4. Subir infra
cd ..
docker compose up -d postgres redis

# 5. Rodar backend
cd backend
DATABASE_URL=postgresql+postgres:postgres@localhost:5432/freelance_escrow \
  ESCROW_CONTRACT_ADDRESS=$ESCROW_CONTRACT_ADDRESS \
  INDEXER_START_BLOCK=$(curl -s https://sepolia.base.org \
    | jq -r '.result.blockNumber' \
    | xargs printf '%d') \
  uvicorn app.main:app --host 0.0.0.0 --port 8000

# 6. Build e servrir frontend
cd frontend
npm run build
npx serve dist -l 5173
```

## Validacoes Executadas

- Contrato compila sem MockUSDC: `forge build` (implícito no script).
- Backend lint: `.venv/bin/ruff check app tests` passou.
- Frontend build: `npm run build` passou.
- Testes: `.venv/bin/pytest` passou com `4 passed`.

## Ainda Falta Para Concluir A Fase 07

- Executar deploy real em Base Sepolia com carteira financiada.
- Validar indexador sincronizando testnet.
- Fazer smoke E2E com carteira real conectada a Base Sepolia.
- Publicar frontend/backend em URL acessível.
- Registrar endereços finais, bloco inicial e instruções de demo.

## Conclusao

A Fase 07 tem agora o script de deploy, o backend containerizado e a
documentação necessária para executar o staging em Base Sepolia. O próximo
passo prático é rodar o deploy real com uma wallet financiada.

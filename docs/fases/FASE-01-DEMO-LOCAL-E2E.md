# Fase 01 - Demo Local E2E

Status: implementada em [RESULTADO-FASE-01.md](RESULTADO-FASE-01.md).

## Objetivo

Criar uma demo local ponta a ponta com contrato, backend, indexer, banco e frontend conectados em ambiente de desenvolvimento.

## Contexto

Hoje o frontend usa dados mockados e o backend ja tem indexador/projetor de eventos. Esta fase conecta a aplicacao real ao contrato local para provar o fluxo basico de sincronizacao on-chain/off-chain.

## Escopo

- Subir Anvil local.
- Deployar `MockUSDC` e `FreelanceEscrow` com script local.
- Configurar `.env` com enderecos de contrato e token.
- Rodar Postgres e Redis.
- Rodar indexer apontando para Anvil.
- Popular um job local via contrato.
- Confirmar que eventos on-chain aparecem em `indexed_events`.
- Confirmar que `jobs` e `milestones` sao projetados no banco.
- Criar primeira chamada frontend para dados reais do backend.

## Fora de Escopo

- UI completa de criacao de jobs.
- Upload real de evidencias.
- Autenticacao por assinatura.

## Entregaveis

- Script ou instrucoes de boot local E2E.
- Contrato local deployado.
- Indexer funcionando com replay basico.
- Frontend exibindo pelo menos um job real vindo do backend.

## Criterios de Aceite

- Um evento `JobCreated` emitido localmente aparece no banco.
- `GET /jobs/{onchain_job_id}` retorna o job projetado.
- Frontend consome o endpoint real em pelo menos uma tela.
- A demo pode ser reproduzida por outro desenvolvedor com passos documentados.

## Dependencias

- Fase 00 concluida.
- ABI do contrato acessivel pelo backend.
- `.env` local configurado.

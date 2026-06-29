# Fase 00 - Validacao da Base

Status: implementada em [RESULTADO-FASE-00.md](RESULTADO-FASE-00.md).

## Objetivo

Confirmar que a base atual do MVP compila, roda e pode ser usada como ponto de partida confiavel para as proximas fases.

## Contexto

O repositorio ja possui contrato Solidity, backend FastAPI, frontend React, schema PostgreSQL, indexer e documentacao. Antes de evoluir produto, e necessario validar se a base executa localmente sem quebras.

## Escopo

- Instalar dependencias do contrato, backend e frontend.
- Executar testes do contrato com Foundry.
- Executar build do frontend.
- Subir Postgres e Redis via Docker Compose.
- Subir backend FastAPI localmente.
- Validar endpoint `GET /health`.
- Documentar qualquer erro bloqueante encontrado.

## Fora de Escopo

- Implementar novas features.
- Fazer deploy em testnet.
- Alterar regras de negocio do contrato.

## Entregaveis

- Ambiente local documentado e reproduzivel.
- Resultado dos testes do contrato.
- Resultado do build frontend.
- Backend respondendo `GET /health`.
- Lista curta de ajustes tecnicos, se houver.

## Criterios de Aceite

- `forge test` executa com sucesso ou tem falhas documentadas com causa provavel.
- `npm run build` no frontend executa com sucesso.
- Backend inicia sem erro de import/configuracao.
- Docker Compose sobe Postgres e Redis.
- O estado real da base fica registrado antes da implementacao funcional.

## Dependencias

- Foundry instalado.
- Node.js e npm.
- Python 3.11+.
- Docker.

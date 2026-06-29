# Fase 02 - Fluxo Escrow Real

## Objetivo

Implementar o ciclo financeiro principal do MVP: criar job, aprovar USDC, fundear, submeter milestone, aprovar, pedir revisao, abrir disputa e liberar por timeout.

## Contexto

O contrato ja expoe as funcoes centrais. Falta transformar essas chamadas em fluxos de produto no frontend e endpoints auxiliares no backend.

## Escopo

- Criar endpoints para preparar job off-chain e retornar parametros de transacao.
- Criar tela/formulario de criacao de job com milestones.
- Integrar approve de USDC via wallet.
- Integrar chamada `createJob`.
- Integrar chamada `fundJob`.
- Integrar chamada `submitMilestone` com `evidenceHash` temporario.
- Integrar chamada `approveMilestone`.
- Integrar chamada `requestRevision`.
- Integrar chamada `openDispute`.
- Integrar chamada `releaseAfterTimeout` quando aplicavel.
- Mostrar status atualizado vindo do backend/indexer.

## Fora de Escopo

- Arbitragem humana completa.
- Storage privado real.
- Account abstraction.

## Entregaveis

- Fluxo Web3 funcional na UI.
- Biblioteca frontend para interacao com USDC e escrow.
- Endpoints backend minimos para metadados off-chain do job.
- Estados de loading, erro e sucesso para transacoes.

## Criterios de Aceite

- Cliente consegue criar e fundear um job localmente.
- Freelancer consegue submeter milestone.
- Cliente consegue aprovar milestone e liberar pagamento.
- Cliente consegue pedir revisao.
- Uma disputa pode ser aberta.
- Timeout pode liberar pagamento apos o periodo de revisao.
- UI reflete o estado projetado pelo indexer, nao apenas estado local.

## Dependencias

- Fase 01 concluida.
- WalletConnect ou provider local funcional.
- MockUSDC mintado para a carteira de teste.

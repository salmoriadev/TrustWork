# Fase 14 - Escrow V2: Execucao

**Status:** nao iniciada
**Especificacao:** [FASE-14-ESCROW-V2](../fases/FASE-14-ESCROW-V2.md)
**Dependencias:** G0 + decisoes juridicas/economicas
**Gate relacionado:** G2 - smart contract

## Resultado esperado

Contrato com termos economicos fixados por job, saidas seguras para todos os impasses e governanca
adequada a fundos reais.

## Tarefas

### 14.1 Decisoes e ADRs bloqueantes

- [ ] Definir fee, pagador, cobranca, refund e disputa.
- [ ] Definir deadlines de funding, inicio, entrega, revisao e arbitragem.
- [ ] Definir cancelamento unilateral e mutuo.
- [ ] Definir selecao, substituicao e remuneracao de arbitro.
- [ ] Definir pause, upgrade/migracao e comunicacao.
- [ ] Definir cap por job, TVL global e imutavel versus proxy.

**Saida:** regras aprovadas por produto, engenharia, risco e juridico.
**Evidencia:** ADRs assinados e modelos de exemplo.

### 14.2 Especificacao formal do estado

- [ ] Modelar estados de job e milestone.
- [ ] Enumerar transicoes, atores, pre-condicoes e efeitos financeiros.
- [ ] Definir invariantes de saldo, passivo, fee e unicidade.
- [ ] Definir comportamento em pause e timeout.
- [ ] Mapear eventos suficientes para reconstruir o estado.
- [ ] Revisar ameacas e abuso economico antes da implementacao.

**Saida:** maquina de estados e invariantes independentes do codigo.
**Evidencia:** spec revisada e tabela de transicoes.

### 14.3 Termos imutaveis por job

- [ ] Salvar snapshot de fee BPS, recipient, arbitro e periodos.
- [ ] Vincular hash/ID da metadata e termos aceitos.
- [ ] Limitar quantidade de milestones e valores.
- [ ] Validar soma, token, participantes e caps.
- [ ] Emitir configuracoes em eventos reconstruiveis.

**Saida:** mudanca global nao altera job financiado.
**Evidencia:** testes de snapshot antes/depois de mudanca administrativa.

### 14.4 Saidas e timeouts

- [ ] Cancelar job nao financiado sem prender estado.
- [ ] Permitir refund por falta de inicio/entrega apos deadline.
- [ ] Preservar liberacao por timeout de revisao.
- [ ] Implementar cancelamento mutuo EIP-712 com nonce/deadline.
- [ ] Definir fallback para timeout arbitral.
- [ ] Garantir que pause bloqueie entradas sem bloquear saidas seguras.

**Saida:** todo estado financeiro possui caminho de resolucao.
**Evidencia:** testes de cada timeout e sequencia adversarial.

### 14.5 Governanca e privilegios

- [ ] Separar admin, pauser, arbitrator e treasury.
- [ ] Implementar transferencia administrativa em duas etapas/delay quando aplicavel.
- [ ] Emitir evento para toda alteracao privilegiada.
- [ ] Definir multisigs, signatarios e rotacao.
- [ ] Documentar poderes e enderecos publicamente.
- [ ] Minimizar ou eliminar capacidade de prender/redirecionar fundos.

**Saida:** privilegios limitados, observaveis e operaveis por multisig.
**Evidencia:** matriz de roles, testes e simulacao Safe.

### 14.6 Implementacao e testes

- [ ] Implementar contrato contra a spec aprovada.
- [ ] Cobrir transicoes e controles com unit tests.
- [ ] Criar fuzz tests para valores, sequencias e assinaturas.
- [ ] Criar invariantes de solvencia e passivo.
- [ ] Criar handler stateful com multiplos jobs/atores.
- [ ] Executar fork tests com USDC e rede alvo.
- [ ] Executar Slither e revisar findings manualmente.

**Saida:** contrato candidato a auditoria sem finding alto interno.
**Evidencia:** relatorios Foundry, cobertura, Slither e gas.

### 14.7 Deploy e handoff

- [ ] Versionar scripts deterministas de deploy/configuracao.
- [ ] Gerar manifestos de enderecos e parametros.
- [ ] Simular deploy completo em fork e testnet.
- [ ] Documentar migracao do contrato anterior.
- [ ] Congelar ABI consumida por backend/frontend.
- [ ] Preparar pacote e commit exato para auditoria externa.

**Saida:** release candidate reproduzivel e auditavel.
**Evidencia:** deploy simulado, manifestos, bytecode e commit congelado.

## Evidencias

| Item | Referencia |
| --- | --- |
| ADRs economicos/juridicos | pendente |
| Spec de estados/invariantes | pendente |
| Foundry/Slither/fork | pendente |
| Matriz de roles | pendente |
| Release candidate | pendente |

## Gate de saida

- [ ] Todo estado financeiro possui saida testada.
- [ ] Fee e termos nao mudam retroativamente.
- [ ] Solvencia e passivo permanecem invariantes.
- [ ] Release candidate esta congelado para integracao e auditoria.

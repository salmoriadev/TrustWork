# Fase 14 - Escrow V2

**Status:** nao iniciada
**Dependencias:** Fase 10 e decisoes juridicas/economicas registradas
**Esforco indicativo:** 4-6 semanas, sem contar auditoria externa

**Plano de execucao:** [tarefas 14.x](../execucao/FASE-14.md)

## Objetivo

Congelar regras economicas por job e garantir que cliente e freelancer possuam caminhos previsiveis
para concluir, disputar, cancelar ou recuperar fundos, inclusive sob falha operacional.

## Decisoes obrigatorias antes do codigo

- [ ] Fee, pagador, momento de cobranca e tratamento em reembolso/disputa.
- [ ] Prazo para funding, inicio, entrega, revisao e arbitragem.
- [ ] Condicoes de cancelamento unilateral e mutuo.
- [ ] Selecao, substituicao, impedimento e remuneracao de arbitro.
- [ ] Politica de pause, upgrade/migracao e comunicacao de incidente.
- [ ] Cap por job e TVL global do beta.
- [ ] Modelo imutavel versus proxy atualizavel, com analise de risco documentada.

## Escopo do contrato

### Termos por job

- [ ] Snapshot de fee BPS, fee recipient aplicavel, arbitro e periodos.
- [ ] Deadlines e configuracoes emitidos em eventos reconstruiveis.
- [ ] Limite de milestones e validacao de soma/valores.
- [ ] Identificador de metadata/termos aceitos vinculado ao job.

### Saidas de fundos

- [ ] Cancelamento simples antes do funding.
- [ ] Refund por funding sem inicio ou nao entrega apos deadline.
- [ ] Cancelamento mutuo com nonce e assinatura legivel EIP-712.
- [ ] Timeout de revisao preservado.
- [ ] Timeout arbitral com fallback definido e testavel.
- [ ] Pause granular que bloqueie novas entradas sem prender saidas seguras.

### Governanca

- [ ] Admin de duas etapas com delay e menor privilegio.
- [ ] Roles separadas para pause, arbitragem e configuracao quando necessario.
- [ ] Multisig para admin/treasury e processo de rotacao.
- [ ] Eventos para toda mudanca administrativa.
- [ ] Inventario publico de enderecos e poderes.

## Testes obrigatorios

- Unit tests de toda transicao, permissao, evento e revert.
- Fuzz de valores, quantidade de milestones, BPS, deadlines, nonces e assinaturas.
- Invariantes de conservacao de fundos e terminalidade.
- Testes de token real em fork da Base.
- Testes de admin comprometido dentro dos poderes permitidos.
- Testes de indisponibilidade de cliente, freelancer, arbitro e plataforma.
- Comparacao de eventos com projector do backend.

## Entregaveis

- Especificacao congelada e ADRs das decisoes economicas/governanca.
- `FreelanceEscrowV2.sol`, scripts, ABI e suite completa.
- Plano de migracao do V1; nao assumir upgrade automatico.
- Documentacao publica de estados, fees, deadlines e poderes.
- Relatorio de analise estatica e pacote pronto para auditoria.

## Criterios de aceite

1. Todo estado com fundos possui pelo menos uma saida limitada por prazo e regra publica.
2. Fee e termos nao mudam retroativamente para job financiado.
3. Pause nao permite saque administrativo nem bloqueio indefinido de todas as saidas.
4. Invariantes provam que payouts + refunds + fees nunca excedem deposito.
5. Nenhuma EOA unica controla admin, pause, arbitragem e treasury em producao.
6. Backend consegue reconstruir todos os termos relevantes somente por eventos + metadata vinculada.

## Nao concluir nesta fase

Auditoria interna, Slither ou grande cobertura nao substituem a auditoria independente da Fase 18.
Qualquer mudanca no contrato depois do congelamento exige reavaliar testes e escopo de auditoria.

# Fase 16 - Produto Comercial

**Status:** nao iniciada
**Dependencias:** Fases 11-15
**Esforco indicativo:** 4-6 semanas

**Plano de execucao:** [tarefas 16.x](../execucao/FASE-16.md)

## Objetivo

Transformar componentes tecnicos em jornadas completas e compreensiveis para cliente, freelancer,
arbitro e suporte, sem controles de demo ou campos tecnicos manuais.

## Escopo

### Cliente

- [ ] Criar e editar metadata do job, milestones, criterios, datas e visibilidade.
- [ ] Convidar/selecionar freelancer e registrar aceite dos termos.
- [ ] Revisar resumo economico antes de create/approve/fund.
- [ ] Acompanhar saldo, entregas, prazo, fee e historico.
- [ ] Aprovar, pedir revisao, disputar, cancelar e exportar comprovante.

### Freelancer

- [ ] Perfil real com skills, disponibilidade, portfolio e privacidade.
- [ ] Descoberta com filtros e score explicavel ou sem score artificial.
- [ ] Interesse, negociacao e aceite sem criar obrigacao antes do funding.
- [ ] Upload e submit vinculados ao milestone correto.
- [ ] Visao de bruto, fee, liquido e prazo esperado de liberacao.

### Arbitro e suporte

- [ ] Inbox de disputas atribuidas com SLA e conflito de interesse.
- [ ] Workspace de evidencias, timeline e decisao com confirmacao forte.
- [ ] Justificativa/manifesto da decisao e compromisso on-chain.
- [ ] Painel de suporte por job/tx sem poderes financeiros.
- [ ] Audit log para acesso e acao sensivel.

### Comunicacao e estados

- [ ] Notificacoes in-app e canal externo opt-in para eventos criticos.
- [ ] Empty, loading, offline, stale, unauthorized e error states reais.
- [ ] Remover badges, timestamps, matches e status hardcoded.
- [ ] Exibir fonte/atualizacao e divergencia de indexacao honestamente.
- [ ] Tratar acessibilidade WCAG 2.2 AA e navegacao por teclado.

### Metricas de produto

- [ ] Instrumentar funil sem registrar PII/evidencia.
- [ ] Medir wallet connect, SIWE, job draft, funding, entrega, conclusao e disputa.
- [ ] Definir eventos com versao e ownership.
- [ ] Criar dashboards de ativacao, liquidez, tempo e retencao.

## Entregaveis

- Jornadas J-01 a J-07 de [Requisitos de Produto](../02-REQUISITOS-DE-PRODUTO.md).
- Design responsivo e acessivel para todos os papeis.
- Catalogo de estados/erros e componentes de transacao.
- Analytics privacy-safe e dashboards de produto.
- Guias de usuario, FAQ e material de suporte.

## Criterios de aceite

1. Usuario novo conclui job financiado sem inserir endereco de contrato, hash ou milestone ID.
2. Acoes impossiveis pelo papel/estado nao sao apresentadas como executaveis.
3. Nenhum dado de demo aparece no build de staging/producao.
4. Cliente, freelancer e arbitro concluem UAT com criterios documentados.
5. Fluxos funcionam em mobile sem depender de extensao desktop.
6. Erros de wallet, RPC, receipt, indexacao e storage permitem recuperacao clara.

## Validacao

- Testes de componente, integracao e E2E por jornada/papel.
- Auditoria de acessibilidade automatica e manual.
- UAT com pelo menos cinco clientes e cinco freelancers representativos no testnet.
- Revisao de copy juridica/economica antes do beta.

## Fora de escopo

- Growth pago, boosts, planos Pro e cross-chain.
- IA para matching antes de base real e plano de avaliacao.

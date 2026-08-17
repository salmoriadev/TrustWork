# Fase 16 - Produto Comercial: Execucao

**Status:** nao iniciada
**Especificacao:** [FASE-16-PRODUTO-COMERCIAL](../fases/FASE-16-PRODUTO-COMERCIAL.md)
**Dependencias:** fases 11, 12, 13, 14 e 15
**Gate relacionado:** preparacao do G1

## Resultado esperado

Cliente, freelancer, arbitro e suporte concluem suas jornadas sem IDs tecnicos, dados inventados
ou estados que contradizem API e blockchain.

## Tarefas

### 16.1 Contrato de UX e informacao

- [ ] Mapear jornadas, papeis, estados e permissoes.
- [ ] Definir navegacao desktop/mobile e URLs recuperaveis.
- [ ] Criar design contract para forms, tabelas, timeline, dialogs e feedback.
- [ ] Definir estados loading, empty, offline, stale, unauthorized e error.
- [ ] Definir linguagem de risco, fee, irreversibilidade e confirmacao.
- [ ] Validar prototipo com usuarios dos papeis principais.

**Saida:** fluxo aprovado antes da integracao final.
**Evidencia:** mapa de jornada, UI spec e teste de prototipo.

### 16.2 Jornada do cliente

- [ ] Criar/editar metadata, milestones, criterios, datas e visibilidade.
- [ ] Convidar ou selecionar freelancer.
- [ ] Registrar aceite de termos e resumo economico.
- [ ] Criar, aprovar allowance e financiar com estados reais.
- [ ] Acompanhar saldo, entrega, prazo, fee e historico.
- [ ] Aprovar, pedir revisao, disputar, cancelar e exportar comprovante.

**Saida:** cliente conclui draft -> funding -> encerramento.
**Evidencia:** E2E por caminho feliz e principais falhas.

### 16.3 Jornada do freelancer

- [ ] Criar perfil com skills, portfolio, disponibilidade e privacidade.
- [ ] Descobrir jobs por filtros e score explicavel.
- [ ] Demonstrar interesse, negociar e aceitar sem obrigacao prematura.
- [ ] Visualizar bruto, fee, liquido e deadline.
- [ ] Fazer upload e submit no milestone correto.
- [ ] Acompanhar revisao, payout, disputa e historico.

**Saida:** freelancer conclui descoberta -> entrega -> recebimento.
**Evidencia:** E2E e UAT com perfil freelancer.

### 16.4 Arbitro e suporte

- [ ] Criar inbox de disputas atribuidas com SLA.
- [ ] Verificar conflito de interesse e substituicao.
- [ ] Exibir timeline e evidencias autorizadas.
- [ ] Confirmar decisao e compromisso on-chain com friccao adequada.
- [ ] Registrar justificativa/manifesto da decisao.
- [ ] Criar suporte por job/tx sem poder financeiro.
- [ ] Auditar todo acesso e acao sensivel.

**Saida:** disputa pode ser operada sem compartilhar privilegios administrativos.
**Evidencia:** UAT arbitro/suporte e audit log.

### 16.5 Comunicacao e fontes de verdade

- [ ] Criar notificacoes in-app para eventos criticos.
- [ ] Integrar canal externo apenas por opt-in.
- [ ] Exibir origem e horario de atualizacao do estado.
- [ ] Diferenciar receipt confirmado de projecao atrasada.
- [ ] Permitir retomar trabalho depois de refresh/offline.
- [ ] Evitar notificacao duplicada por idempotencia.

**Saida:** usuario entende o que aconteceu e qual acao tomar.
**Evidencia:** testes de notificacao, lag e recuperacao.

### 16.6 Remocao de simulacoes e acessibilidade

- [ ] Remover `matchScore = 99`, skills e textos genericos.
- [ ] Remover badges, contadores, timestamps e status hardcoded.
- [ ] Garantir que staging/producao nunca facam fallback para mock.
- [ ] Atender teclado, foco, contraste, labels e leitor de tela.
- [ ] Validar zoom, texto longo, mobile e reduced motion.
- [ ] Executar auditoria WCAG 2.2 AA.

**Saida:** interface honesta e utilizavel por diferentes usuarios.
**Evidencia:** busca de fixtures, axe/manual e screenshots responsivos.

### 16.7 Metricas de produto

- [ ] Versionar eventos de wallet, SIWE, draft, funding, entrega e disputa.
- [ ] Excluir PII, conteudo e evidencias da telemetria.
- [ ] Definir owner e contrato de cada evento.
- [ ] Medir funil, tempo, falha, liquidez e retencao.
- [ ] Criar dashboards para produto e risco.
- [ ] Validar eventos contra jornadas E2E.

**Saida:** beta produz dados confiaveis para decisao comercial.
**Evidencia:** catalogo de eventos e dashboards.

### 16.8 UAT e fechamento

- [ ] Executar UAT com cliente, freelancer e arbitro.
- [ ] Classificar problemas por severidade.
- [ ] Corrigir todos os bloqueadores de tarefa/fundos.
- [ ] Executar regressao mobile/desktop.
- [ ] Atualizar ajuda, suporte e mensagens legais na UI.
- [ ] Aprovar escopo para staging.

**Saida:** release candidate funcional para fase 17.
**Evidencia:** roteiro, participantes, resultados e aceite.

## Evidencias

| Item | Referencia |
| --- | --- |
| UI spec/jornadas | pendente |
| E2E por papel | pendente |
| Auditoria WCAG | pendente |
| Catalogo de eventos | pendente |
| Relatorio UAT | pendente |

## Gate de saida

- [ ] Os quatro papeis concluem suas jornadas autorizadas.
- [ ] Nenhum dado comercial visivel e inventado ou hardcoded.
- [ ] Estados de erro/offline/lag foram exercitados.
- [ ] UAT nao possui P0/P1 aberto.

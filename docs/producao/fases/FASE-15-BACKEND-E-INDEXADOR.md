# Fase 15 - Backend e Indexador de Producao

**Status:** nao iniciada
**Dependencias:** Fase 10; ABI/eventos coordenados com Fase 14
**Esforco indicativo:** 3-5 semanas

**Plano de execucao:** [tarefas 15.x](../execucao/FASE-15.md)

## Objetivo

Separar requisicao HTTP de processamento blockchain, tornar a projecao recuperavel e operar API,
banco, fila e RPC sob falhas parciais sem perder eventos nem expor controles administrativos.

## Escopo

### Banco e API

- [ ] Adotar Alembic e baseline seguro do schema existente.
- [ ] Usar migrations expand/contract e rollback ensaiado.
- [ ] Adicionar paginacao, filtros, ordenacao e limites consistentes.
- [ ] Versionar API e padronizar erros/idempotency keys.
- [ ] Remover refresh/replay pesado de rotas publicas.
- [ ] Criar health/readiness checks para banco, fila, RPC e storage.
- [ ] Revisar pool, timeouts, indices, N+1 e transacoes concorrentes.

### Indexador

- [ ] Persistir cursor por chain/contrato com block number e block hash.
- [ ] Ler ranges limitados ate bloco seguro com backoff/retry.
- [ ] Gravar evento, projecao, cursor e outbox atomicamente.
- [ ] Detectar reorg e executar rollback/rebuild deterministico.
- [ ] Tratar eventos desconhecidos como alerta, nao descarte silencioso.
- [ ] Criar replay administrativo autenticado e executado em worker.
- [ ] Comparar dois RPCs em caso de divergencia critica.

### Workers e notificacoes

- [ ] Separar indexacao, reputacao, scan de arquivos e notificacoes em jobs.
- [ ] Configurar retry finito, idempotencia e dead-letter queue.
- [ ] Criar notificacoes de funding, entrega, revisao, timeout e disputa.
- [ ] Garantir que falha de notificacao nao reverta verdade financeira.

### Observabilidade

- [ ] Logs JSON com correlation ID, chain, job e tx sem PII/conteudo.
- [ ] Metricas de lag, cursor, reorg, decode, projection, RPC e DLQ.
- [ ] Traces API -> banco/fila e dashboards por ambiente.
- [ ] Alertas acionaveis com owner e runbook.

## Entregaveis

- Migracoes Alembic e procedimento de upgrade/restore.
- Servico de indexador/worker separado da API.
- Cursor/outbox/DLQ e ferramentas administrativas protegidas.
- Dashboards, alertas e runbooks.
- Teste de rebuild que reproduz estado esperado a partir dos eventos.

## Criterios de aceite

1. Reiniciar o indexador nao relê a cadeia inteira nem perde o cursor.
2. Redis indisponivel depois do commit nao perde evento/notificacao definitivamente.
3. Reorg simulado corrige projecao sem duplicar payout ou reputacao.
4. Replay de todos os eventos produz o mesmo estado e metricas.
5. Rotas publicas nao conseguem iniciar poll/replay/refresh global.
6. Backup restaurado volta ao SLO e reconcilia com a blockchain.

## Validacao

- Testes de falha injetada em RPC, Redis, banco e worker.
- Teste de reorg em Anvil e replay completo.
- Load test de leituras, auth, upload metadata e listagens.
- Restore test e reconciliacao de saldo/passivo.

## Riscos

- Exatamente uma vez nao existe entre todos os sistemas; projetar efeitos idempotentes.
- A projecao nunca deve sobrescrever silenciosamente um estado financeiro divergente.

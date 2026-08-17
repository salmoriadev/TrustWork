# Fase 15 - Backend e Indexador: Execucao

**Status:** nao iniciada
**Especificacao:** [FASE-15-BACKEND-E-INDEXADOR](../fases/FASE-15-BACKEND-E-INDEXADOR.md)
**Dependencias:** G0 aprovado
**Gate relacionado:** G1 - infraestrutura

## Resultado esperado

API versionada, banco migravel e indexador capaz de retomar, detectar reorg, reconstruir projecoes
e operar com observabilidade.

## Tarefas

### 15.1 Migrations e banco

- [ ] Adotar Alembic e criar baseline do schema atual.
- [ ] Remover criacao implicita de schema no startup de producao.
- [ ] Definir estrategia expand/contract.
- [ ] Testar upgrade e downgrade em copia de dados.
- [ ] Revisar indices, constraints, pool, timeout e transacoes concorrentes.
- [ ] Documentar backup antes de migration destrutiva.

**Saida:** schema evolui sem rebuild manual ou perda silenciosa.
**Evidencia:** migration CI, rollback e plano de recuperacao.

### 15.2 Contrato de API

- [ ] Versionar rotas publicas.
- [ ] Padronizar erros, correlation ID e codigos de dominio.
- [ ] Adicionar paginacao, filtros, ordenacao e limites.
- [ ] Aplicar idempotency key nas mutacoes adequadas.
- [ ] Remover replay/indexacao pesada de rotas publicas.
- [ ] Preservar compatibilidade OpenAPI ou versionar breaking change.

**Saida:** API previsivel, limitada e consumivel pelo produto.
**Evidencia:** contract tests, testes de idempotencia e carga basica.

### 15.3 Cursor e leitura segura da chain

- [ ] Persistir cursor por chain e contrato com numero/hash do bloco.
- [ ] Processar ranges limitados ate bloco com confirmacoes.
- [ ] Aplicar retry, backoff, timeout e limite de range.
- [ ] Tornar evento idempotente por identidade on-chain.
- [ ] Alertar evento desconhecido ou falha de decode.
- [ ] Comparar RPC alternativo em divergencia critica.

**Saida:** indexador retoma sem reler toda a chain.
**Evidencia:** testes de restart, duplicacao, range e RPC indisponivel.

### 15.4 Reorg e projecao deterministica

- [ ] Detectar hash de bloco divergente do cursor.
- [ ] Definir janela e ancestral comum para rollback.
- [ ] Reverter eventos/projecoes afetados de forma deterministica.
- [ ] Reprocessar ate o bloco seguro.
- [ ] Criar rebuild completo a partir do bloco de deploy.
- [ ] Restringir replay administrativo a worker autenticado.

**Saida:** reorg nao deixa estado projetado incorreto.
**Evidencia:** teste com fork/reorg sintetico e checksum da projecao.

### 15.5 Transacao, outbox e workers

- [ ] Gravar evento, projecao, cursor e outbox atomicamente.
- [ ] Separar indexacao, reputacao, arquivo e notificacao em jobs.
- [ ] Configurar retry finito e idempotente.
- [ ] Criar dead-letter queue e operacao de redrive.
- [ ] Garantir que falha de notificacao nao altere verdade financeira.
- [ ] Definir concorrencia e ordenacao por job/chain.

**Saida:** falha entre banco e fila nao perde trabalho.
**Evidencia:** testes de crash antes/depois do commit e DLQ.

### 15.6 Readiness e observabilidade

- [ ] Separar liveness de readiness.
- [ ] Verificar banco, fila, RPC, storage e migrations.
- [ ] Emitir logs JSON com correlation, chain, job e tx sem conteudo privado.
- [ ] Medir lag, cursor, range, reorg, decode, RPC, outbox e DLQ.
- [ ] Criar traces API -> banco/fila.
- [ ] Criar dashboards, alertas, owner e runbook.

**Saida:** degradacao e lag sao detectados antes de impactar fundos.
**Evidencia:** dashboard, alertas disparados e smoke de readiness.

### 15.7 Validacao de resiliencia

- [ ] Executar replay com volume representativo.
- [ ] Injetar falha de RPC, banco e Redis.
- [ ] Testar concorrencia de workers e eventos duplicados.
- [ ] Medir tempo de rebuild e lag maximo.
- [ ] Reconciliar saldo do contrato com passivo projetado.
- [ ] Documentar capacidade e limites operacionais.

**Saida:** comportamento conhecido sob falha e carga.
**Evidencia:** relatorio de chaos/load e reconciliacao zero-diff.

## Evidencias

| Item | Referencia |
| --- | --- |
| Alembic baseline | pendente |
| Testes reorg/replay | pendente |
| Outbox/DLQ | pendente |
| Dashboards/alertas | pendente |
| Relatorio de resiliencia | pendente |

## Gate de saida

- [ ] Restart, duplicacao e reorg nao corrompem projecoes.
- [ ] Replay publico foi removido e operacao administrativa e autenticada.
- [ ] Readiness representa dependencias reais.
- [ ] Saldo on-chain reconcilia com o passivo projetado.

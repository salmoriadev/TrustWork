# Modelo PostgreSQL

O banco de dados espelha o estado on-chain e armazena metadados off-chain que nao devem ir para a blockchain.

## Principios

- Eventos on-chain sao gravados de forma idempotente.
- Tabelas de estado podem ser reconstruidas a partir de `indexed_events`.
- PII, chat, arquivos e criterios privados ficam off-chain.
- Valores financeiros sao armazenados como inteiros na menor unidade do token.

## Entidades principais

| Tabela | Funcao |
| --- | --- |
| `users` | Identidade off-chain vinculada a wallet. |
| `jobs` | Estado agregado do job e metadados privados/publicos. |
| `milestones` | Projecao dos marcos on-chain e dados de produto. |
| `disputes` | Disputas e resultado arbitral. |
| `evidence_files` | Arquivos privados, hashes e URIs de storage. |
| `chat_messages` | Mensagens off-chain relacionadas ao job. |
| `swipe_actions` | Sinais de descoberta e matching. |
| `indexed_events` | Log canonico para replay. |
| `user_reputation_snapshots` | Metricas agregadas verificaveis. |
| `reputation_access_grants` | Permissoes para dados privados de reputacao. |
| `sybil_signals` | Sinais de risco para inflacao artificial de reputacao. |

## Replay de eventos

O indexer processa eventos em ordem crescente de bloco/log:

```text
JobCreated -> upsert jobs + milestones
JobFunded -> jobs.status = Funded
MilestoneSubmitted -> milestones.status = Submitted
MilestoneApproved -> milestones.status = Released
RevisionRequested -> milestones.status = RevisionRequested
DisputeOpened -> jobs.status = Disputed, milestones.status = Disputed
DisputeResolved -> disputes.status = Resolved, milestone.status = Resolved
PaymentReleased -> incrementa saldos projetados e metricas
JobCancelled -> jobs.status = Cancelled
PlatformFeeCollected -> registra fee operacional
```

## Arquivo SQL

O DDL executavel esta em:

```text
backend/sql/schema.sql
```

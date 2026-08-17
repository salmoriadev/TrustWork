# Diagnostico Atual

## Resumo executivo

O TrustWork e um MVP tecnico com uma boa base de interface, contrato de escrow, API e projecao de
eventos. Ele ainda nao e um beta seguro para valores reais. As principais garantias ausentes sao
autenticacao, autorizacao, consistencia de hashes, integracao real de WalletConnect, confirmacao de
transacoes, saidas economicas do escrow, resiliencia do indexador e operacao de producao.

Estimativa de maturidade, usada apenas para priorizacao:

| Area | Maturidade estimada | Motivo principal |
| --- | ---: | --- |
| Interface e responsividade | 75% | Interface funcional, mas jornadas e estados ainda incompletos. |
| Integracao Web3 no frontend | 35% | Provider fragmentado e ausencia de receipts/rede obrigatoria. |
| Backend e indexador | 40% | Base funcional, sem auth, migracoes ou operacao resiliente. |
| Smart contract | 45% | Fluxo central existe, mas faltam saidas e garantias economicas. |
| Seguranca e operacao | 20% | Sem auditoria, observabilidade, runbooks e gestao de incidentes. |
| Produto e compliance | 15% | Jornadas, suporte, politicas e enquadramento ainda nao fechados. |

## Fronteira entre real e mockado

### Implementado

- Contrato com criacao, funding, entrega, aprovacao, revisao, disputa, timeout e cancelamento mutuo.
- Eventos on-chain e tabelas PostgreSQL para jobs, milestones, disputas e reputacao.
- API FastAPI com jobs, perfis, swipes, matches, evidencias, disputas e metricas.
- Indexador idempotente por `(chain_id, contract_address, block_number, tx_hash, log_index)`.
- Frontend React que tenta consultar a API e executa chamadas de escrita via Viem.
- CI com jobs separados para frontend, backend e contratos.

### Parcial ou simulado

- `frontend/src/lib/mockData.ts` existe somente para desenvolvimento e exige
  `VITE_ENABLE_DEMO_DATA=true`; sem essa flag, falha ou resposta vazia da API produz um estado
  indisponivel explicito.
- Jobs indexados recebem `matchScore = 99`, skills fixas e texto generico em
  `frontend/src/lib/api.ts`.
- O backend indexa valores e partes reais, mas nao oferece uma jornada completa para cadastrar
  titulo, descricao, criterios de aceite e disponibilidade antes da transacao.
- O painel mostra notificacao, numero de matches e atualizacao em tempo real sem servico real.
- Reputacao e derivada dos eventos, mas nao ha protecao contra conluio, Sybil ou wash volume.

### Ausente

- Autenticacao por assinatura e sessao.
- Autorizacao que confirme cliente, freelancer ou arbitro em cada endpoint.
- Storage de evidencias: a API descarta o corpo e cria somente uma URI `local://`.
- Mensageria, notificacoes reais e painel operacional de arbitragem.
- Migracoes Alembic, backups testados, rate limiting e health checks de dependencias.
- Deploy real versionado em Base Sepolia e Base Mainnet.
- Auditoria independente do contrato e parecer juridico do modelo de negocio.

## Bloqueadores tecnicos P0

### B-01: identidade declarativa

Endpoints aceitam `actor_wallet` e `uploader_wallet` enviados pelo cliente. Conhecer um endereco e
suficiente para alterar dados em nome dele. O sistema precisa de SIWE com nonce de uso unico,
validade, dominio, chain ID e sessao vinculada ao endereco.

### B-02: WalletConnect desconectado das escritas

`frontend/src/lib/wallet.ts` cria um EthereumProvider, mas nao o compartilha. As escritas em
`frontend/src/lib/contracts.ts` usam apenas `window.ethereum`. Uma sessao QR pode parecer conectada
e nao conseguir assinar a transacao.

### B-04: integridade de evidencia inconsistente

O backend calcula SHA-256 do corpo. O frontend calcula Keccak-256 do texto recebido pelo campo.
Nao existe um manifesto canonico nem vinculacao automatica entre arquivo, milestone, hash e
transacao. O resultado pode ser um hash diferente ou um hash de outro hash.

### B-05: estado de transacao enganoso

O retorno de `writeContract` e um hash de submissao, nao uma conclusao. A interface nao aguarda
receipt, nao diferencia `pending`, `confirmed`, `reverted` ou `replaced` e nao reconcilia com o
indexador.

### B-06: indexador acionavel publicamente

`POST /indexer/poll` pode ler do bloco inicial ate o ultimo bloco a cada chamada. Nao ha cursor
persistente, divisao por ranges, autenticacao administrativa ou rollback de reorg.

### B-07: saidas economicas incompletas

- A taxa global e consultada no pagamento e pode mudar depois do funding.
- A pausa administrativa bloqueia tambem liberacoes e resolucoes.
- O cliente nao recupera fundos unilateralmente se o freelancer nunca entregar.
- Nao existe fallback quando o arbitro fica indisponivel.
- Nao existem SLA de entrega, SLA arbitral ou politica de recurso.

## Riscos corrigidos na Fase 10

- IDs e valores `uint256` agora atravessam JSON/OpenAPI como strings decimais, possuem teste acima
  de `Number.MAX_SAFE_INTEGER` e viram `bigint` somente na borda Viem.
- O mock de interface nao e mais fallback silencioso: ele depende de flag explicita em
  desenvolvimento e nao entra no bundle de producao.
- Locks de npm e Python foram atualizados e os audits locais de runtime nao reportaram
  vulnerabilidade high/critical conhecida.
- Bootstrap, lint, testes, schema gerado, invariantes, scans e SBOM possuem comandos versionados.

## Estado de validacao

| Verificacao | Resultado nesta analise |
| --- | --- |
| Frontend | Lint, 8 testes, build CI e bundle de producao sem fixtures passaram localmente. |
| Contratos | 8 unit/fuzz e 2 invariantes passaram com os submodulos fixados. |
| Backend | Ruff, 12 testes em PostgreSQL 16 e `pip-audit` passaram localmente. |
| API | OpenAPI e tipos TypeScript foram regenerados sem drift. |
| Seguranca | Slither e scans Trivy locais nao reportaram bloqueador high/critical. |
| CI | Workflow existe; o primeiro run hospedado ainda e requisito para aprovar o G0. |

A evidencia detalhada, incluindo os comandos e o escopo dos scanners, esta em
[`evidencias/FASE-10-VALIDACAO.md`](evidencias/FASE-10-VALIDACAO.md).

## Decisao de produto necessaria

Antes da Fase 14, os responsaveis devem decidir e registrar:

1. Quem juridicamente presta o escrow e a arbitragem.
2. Se a plataforma sera estritamente nao custodial ou tera qualquer chave/capacidade operacional.
3. Jurisdicao, mercados atendidos e politicas de KYC/AML/sancoes.
4. Quem paga a taxa, em qual momento ela e fixada e como reembolsos sao tratados.
5. SLA de entrega, revisao e arbitragem.
6. Limite por job e limite global de TVL durante o beta.

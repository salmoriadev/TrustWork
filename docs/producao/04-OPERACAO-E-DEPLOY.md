# Operacao e Deploy

## Objetivo operacional

Publicar releases reproduziveis, detectar degradacao antes do usuario e recuperar servicos sem
perder a verdade financeira. Blockchain nao elimina a necessidade de operacao; aumenta a
necessidade de reconciliacao entre sistemas.

## Topologia minima

- Frontend estatico em CDN com WAF e rollback de versao.
- API com pelo menos duas replicas e deploy sem downtime.
- Worker/indexador separado da API HTTP.
- PostgreSQL gerenciado com alta disponibilidade e point-in-time recovery.
- Redis/fila gerenciada com persistencia adequada ao uso.
- Object storage privado, versionamento, lifecycle e KMS.
- RPC primario e fallback de fornecedores independentes.
- Observabilidade central para logs, metricas, traces e alertas.

## Configuracao por ambiente

Cada ambiente possui:

- `CHAIN_ID`, RPCs, endereco do escrow, USDC, bloco inicial e confirmacoes.
- Origem publica da API e frontend.
- Project ID WalletConnect e metadata coerente.
- Banco, fila, storage, KMS e providers de notificacao separados.
- Multisig, arbitros, fee recipient, caps e feature flags proprios.

A aplicacao deve recusar inicializacao em staging/producao quando endereco for zero, placeholder,
chain divergente, origem insegura ou segredo obrigatorio estiver ausente.

## Pipeline CI/CD

### Pull request

1. Formato, lint e typecheck.
2. Testes unitarios frontend/backend/contratos.
3. Fuzz e invariantes com budget adequado.
4. Testes de integracao em Anvil + Postgres + Redis.
5. SAST, dependency audit, secret scan e container scan.
6. Build de imagens/artefatos imutaveis e SBOM.

### Deploy

1. Artefato e promovido; producao nunca recompila fonte diferente.
2. Migracao de banco e testada em copia/restauracao e aplicada por job unico.
3. Deploy canario ou blue/green com health checks reais.
4. Smoke test valida API, auth, RPC read-only, storage e indexer.
5. Frontend e promovido depois das APIs compativeis.
6. Rollback e automatico para app; migracao destrutiva exige estrategia expand/contract.

Deploy de contrato usa script versionado, simulacao, multisig e verificacao no explorer. A Base
documenta deploy com verificacao publica em
[Base Documentation](https://docs.base.org/get-started/launch-token).

## SLOs iniciais

| Indicador | Meta beta | Meta producao |
| --- | ---: | ---: |
| Disponibilidade API mensal | 99,5% | 99,9% |
| P95 leitura API interna | < 750 ms | < 500 ms |
| Lag do indexador apos finalizacao | < 2 min | < 30 s |
| Entrega de notificacao critica | < 5 min | < 1 min |
| RPO PostgreSQL | 15 min | 5 min |
| RTO servicos off-chain | 4 h | 1 h |

SLO de confirmacao on-chain e medido separadamente porque depende da rede e do RPC.

## Metricas e alertas

### API

- Requests, latencia, status, rate limit e saturacao por rota.
- Falhas de SIWE, refresh, autorizacao e upload.
- Pool de banco, queries lentas e deadlocks.

### Blockchain/indexador

- Head por RPC, divergencia entre providers e ultimo bloco seguro.
- Lag, tamanho de range, logs processados, retries e DLQ.
- Reorgs, eventos desconhecidos e falhas de decode/projecao.
- Transacoes submetidas, confirmadas, revertidas e pendentes alem do SLA.
- Saldo do contrato comparado ao passivo calculado por jobs ativos.

### Produto/risco

- Jobs criados, financiados, concluidos, cancelados e disputados.
- Tempo para funding, primeira entrega, aprovacao e resolucao.
- TVL, concentracao por wallet, volume e fee.
- Sinais de Sybil, abuso, upload malicioso e contas bloqueadas.

## Backups e restauracao

- PostgreSQL: PITR, snapshot diario e teste de restore mensal.
- Object storage: versionamento e retencao coerente com politica juridica.
- Configuracoes de multisig/contrato: inventario offline e revisado.
- Projecao do indexador: procedimento de rebuild a partir do bloco de deploy.
- Ensaio trimestral de desastre com tempos medidos contra RPO/RTO.

## Runbooks obrigatorios

1. RPC primario indisponivel ou divergente.
2. Indexador atrasado, travado ou em reorg.
3. Transacao pendente, substituida ou revertida.
4. Banco indisponivel ou restauracao necessaria.
5. Vazamento de sessao/segredo ou dependencia comprometida.
6. Evidencia indisponivel ou acesso indevido.
7. Suspeita de exploit e decisao de pause.
8. Arbitro indisponivel.
9. Saldo do contrato divergente do passivo projetado.
10. Rollback de frontend/API e comunicacao de incidente.

## Checklist de deploy

- Release gate correspondente aprovado e assinado.
- Artefato identificado por commit, digest e SBOM.
- Variaveis validadas sem placeholders.
- Migracoes e rollback ensaiados.
- Dashboards e alertas ativos antes do trafego.
- Enderecos oficiais publicados e contrato verificado.
- Suporte, status page e responsavel de plantao preparados.
- Smoke test financeiro executado com valor minimo previsto no ambiente.

# Release Gates

## Finalidade

Estes gates evitam que "feature completa" seja confundida com "produto seguro para usuarios".
Cada item exige evidencia anexada ao release: log de CI, dashboard, tx hash, relatorio, runbook ou
aprovacao formal.

## Gate G0: desenvolvimento reproduzivel

- [ ] Checkout limpo inicializa submodulos e dependencias com comandos documentados.
- [x] Frontend build/lint/test passa localmente; CI configurada.
- [x] Backend lint/test passa em PostgreSQL real local; CI configurada.
- [x] Contratos unit/fuzz/invariant passam localmente; CI configurada.
- [x] E2E local sobe Anvil, contrato, banco, fila, API e frontend automaticamente.
- [x] Locks e imagem de runtime do produto sem finding critico/alto no scan local.
- [x] Mocks so existem com flag explicita de desenvolvimento e nao entram no bundle de producao.

**Libera:** desenvolvimento das jornadas de producao.

Pendencias para aprovar formalmente o G0: executar todos os jobs em checkout limpo no GitHub,
guardar o link do run e configurar esses jobs como required checks da branch protegida.

## Gate G1: staging Base Sepolia

### Identidade e acesso

- [ ] SIWE valida nonce, dominio, chain, expiracao, EOA e ERC-1271.
- [ ] Endpoints mutaveis derivam wallet da sessao.
- [ ] Evidencias e disputas aplicam autorizacao por participante/arbitro.
- [ ] Rate limits e audit logs estao ativos.

### Transacoes

- [ ] WalletConnect QR e wallet injetada passam na matriz suportada.
- [ ] Rede errada e corrigida antes da assinatura.
- [ ] UI acompanha signature, submission, receipt, revert e replacement.
- [ ] IDs `uint256` passam como string/`bigint` sem perda.

### Infraestrutura

- [ ] Escrow de staging esta verificado no explorer.
- [ ] Indexador tem cursor persistente, confirmacoes e teste de replay/reorg.
- [ ] Storage privado, KMS, URLs assinadas e malware scan funcionam.
- [ ] Dashboards, alertas, backups e restore testado existem.
- [ ] Health checks validam banco, fila, RPC e storage.

**Libera:** beta convidado sem valor real.

## Gate G2: beta mainnet limitado

### Smart contract

- [ ] Escrow V2 possui fees por job, deadlines e saidas de emergencia definidas.
- [ ] Unit, fuzz, invariant e fork tests estao verdes.
- [ ] Analise estatica nao possui finding alto aberto.
- [ ] Auditoria externa do commit exato esta concluida e remediada.
- [ ] Admin, pauser, arbitrator e treasury usam multisig/politica aprovada.
- [ ] Contrato e codigo-fonte estao verificados e enderecos publicados.

### Produto e operacao

- [ ] Jornada cliente-freelancer-arbitro passou E2E em staging por pelo menos duas semanas.
- [ ] Runbooks de incidente foram exercitados em game day.
- [ ] Suporte, status page e plantao estao ativos.
- [ ] Caps por job e TVL global estao implementados e monitorados.
- [ ] Reconciliacao de saldo do contrato com passivo projetado esta automatizada.

### Comercial e juridico

- [ ] Parecer juridico aprovado para entidade, mercados e modelo.
- [ ] Termos, privacidade, riscos, fees e arbitragem foram publicados.
- [ ] KYC/AML/sancoes estao implementados ou formalmente considerados inaplicaveis.
- [ ] Contabilidade, tributacao, treasury e faturamento estao definidos.

**Libera:** mainnet para allowlist e limites baixos.

## Gate G3: disponibilidade comercial ampliada

- [ ] Beta mainnet operou por periodo e volume definidos pelo comite de risco.
- [ ] Nenhum incidente financeiro critico sem remediacao.
- [ ] SLOs foram atendidos por quatro semanas consecutivas.
- [ ] Taxas de disputa, fraude, suporte e falha estao dentro dos limites aprovados.
- [ ] Auditoria/pentest continuam validos para o codigo implantado.
- [ ] Capacidade de arbitragem e suporte cresce antes do limite de usuarios.
- [ ] Elevacao de caps foi aprovada por risco, engenharia, juridico e operacao.

**Libera:** crescimento gradual; nao libera expansao irrestrita por padrao.

## Evidencias minimas por release

| Categoria | Evidencia |
| --- | --- |
| Codigo | Commit, tag, CI e SBOM. |
| Contrato | Bytecode, endereco, tx de deploy, verificacao e audit commit. |
| Banco | Versao de migracao, backup e resultado do restore. |
| E2E | Matriz de casos, tx hashes e resultados. |
| Seguranca | Scans, findings, excecoes aprovadas e validade da auditoria. |
| Operacao | Dashboards, alertas, game day e responsavel de plantao. |
| Compliance | Aprovacoes, versoes de termos e mercados autorizados. |

## Autoridade para bloquear release

Engenharia, seguranca, operacao e juridico podem bloquear o release dentro de suas areas. Um
bloqueio por fundos em risco, finding alto, incerteza regulatoria ou ausencia de recuperacao nao
pode ser superado apenas por decisao comercial sem registro formal de risco e aprovacao executiva.

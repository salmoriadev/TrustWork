# Fase 11 - Identidade e Autorizacao: Plano de Implementacao

**Status:** nao iniciada
**Especificacao:** [FASE-11-IDENTIDADE-E-AUTORIZACAO](../fases/FASE-11-IDENTIDADE-E-AUTORIZACAO.md)
**Dependencias:** G0 aprovado
**Gate relacionado:** G1 - identidade e acesso
**Esforco indicativo:** 2-3 semanas com backend/frontend em paralelo; 4-5 semanas para um owner
unico

## Resultado esperado

A API prova controle da wallet por SIWE, mantem sessoes revogaveis no servidor e deriva toda
identidade mutavel da sessao. Policies centrais impedem IDOR e escalacao de papel; o frontend
conecta, autentica, restaura e encerra a sessao sem persistir credenciais em Web Storage.

Esta fase nao cria endpoints comerciais novos, nao implementa o storage definitivo de evidencias
e nao substitui o trabalho de provider/receipt da Fase 12.

## Gate de entrada

A execucao de codigo da Fase 11 so pode comecar depois de:

- [ ] incorporar as correcoes pendentes de review da Fase 10 e obter worktree limpo;
- [ ] concluir o fechamento hospedado 10.6: CI verde, SBOM, branch protection, tag/release e
  autoaprovacao do G0;
- [ ] registrar o SHA da `main` que sera a baseline da fase;
- [ ] definir owner de backend, frontend e revisao de seguranca;
- [ ] confirmar dominio/URI de development, staging e production;
- [ ] publicar as versoes e URLs vigentes de termos e politica de privacidade.

Se o G0 continuar em validacao, este documento pode ser revisado, mas nenhuma implementacao da
Fase 11 conta como iniciada ou como evidencia.

## Decisoes congeladas

### Protocolo SIWE

- Usar ERC-4361 sobre assinatura ERC-191 (`personal_sign`).
- O backend gera a mensagem canonica completa; o frontend assina exatamente os bytes recebidos.
  `POST /auth/challenge` recebe a wallet e as versoes legais aceitas e devolve `challenge_id`,
  `message` e `expires_at`.
- `POST /auth/verify` recebe somente `challenge_id` e `signature`. A mensagem nao e reconstruida a
  partir de campos controlados pelo cliente durante a verificacao.
- A mensagem contem `domain`, `address` em checksum, `statement`, `URI`, `Version: 1`, `Chain ID`,
  `Nonce`, `Issued At`, `Expiration Time` e recursos para termos/privacidade versionados.
- O nonce possui no minimo 128 bits de entropia, somente caracteres alfanumericos, TTL de 5
  minutos, hash unico no banco e uso unico.
- A verificacao compara o desafio com o ambiente corrente e rejeita dominio, URI, chain, versao,
  tempo ou termos divergentes. Tolerancia de relogio: no maximo 2 minutos para `issued-at` futuro.
- EOA e validada por recuperacao ERC-191. Se `eth_getCode` indicar contrato, validar ERC-1271 na
  chain da mensagem e exigir o magic value `0x1626ba7e`. Falha ou timeout do RPC retorna erro
  temporario e nao consome o desafio.
- A aplicacao nao depende de parser SIWE de terceiros em producao: ela assina e verifica a mensagem
  canonica armazenada. Vetores oficiais e um parser independente podem ser usados apenas nos
  testes de conformidade.

### Sessao e cookies

- Usar access e refresh tokens opacos, aleatorios de 256 bits e armazenar apenas HMAC-SHA-256 dos
  tokens no PostgreSQL. Nao usar JWT nem `localStorage`/`sessionStorage` para credenciais.
- TTL inicial: access de 15 minutos, refresh de 7 dias e limite absoluto da familia de 30 dias.
  Esses valores ficam configuraveis, com limites seguros validados no startup.
- Cada refresh e de uso unico. Rotacao cria novo access/refresh atomicamente; reuso de refresh ja
  consumido revoga toda a familia.
- Cookies de producao sao host-only (sem `Domain`) com prefixo `__Host-`, `Secure`, `HttpOnly`,
  `SameSite=Lax`, `Path=/` e `Max-Age` coerente com o token. Development usa nomes separados e
  pode desligar apenas `Secure` em localhost.
- Mutacoes autenticadas exigem cookie de sessao, `Origin` permitido e token CSRF aleatorio ligado
  a familia. O valor e entregue por resposta `no-store`, mantido apenas em memoria e enviado no
  header `X-CSRF-Token`; ele nao usa cookie legivel nem Web Storage.
- Logout revoga a familia atual; logout global revoga todas as familias da wallet. Expiracao,
  revogacao e troca de account/chain produzem estado anonimo no frontend.

### Identidade e papeis

- `CurrentActor` contem `user_id`, wallet canonica, papeis internos e `session_id`, todos derivados
  da sessao valida.
- `role_preference` continua sendo preferencia de UX e nunca concede privilegio.
- Cliente e freelancer sao derivados do relacionamento projetado em `jobs`; arbitro, da atribuicao
  em `disputes`.
- `support` e `operator` sao papeis internos persistidos, concedidos por operacao auditada fora da
  API publica. Suporte nao recebe acesso a evidencia por padrao.
- Recurso privado inexistente e recurso privado nao autorizado retornam a mesma resposta `404`.
  `401` fica reservado a sessao ausente/invalida e `403` a operacoes conhecidas que exigem papel
  interno.

### Rate limit e falhas

- Redis aplica limites atomicos por rota e combinacoes de IP, wallet e sessao, com `Retry-After`.
- Auth, refresh, logout global e mutacoes privadas falham fechadas com `503` se o limitador estiver
  indisponivel. Leituras publicas podem falhar abertas, emitindo evento operacional.
- Logs e audit events nunca incluem mensagem SIWE completa, assinatura, nonce, token, cookie,
  corpo de evidencia ou IP em claro.

## Contrato de API alvo

| Rota | Classe | Regra principal |
| --- | --- | --- |
| `GET /auth/config` | publica | chain, dominio e documentos legais publicos; `Cache-Control: no-store`. |
| `POST /auth/challenge` | publica limitada | gera mensagem canonica e desafio curto para a wallet informada. |
| `POST /auth/verify` | publica limitada | valida assinatura e consome desafio ao criar a familia de sessao. |
| `GET /auth/session` | autenticada | devolve ator, papeis e expiracao; nunca devolve tokens. |
| `GET /auth/csrf` | access ou refresh | entrega token CSRF `no-store` para restauracao segura apos reload. |
| `POST /auth/refresh` | refresh + CSRF | rotaciona tokens ou revoga a familia em caso de reuso. |
| `POST /auth/logout` | autenticada + CSRF | revoga a familia atual e limpa cookies. |
| `POST /auth/logout-all` | autenticada + CSRF | revoga todas as familias da wallet. |
| `GET /users/{wallet}` | publica/owner | so entrega perfil publico; perfil privado alheio responde `404`. |
| `GET, PUT /users/me` | autenticada | consulta/altera apenas o perfil do ator corrente. |
| `POST /jobs/prepare` | autenticada | associa a preparacao ao ator; freelancer continua sendo dado do job. |
| `POST /swipes` | autenticada | remove `actor_wallet`; usa a wallet da sessao. |
| `GET /matches` | autenticada | remove wallet do path; lista apenas matches do ator. |
| `POST /evidence` | participante | remove `uploader_wallet`; exige relacao com job/disputa. |
| `GET /jobs/{id}/evidence` | participante | cliente/freelancer; arbitro apenas no contexto da disputa atribuida. |
| `GET /disputes` | autenticada | filtra por participante ou arbitro atribuido, sem lista global. |
| `GET /disputes/{id}/evidence` | participante/arbitro | nega suporte e operador sem concessao explicita futura. |
| `POST /indexer/poll` | operator | deixa de ser endpoint publico. |
| `POST /reputation/*/refresh*` | operator | refresh individual/global apenas operacional. |
| `GET /metrics/funnel` | operator | metricas internas deixam de ser publicas. |

`GET /health`, `GET /escrow/config`, listagem/detalhe publico de jobs e reputacao publica
permanecem publicos. Campos privados nunca entram nos respectivos response models.

## Modelo de dados alvo

| Entidade | Campos/constraints essenciais | Retencao |
| --- | --- | --- |
| `auth_challenges` | hash unico do nonce, wallet, mensagem canonica, domain, URI, chain, termos, `expires_at`, `consumed_at` | apagar expirados/consumidos apos 24 h. |
| `auth_session_families` | wallet/user, CSRF hash, limite absoluto, revogacao e motivo | manter ate 30 dias apos expirar para detectar abuso. |
| `auth_access_tokens` | familia, HMAC unico, expiracao, revogacao e ultimo uso | apagar apos janela de auditoria. |
| `auth_refresh_tokens` | familia, HMAC unico, parent/replacement, expiracao, `used_at`, revogacao | manter ate expirar a familia para detectar reuso. |
| `user_consents` | user, tipo/versao/URL/hash do documento, sessao e `accepted_at` | conforme politica juridica; nunca apagar por limpeza de sessao. |
| `user_roles` | user, papel interno, concessao, expiracao e revogacao | historico auditavel. |
| `audit_events` | acao, resultado, ator, sessao, recurso, request ID e metadata redigida | conforme politica operacional/compliance. |

Indices cobrem lookup por hash, wallet, familia, expiracao e recursos de autorizacao. Constraints
impedem nonce duplicado, token duplicado, papel desconhecido e mais de um consumo do mesmo refresh.

## Estrategia de migrations

A Fase 11 precisa persistir auth antes da Fase 15, enquanto o plano 15.1 hoje e dono do baseline
Alembic. Para remover o conflito:

1. antecipar para 11.2 apenas a adocao e o baseline minimo do Alembic;
2. criar uma revision `0001` que reproduza o schema pre-Fase-11 e uma `0002` somente aditiva para
   identidade/autorizacao;
3. substituir o bootstrap via `backend/sql/schema.sql` por `alembic upgrade head` em bancos novos;
4. testar `stamp 0001` + `upgrade head` sobre uma copia do schema atual sem dados de producao;
5. ao concluir 11.2, atualizar o item 15.1 para tratar somente expand/contract, operacao, backup,
   pool, constraints e migrations futuras, sem recriar o baseline.

Downgrade so e executado em banco temporario de teste. Em ambiente compartilhado, rollback de app
mantem as tabelas aditivas e revoga sessoes; nao remove historico de consentimento/auditoria.

## Ondas de implementacao

| Onda | Tarefas | Dependencia | Entrega |
| --- | --- | --- | --- |
| 0 | 11.0 | nenhuma | baseline limpa e G0 formalmente aprovado. |
| 1 | 11.1, 11.2 | 11.0 | contrato aprovado e banco migravel. |
| 2 | 11.3, 11.4 | 11.2 | SIWE EOA/ERC-1271 e ciclo de sessao completos. |
| 3 | 11.5 | 11.3-11.4 | policies aplicadas em todas as rotas existentes. |
| 4 | 11.6 | 11.3-11.5 | frontend autenticado e contrato OpenAPI sincronizado. |
| 5 | 11.7 | 11.3-11.6 | hardening, E2E, revisao e evidencia do gate. |

11.1 e 11.2 podem avancar em paralelo depois do gate. A implementacao de 11.3 e 11.4 pode ser
dividida por modulo, mas o verify/refresh precisa de uma unica transacao e revisao conjunta. A
mudanca quebradora de payloads em 11.5 deve entrar junto com os clientes frontend correspondentes,
para que nenhum commit deixe a jornada principal inutilizavel.

## Tarefas detalhadas

### 11.0 Fechar a baseline

**Arquivos:** correcoes pendentes da Fase 10, `docs/producao/evidencias/FASE-10-VALIDACAO.md`,
`docs/producao/RELEASE-GATES.md`.

- [ ] concluir e commitar as correcoes de job ID zero e perfil sem jobs;
- [ ] executar `scripts/check.sh` em checkout limpo;
- [ ] concluir CI/SBOM/protecao/release do G0 e registrar os links;
- [ ] criar branch da Fase 11 a partir do SHA aprovado, conforme a protecao da `main`.

**Aceite:** `git status --porcelain` vazio, G0 marcado como aprovado e SHA base registrado.

### 11.1 ADR, ameacas e matriz executavel

**Arquivos novos:** `docs/adr/ADR-001-SIWE-SESSAO.md`,
`docs/producao/evidencias/FASE-11-MATRIZ-AUTORIZACAO.md`.

**Arquivos alterados:** `.env.example`, `backend/app/core/config.py`,
`backend/tests/test_config.py`, `docs/producao/03-SEGURANCA-E-AMEACAS.md`.

- [ ] registrar no ADR as decisoes congeladas deste plano, incluindo TTLs, cookies, CSRF,
  revogacao, tratamento de RPC e limites de retencao;
- [ ] adicionar configuracoes de SIWE, cookies, HMAC/CSRF, documentos legais, TTL e allowlists;
- [ ] exigir HTTPS, cookie seguro, segredos nao-placeholder e dominio/URI coerentes em staging e
  production; permitir HTTP somente em localhost de development/test;
- [ ] documentar a matriz rota x ator x relacao x resposta de negacao;
- [ ] atualizar o threat model para session fixation, refresh reuse, phishing, replay concorrente,
  ERC-1271 mutavel, CSRF, CORS, IDOR e indisponibilidade de Redis/RPC.

**Testes:** matriz de configuracao por ambiente e validacao negativa de segredo, origem, TTL e URI.

**Aceite:** nenhuma decisao de seguranca necessaria para codificar permanece em aberto.

### 11.2 Alembic e persistencia de identidade

**Arquivos novos:** `backend/alembic.ini`, `backend/migrations/env.py`,
`backend/migrations/script.py.mako`, `backend/migrations/versions/0001_baseline.py`,
`backend/migrations/versions/0002_identity_and_sessions.py`,
`backend/tests/test_migrations.py`, `backend/scripts/manage_role.py`.

**Arquivos alterados:** `backend/pyproject.toml`, `backend/uv.lock`, `backend/app/models.py`,
`docker-compose.yml`, `scripts/bootstrap.sh`, `scripts/check.sh`, CI e documentacao da Fase 15.
`backend/sql/schema.sql` permanece congelado apenas como fixture do schema legado e deixa de ser
executado no bootstrap.

- [ ] adicionar Alembic com URL obtida de `Settings`, sem credencial fixa em arquivo;
- [ ] reproduzir exatamente tipos, tabelas, indices e constraints preexistentes na revision 0001;
- [ ] criar as entidades de auth da tabela acima na revision 0002, somente com mudancas aditivas;
- [ ] implementar repositorios/servicos que usem tempo UTC do banco e updates condicionais;
- [ ] fazer o consumo de challenge e criacao da familia ocorrerem na mesma transacao;
- [ ] fazer a rotacao de refresh usar lock/compare-and-set e revogar a familia quando detectar
  token consumido;
- [ ] criar CLI operacional para conceder/revogar `support` e `operator`, sem endpoint publico e
  com audit event obrigatorio;
- [ ] substituir `Base.metadata.create_all` dos testes de integracao por migration ate `head`;
- [ ] criar limpeza idempotente de desafios/tokens expirados, invocavel por worker futuro.

**Testes:** banco vazio `upgrade head`; schema atual `stamp 0001` + `upgrade head`; downgrade em DB
temporario; duas verificacoes concorrentes do mesmo challenge; duas rotacoes concorrentes do mesmo
refresh; revision unica em `head`; entidades de auth coerentes entre models e migration.

**Aceite:** exatamente uma tentativa concorrente cria sessao e o banco limpo nasce apenas por
migration.

### 11.3 Challenge e verificacao SIWE

**Arquivos novos:** `backend/app/api/auth.py`, `backend/app/services/siwe.py`,
`backend/app/services/signatures.py`, `backend/tests/test_siwe.py`,
`backend/tests/test_erc1271.py`.

**Arquivos alterados:** `backend/app/main.py`, `backend/app/schemas.py`,
`backend/app/core/config.py`, `contracts/src/MockERC1271Wallet.sol` ou fixture equivalente de teste.

- [ ] gerar mensagem ERC-4361 canonica no servidor e resposta com `Cache-Control: no-store`;
- [ ] normalizar wallet para storage e usar checksum na mensagem;
- [ ] exigir `Origin` exata em challenge/verify e vincula-la a domain/URI configurados;
- [ ] verificar desafio ativo, ambiente corrente, termos vigentes e assinatura antes do consumo;
- [ ] distinguir EOA de contrato por bytecode na chain configurada;
- [ ] validar EOA por ERC-191 e ERC-1271 por `eth_call` com timeout e magic value estrito;
- [ ] registrar tipo de signer e bloco de verificacao; revalidar ERC-1271 no refresh e antes de
  acesso sensivel que dependa da identidade contratual;
- [ ] mapear assinatura invalida, desafio invalido/expirado/consumido e dependencia indisponivel
  para erros estaveis sem revelar detalhes exploraveis;
- [ ] criar usuario na primeira autenticacao e persistir os aceites legais na mesma transacao da
  sessao.

**Testes:** vetores validos e invalidos; assinatura de outra wallet; nonce expirado/reutilizado;
domain/URI/chain/version/tempo divergentes; termos antigos; assinatura malformada; EOA; contrato
ERC-1271 valido, magic value errado, revert e RPC indisponivel.

**Aceite:** os casos EOA e ERC-1271 passam contra Anvil/bytecode real e nenhum erro consome um
challenge reutilizavel legitimamente.

### 11.4 Ciclo de sessao, CSRF e rate limit

**Arquivos novos:** `backend/app/core/security.py`, `backend/app/dependencies/auth.py`,
`backend/app/services/sessions.py`, `backend/app/services/rate_limit.py`,
`backend/tests/test_sessions.py`, `backend/tests/test_rate_limit.py`.

**Arquivos alterados:** `backend/app/api/auth.py`, `backend/app/main.py`,
`backend/app/core/config.py`, `docker-compose.yml` e CI.

- [ ] emitir, resolver e revogar access/refresh opacos sem registrar valores em logs;
- [ ] implementar `/auth/session`, `/auth/csrf`, refresh rotativo, logout e logout global;
- [ ] trocar identificador de sessao no login/refresh e limpar todos os cookies em qualquer logout;
- [ ] aplicar verificacao de Origin e CSRF em toda mutacao autenticada, inclusive refresh;
- [ ] configurar CORS com origins, metodos e headers explicitos quando `allow_credentials=true`;
- [ ] aplicar rate limit atomico no Redis com chaves namespaced e TTL;
- [ ] adicionar headers de seguranca e `Cache-Control: no-store` em auth/respostas privadas;
- [ ] auditar login, falha, refresh reuse, logout, revogacao e rate limit com metadata redigida.

**Testes:** flags/nomes de cookie por ambiente; access/refresh expirados; rotacao; reuso que revoga
a familia; logout atual/global; session fixation; CSRF ausente/incorreto; Origin cruzada; limites por
IP/wallet/sessao; Redis indisponivel; ausencia de segredos em logs/audit events.

**Aceite:** access e refresh anteriores deixam de funcionar imediatamente apos logout, logout
global ou deteccao de reuso.

### 11.5 Policy layer e remocao de identidade declarativa

**Arquivos novos:** `backend/app/policies.py`, `backend/tests/test_authorization_matrix.py`.

**Arquivos alterados:** `backend/app/api/routes.py`, `backend/app/schemas.py`, servicos afetados e
testes de API existentes.

- [ ] criar dependencies/policies reutilizaveis para owner, participante, arbitro atribuido,
  support e operator;
- [ ] remover `actor_wallet` e `uploader_wallet` dos request models e remover wallet do path de
  operacoes exclusivas do ator;
- [ ] mover update de perfil para `/users/me` e respeitar `profile_visibility` na consulta publica;
- [ ] derivar swipe, match e uploader exclusivamente de `CurrentActor`;
- [ ] filtrar disputas por relacionamento e proteger evidencia com lookup autorizado;
- [ ] proteger indexer, refresh de reputacao e metricas com papel operator;
- [ ] garantir que `role_preference`, casing de wallet e IDs descobertos nao alterem autorizacao;
- [ ] registrar acessos sensiveis e acoes administrativas sem conteudo do recurso.

**Testes:** para cada rota privada, executar owner/participante, outra wallet, arbitro atribuido,
outro arbitro, support, operator e anonimo. Incluir troca de JSON, URL, casing e UUID enumerado.

**Aceite:** a matriz inteira passa e busca alheia por recurso privado e indistinguivel de recurso
inexistente.

### 11.6 Frontend autenticado

**Arquivos novos:** `frontend/src/lib/auth.ts`, `frontend/src/lib/auth.test.ts`,
`frontend/src/components/AuthSessionProvider.tsx` e testes de componentes/fluxo.

**Arquivos alterados:** `frontend/src/lib/wallet.ts`, `frontend/src/lib/api.ts`,
`frontend/src/App.tsx`, `frontend/src/components/WalletBar.tsx`,
`frontend/src/components/ProfilePanel.tsx`, `frontend/src/components/EvidencePanel.tsx`,
`frontend/src/components/TermsBanner.tsx`, `frontend/package.json` e lock.

- [ ] separar estado de wallet conectada de estado autenticado;
- [ ] obter config/challenge, assinar a mensagem retornada pelo servidor e verificar com
  `credentials: include`;
- [ ] manter somente estado nao secreto em memoria e restaurar por `/auth/session`;
- [ ] obter CSRF por resposta `no-store`, enviar no header das mutacoes e executar um unico refresh
  coordenado entre requests e abas (`BroadcastChannel`/lock) quando o access expirar;
- [ ] remover wallet declarada dos payloads de perfil, swipe e evidencia;
- [ ] tratar rejeicao de assinatura, sessao expirada, refresh revogado, account change e chain
  change sem loop de assinatura/refresh;
- [ ] exibir termos antes do challenge, estado autenticando, logout e erro recuperavel acessivel;
- [ ] preservar edicao de perfil sem depender da existencia de jobs no marketplace;
- [ ] expor uma interface de assinatura compativel com provider EIP-1193, sem duplicar a unificacao
  de providers pertencente a Fase 12.

**Testes:** login EOA simulado; restauracao; logout; refresh unico concorrente; account/chain
change; assinatura rejeitada; API indisponivel; CSRF; nenhuma credencial em Web Storage; perfil
disponivel com lista de jobs vazia.

**Aceite:** reload restaura sessao sem nova assinatura e troca de wallet/rede encerra a identidade
anterior antes de qualquer mutacao.

### 11.7 Contratos, hardening e evidencia

**Arquivos novos:** `scripts/auth-smoke.sh`,
`docs/producao/evidencias/FASE-11-VALIDACAO.md`,
`docs/runbooks/REVOGACAO-DE-SESSAO.md`.

**Arquivos alterados:** `backend/openapi.json`, `frontend/src/lib/api.generated.ts`,
`scripts/generate-api-schema.sh`, `scripts/check.sh`, workflow de CI,
`docs/producao/00-DIAGNOSTICO-ATUAL.md`, `docs/producao/RELEASE-GATES.md`.

- [ ] regenerar OpenAPI/tipos e provar diff zero em segunda geracao;
- [ ] adicionar migration, auth PostgreSQL/Redis e smoke EOA/ERC-1271 aos checks hospedados;
- [ ] executar revisao manual focada em SIWE, IDOR, CSRF, cookie, CORS e vazamento em logs;
- [ ] executar fuzz/property tests para gerador/canonicalizador de mensagem, tokens e payloads
  malformados;
- [ ] documentar revogacao individual/global, refresh reuse, indisponibilidade de RPC/Redis,
  rotacao de segredo e resposta a roubo de sessao;
- [ ] confirmar que bundle de producao nao contem segredo, token, fixture ou origem de development;
- [ ] atualizar diagnostico e gate somente com links imutaveis de CI/commit/relatorio.

**Aceite:** smoke real cobre login, cookie, `/auth/session`, mutacao propria, IDOR negado, refresh,
logout e ERC-1271; todos os checks passam em checkout limpo e na CI hospedada.

## Sequencia de commits sugerida

1. `docs(auth): freeze SIWE session and authorization contract`
2. `feat(db): add migration baseline and identity persistence`
3. `feat(auth): implement SIWE verification and revocable sessions`
4. `feat(frontend): add wallet authentication lifecycle`
5. `fix(api): enforce session-derived authorization policies`
6. `test(auth): add security gates smoke and revocation runbook`

Cada commit deve executar os testes diretamente afetados. O commit 5 deve conter no mesmo diff as
mudancas de schemas, cliente frontend e testes, evitando um contrato intermediario inseguro ou
inconsumivel.

## Plano de validacao

### Local e CI

```bash
scripts/bootstrap.sh
docker compose up -d postgres redis
uv run --project backend --extra dev --locked alembic upgrade head
uv run --project backend --extra dev --locked ruff check backend/app backend/tests
uv run --project backend --extra dev --locked pytest backend/tests
scripts/generate-api-schema.sh
git diff --exit-code -- backend/openapi.json frontend/src/lib/api.generated.ts
npm run lint --prefix frontend
npm test --prefix frontend
npm run build:production --prefix frontend
scripts/auth-smoke.sh
scripts/check.sh
```

Migration downgrade, concorrencia destrutiva e testes de reuso usam banco/Redis temporarios
exclusivos; nunca apontam para um ambiente compartilhado.

### Casos bloqueantes

- challenge reutilizado, expirado, concorrente ou de outro ambiente;
- EOA invalida e ERC-1271 com bytecode, magic value ou RPC incorretos;
- access/refresh roubado apos logout, rotacao ou revogacao global;
- refresh token reutilizado sem revogacao da familia;
- mutacao sem CSRF/Origin valida;
- troca de wallet no JSON, path, casing ou sessao;
- leitura de perfil/evidencia/disputa privada por nao participante;
- arbitro nao atribuido ou support acessando evidencia;
- endpoint operacional acessivel por usuario comum;
- auth/rate limit falhando aberta quando Redis ou RPC esta indisponivel;
- mensagem, assinatura, token, nonce ou cookie presente em log/erro/audit event.

## Evidencias

| Item | Referencia |
| --- | --- |
| SHA base e G0 aprovado | pendente |
| ADR de sessao | pendente |
| Alembic baseline + migration auth | pendente |
| Matriz de autorizacao executada | pendente |
| Suite SIWE EOA/ERC-1271 | pendente |
| Suite concorrencia/replay/revogacao | pendente |
| OpenAPI sem drift | pendente |
| Smoke E2E e CI hospedada | pendente |
| Revisao de seguranca | pendente |
| Runbook de revogacao | pendente |

## Gate de saida

- [ ] SIWE rejeita replay, concorrencia, expiracao, ambiente incorreto e assinatura invalida.
- [ ] EOA e ERC-1271 passam contra implementacoes reais de teste.
- [ ] Nenhuma mutacao usa wallet declarada como identidade.
- [ ] IDOR e escalacao horizontal/vertical estao cobertos pela matriz automatizada.
- [ ] Logout, logout global e refresh reuse invalidam todos os tokens afetados.
- [ ] CSRF, CORS, cookies, rate limits, headers e redacao de logs passam nos testes.
- [ ] Migration sobe banco limpo e schema atual; contrato OpenAPI regenera sem drift.
- [ ] Frontend restaura e encerra sessao corretamente sem credencial em Web Storage.
- [ ] CI hospedada, revisao de seguranca e runbook estao anexados como evidencia.

G1 nao e aprovado nesta fase: a Fase 11 entrega apenas a parcela de identidade e acesso. O gate
completo continua dependendo das demais secoes de staging.

## Riscos e mitigacoes

| Risco | Mitigacao |
| --- | --- |
| Fases 11 e 15 alterarem migrations em paralelo | Fase 11 passa a ser dona do baseline minimo; Fase 15 rebaseia e assume revisions posteriores. |
| Fases 11 e 12 alterarem wallet/provider | Fase 11 depende de interface EIP-1193 injetada; Fase 12 continua dona da conexao e transacoes. |
| Estado ERC-1271 mudar apos login | Sessoes curtas, logout global e evento/runbook; revalidacao continua obrigatoria em risco elevado. |
| RPC/Redis indisponivel causar bypass | Fail-closed em auth e mutacoes; `503` observavel sem consumir challenge. |
| Cookies cross-site exigirem `SameSite=None` | Implantar app/API no mesmo site; qualquer excecao exige nova revisao de CSRF/CORS. |
| Mudanca de API quebrar o frontend | Regenerar tipos e atualizar consumidores no mesmo commit de enforcement. |
| Consentimento sem versao juridica aprovada | Gate de entrada bloqueia challenge ate versoes/URLs estarem configuradas. |

## Referencias normativas

- [ERC-4361 - Sign-In with Ethereum](https://eips.ethereum.org/EIPS/eip-4361)
- [ERC-1271 - Standard Signature Validation Method for Contracts](https://eips.ethereum.org/EIPS/eip-1271)
- [SIWE - Security Considerations](https://docs.login.xyz/additional-support/security-considerations)
- [OWASP - Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP - CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Alembic - Official Documentation](https://alembic.sqlalchemy.org/en/latest/)

# Fase 10 - Fundacao Confiavel: Execucao

**Status:** em validacao
**Especificacao:** [FASE-10-FUNDACAO-CONFIAVEL](../fases/FASE-10-FUNDACAO-CONFIAVEL.md)
**Dependencias:** nenhuma
**Gate de saida:** G0

## Resultado esperado

Checkout reproduzivel, contratos de dados seguros, mocks isolados, CI obrigatoria e evidencia
hospedada de todos os checks.

## Tarefas

### 10.1 Reprodutibilidade local

- [x] Fixar Foundry, OpenZeppelin, Python e dependencias npm.
- [x] Manter `uv.lock`, `package-lock.json` e submodulos versionados.
- [x] Disponibilizar `scripts/bootstrap.sh` para checkout novo.
- [x] Disponibilizar `scripts/check.sh` para todas as suites.
- [x] Automatizar Postgres, Redis, Anvil, deploy, indexacao, API e frontend.

**Saida:** bootstrap e stack local sem passos ocultos.
**Evidencia:** log de checkout limpo executando bootstrap, check e demo.

### 10.2 Tipos e fronteiras Web3

- [x] Serializar IDs e valores `uint256` como strings decimais.
- [x] Converter para `bigint` apenas na borda Viem.
- [x] Cobrir ID maior que `Number.MAX_SAFE_INTEGER`.
- [x] Centralizar formatadores de USDC, BPS, data, estado e endereco.

**Saida:** API e frontend preservam valores on-chain exatamente.
**Evidencia:** teste unitario, resposta OpenAPI e teste Foundry com ID grande.

### 10.3 Contrato de API

- [x] Exportar OpenAPI deterministicamente.
- [x] Gerar tipos TypeScript a partir do schema.
- [x] Bloquear drift entre backend e artefato gerado.

**Saida:** um contrato versionado entre API e frontend.
**Evidencia:** job `schema-contract` verde.

### 10.4 Configuracao por ambiente

- [x] Separar development, test, staging e production.
- [x] Rejeitar endereco zero, placeholder, RPC inseguro e chain invalida.
- [x] Validar bytecode dos contratos no smoke test.
- [x] Permitir mock apenas por flag explicita em desenvolvimento.

**Saida:** ambiente implantavel falha cedo quando configurado incorretamente.
**Evidencia:** testes de configuracao positiva e negativa.

### 10.5 Qualidade e seguranca automatizadas

- [x] Executar lint, testes e build de frontend/backend/contratos.
- [x] Executar fuzz, invariantes e Slither.
- [x] Executar npm audit, pip-audit, Trivy de repo e imagens.
- [x] Gerar SBOM e fixar actions/imagens por SHA ou digest.
- [x] Executar imagem backend como usuario nao-root com healthcheck.

**Saida:** pipeline falha para regressao ou finding bloqueante.
**Evidencia:** logs dos jobs e artefatos SBOM.

### 10.6 Fechamento hospedado

- [ ] Organizar alteracoes em commits revisaveis.
- [ ] Executar CI no GitHub a partir de checkout limpo.
- [ ] Tornar todos os jobs required checks da branch principal.
- [ ] Anexar run, commit e SBOM a evidencia da fase.
- [ ] Aprovar formalmente o G0.

**Saida:** fundacao protegida contra merge que viole os checks.
**Evidencia:** branch protection e run hospedado do commit aprovado.

## Evidencias

| Item | Referencia |
| --- | --- |
| Validacao local | [FASE-10-VALIDACAO](../evidencias/FASE-10-VALIDACAO.md) |
| Commit final | pendente |
| CI hospedada | pendente |
| Branch protection | pendente |
| Aprovacao G0 | pendente |

## Gate de saida

- [ ] Todos os itens do G0 estao marcados e possuem evidencia.
- [ ] Nenhuma alteracao da fase permanece fora do commit aprovado.
- [ ] Fases 11, 12, 14 e 15 podem consumir os contratos estabilizados.

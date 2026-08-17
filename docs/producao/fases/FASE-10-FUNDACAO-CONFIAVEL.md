# Fase 10 - Fundacao Confiavel

**Status:** em validacao
**Dependencias:** nenhuma
**Esforco indicativo:** 1-2 semanas

**Plano de execucao:** [tarefas 10.x](../execucao/FASE-10.md)

## Objetivo

Tornar o repositorio reproduzivel e remover erros de representacao/configuracao que contaminariam
todas as fases seguintes. Esta fase nao adiciona features comerciais.

## Escopo

### Reprodutibilidade

- [x] Criar comando unico de bootstrap para submodulos Solidity e dependencias.
- [x] Fixar versoes relevantes de Foundry/OpenZeppelin e documentar atualizacao.
- [x] Corrigir/configurar lint do frontend e validar `npm run lint`.
- [x] Garantir ambiente Python reproduzivel e execucao de `ruff`/`pytest`.
- [x] Automatizar stack local Anvil + Postgres + Redis + API + frontend.
- [x] Atualizar READMEs que afirmam que fluxos incompletos estao prontos.

### Contratos de dados

- [x] Representar IDs e valores `uint256` como strings decimais em schemas e JSON.
- [x] Remover conversoes de IDs on-chain para `Number` no frontend.
- [x] Validar enderecos com biblioteca Ethereum, nao apenas prefixo/tamanho.
- [x] Criar formatadores unicos para USDC, BPS, datas, estados e enderecos.
- [x] Versionar schemas de API que serao consumidos pelas fases seguintes.

### Configuracao segura

- [x] Separar configuracao local, CI, staging e producao.
- [x] Fazer API/frontend falharem em staging/producao com enderecos zero ou placeholders.
- [x] Validar chain ID, contrato, token e RPC no startup/smoke test.
- [x] Isolar mock data por flag `VITE_ENABLE_DEMO_DATA`; default falso fora de dev.
- [x] Exibir estado indisponivel quando API real estiver vazia ou offline.

### Dependencias e CI

- [x] Atualizar dependencias runtime com vulnerabilidades corrigiveis.
- [x] Executar audit de frontend, Python, Solidity e imagens na CI.
- [x] Gerar SBOM dos artefatos de release.
- [x] Adicionar testes de contrato de schema frontend/backend.
- [ ] Bloquear merge com finding critico/alto sem excecao formal.

## Entregaveis

- Scripts de bootstrap, verificacao e E2E local.
- Schemas revisados usando strings para inteiros on-chain.
- Configuracao tipada com validacao por ambiente.
- Mock explicitamente isolado.
- CI verde em checkout limpo.
- Documentacao de desenvolvimento atualizada.

## Criterios de aceite

1. Um checkout novo executa bootstrap e todas as suites sem passos manuais nao documentados.
2. Um ID maior que `Number.MAX_SAFE_INTEGER` percorre prepare -> frontend -> contrato sem alteracao.
3. Builds de staging/producao nao importam nem exibem `mockData.ts`.
4. Endereco zero, placeholder ou chain divergente impede inicializacao do ambiente implantavel.
5. Audit de runtime nao possui vulnerabilidade critica/alta conhecida sem aprovacao.
6. Gate G0 de [Release Gates](../RELEASE-GATES.md) esta aprovado.

## Validacao

- `npm run lint && npm run build && npm test`
- `ruff check app tests && pytest`
- `forge fmt --check && forge test`
- E2E local com ID `18446744073709551617` e valores de USDC nos limites.
- Scan de dependencia e segredo em CI.

## Evidencias e pendencias

O resultado executado entre 2026-08-04 e 2026-08-09, os comandos, os screenshots e as lacunas que
ainda impedem aprovar o Gate G0 estao em
[Evidencia de validacao](../evidencias/FASE-10-VALIDACAO.md). O escopo e a politica dos scanners
estao em [Scans de seguranca](../SCANS-DE-SEGURANCA.md).

## Riscos

- Atualizacoes de WalletConnect/Viem podem exigir refatoracao antecipada da Fase 12.
- Mudanca de schema precisa ser coordenada antes de existir dado de producao.
- Nao aceitar fallback silencioso para mock como solucao de disponibilidade.

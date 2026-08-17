# Evidencia de Validacao - Fase 10

**Executado em:** 2026-08-04; atualizado em 2026-08-09
**Status:** validacao local concluida; fase aguardando evidencia hospedada
**Gate:** G0 ainda nao aprovado

## Resultado confirmado

| Area | Comando/evidencia | Resultado |
| --- | --- | --- |
| Frontend | `npm run lint`, `npm test`, `npm run build` | ESLint verde, 8 testes verdes em 2 arquivos e build local verde. |
| Bundle comercial | `npm run build:production` + busca de fixtures | Build verde e nenhum texto de `mockData.ts` no `dist`. |
| Backend | `ruff check app tests`, `pytest` | Ruff verde e 12 testes verdes em PostgreSQL 16 real. |
| Contratos | `forge fmt --check`, `forge test` | 8 unit/fuzz e 2 invariantes verdes com Solc 0.8.24. |
| Invariantes | Foundry, 64 runs x 32 calls | 4.096 chamadas sem revert; saldo do escrow igual ao passivo rastreado. |
| ID on-chain | API local + frontend unit + Foundry | `18446744073709551617` preservado como string/`uint256`. |
| Dependencias | `npm audit --omit=dev`, `pip-audit` | Nenhuma vulnerabilidade conhecida de runtime encontrada. |
| Contrato de API | `./scripts/generate-api-schema.sh` + `git diff` | OpenAPI e tipos TypeScript gerados sem drift. |
| Analise Solidity | Slither 0.11.5, `--exclude-dependencies --fail-high` | Exit 0; nenhum finding alto. |
| Repositorio | Trivy 0.70.0 `fs` | Zero high/critical em locks, zero misconfiguracao e zero segredo. |
| Imagem backend | Build multi-stage + Trivy `os,library` | Usuario `app`, healthcheck HTTP e zero high/critical. |
| Imagens locais | Trivy `os` em Postgres/Redis fixados por digest | Zero high/critical nos pacotes Alpine. |
| Stack local | `./demo.sh` | Postgres, Redis, Anvil, deploy, indexer, API e frontend ativos. |
| Runtime Web3 | `backend/scripts/validate_runtime.py` | Chain 31337 e bytecode de escrow/USDC confirmados. |
| SBOM | `./scripts/sbom.sh` | CycloneDX de frontend/backend e manifesto dos submodulos gerados. |
| Container HTTP | `docker run` + `/health` | Container Alpine respondeu `{"status":"ok"}` e ficou `healthy`. |

## Fluxo local observado

- `FreelanceEscrow`: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`.
- `MockUSDC`: `0x5FbDB2315678afecb367f032d93F642f64180aa3`.
- Job `1001` criado, financiado e indexado com dois milestones.
- `GET /jobs` retornou IDs e valores raw como strings decimais.
- `POST /jobs/prepare` devolveu o ID grande sem alteracao e total `2000000001`.
- Frontend respondeu HTTP 200; a captura final usa origem `localhost` e o job vindo do indexador.

Os enderecos acima pertencem ao Anvil efemero e nao sao enderecos de staging ou producao.

## Evidencia visual

- [Desktop 1440x1000](assets/fase-10-desktop.png)
- [Mobile 390x844](assets/fase-10-mobile.png)

## Decisoes de seguranca registradas

- O backend usa `python:3.12-alpine` por digest, build multi-stage, `uv.lock`, usuario sem shell e
  healthcheck sem dependencia adicional.
- A imagem Debian avaliada foi rejeitada porque continha 23 CVEs high/critical no sistema base.
- O scan completo da imagem oficial do Postgres detectou 15 CVEs da stdlib Go embutida no `gosu`.
  Postgres e Redis sao apenas infraestrutura local/CI; producao usa servicos gerenciados. O gate
  dessas imagens cobre pacotes do SO, conforme [politica de scans](../SCANS-DE-SEGURANCA.md).
- O action do Trivy esta fixado por SHA completo; imagens de runtime e infraestrutura estao
  fixadas por digest.

## Lacunas para concluir a fase

1. Executar a CI hospedada em um commit limpo e anexar o link do run.
2. Configurar `backend`, `frontend`, `contracts`, `schema-contract`, `sbom` e `security-scan` como
   required checks da branch protegida.
3. Aprovar formalmente o Gate G0 depois que as duas evidencias acima existirem.

## Riscos observados

- O bundle comercial do WalletConnect gera chunks acima de 500 kB; otimizar na Fase 12.
- `websockets.legacy` emite aviso de deprecacao transitivo no backend; acompanhar a atualizacao do
  Web3.py.
- `pip-audit` ignora apenas o pacote local `freelance-escrow-backend`, que nao existe no PyPI.

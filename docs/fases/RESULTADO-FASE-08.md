# Resultado - Fase 08 MVP Beta Controlado

Data: 2026-06-29

## Status Geral

Fase 08 iniciada. Foram implementados o endpoint de metricas de funil,
a validacao de cap no backend e o banner de aviso de testnet no frontend.

## Implementado Nesta Iteracao

### Backend

- `GET /metrics/funnel`: retorna contagens de swipes, matches, jobs criados,
  jobs fundeados, jobs concluidos/resolvidos, jobs em disputa, milestones
  aprovados e disputas abertas.
- `POST /jobs/prepare` agora valida o total contra `MAX_JOB_AMOUNT_RAW`
  configuravel via env var (padrao 10.000 USDC).
- Adicionado `max_job_amount_raw` ao `Settings`.

### Frontend

- `TermsBanner` no topo da pagina informando que o ambiente e testnet,
  sem valor real, com cap de USDC 10.000 e link para termos de uso.
- O banner e dispensavel via botao X.

## Validacoes Executadas

### Backend

```bash
ruff check app tests
pytest
```

Resultado: `All checks passed!`, `4 passed`.

### Backend HTTP (TestClient)

Validado:

- `GET /metrics/funnel`: `200` com 8 contagens.
- `POST /jobs/prepare` com cap excedido: `422` com mensagem.
- `POST /jobs/prepare` com valor dentro do cap: `200`.

### Frontend

```bash
npm run build
```

Resultado: TypeScript e Vite build passaram.

### Contratos

```bash
forge test
```

Resultado: `6 passed; 0 failed; 0 skipped`.

## Ainda Falta Para Concluir A Fase 08

- Definir cap baixo por job na configuracao de staging/producao.
- Configurar admin/arbitro com governanca segura (multisig).
- Ativar termos minimos de uso e avisos de risco completos.
- Criar fluxo de suporte para disputas.
- Instrumentar metricas de funil em dashboard ou relatorio.
- Monitorar eventos do contrato continuamente.
- Criar processo de resposta a incidente.
- Rodar pilotos com usuarios selecionados.
- Relatorio de aprendizados do beta.

## Conclusao

A Fase 08 tem agora o esqueleto operacional: metricas de funil consultaveis,
protecao de cap no backend e aviso de testnet no frontend.

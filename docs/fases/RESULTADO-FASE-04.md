# Resultado - Fase 04 Evidencias e Disputas

Data: 2026-06-28

## Status Geral

Fase 04 iniciada. Foi implementado o primeiro corte de evidencias privadas off-chain e workspace basico de disputas, sem storage real de arquivos ainda.

## Implementado Nesta Iteracao

### Backend

- Modelo SQLAlchemy `EvidenceFile` mapeado para a tabela `evidence_files` ja prevista no schema SQL.
- `POST /evidence` para registrar evidencia privada vinculada a job, milestone e/ou disputa.
- Calculo de `sha256_hash` a partir do corpo textual enviado.
- Geração de `storage_uri` logica no formato `local://evidence/{sha256}/{file_name}`.
- `GET /jobs/{job_id}/evidence` para listar evidencias de um job.
- `GET /disputes` para listar disputas projetadas pelo indexer.
- `GET /disputes/{dispute_id}/evidence` para listar evidencias vinculadas a uma disputa.

### Frontend

- `EvidencePanel` no sidebar para registrar nota/evidencia privada no job ativo.
- Listagem de evidencias do job com URI e hash SHA-256.
- API frontend ganhou funcoes para criar e listar evidencias.

## Validacoes Executadas

### Backend

```bash
.venv/bin/ruff check app
```

Resultado: `All checks passed!`

### Backend HTTP/TestClient

Validado:

- `POST /evidence`: `200`, evidencia criada com hash SHA-256.
- `GET /jobs/{job_id}/evidence`: `200`, retornou a evidencia criada.
- `GET /disputes`: `200`.

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

## Ainda Falta Para Concluir A Fase 04

- Upload real de arquivos binarios ou integracao com storage privado.
- Vincular automaticamente evidencia registrada ao hash enviado em `submitMilestone` e `openDispute`.
- Workspace de arbitro com decisao de split e chamada assistida a `resolveDispute`.
- Controle de acesso por participante/arbitro; hoje a API ainda confia nos parametros enviados.
- Tela separada de disputa com evidencias das duas partes.
- Garantir deduplicacao por hash e politica de redacao/remocao off-chain.

## Conclusao

A Fase 04 esta iniciada com o esqueleto funcional de evidencias privadas: a aplicacao ja registra conteudo off-chain, calcula hash verificavel e permite consultar evidencias por job/disputa.

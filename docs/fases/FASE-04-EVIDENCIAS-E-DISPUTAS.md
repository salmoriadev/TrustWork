# Fase 04 - Evidencias e Disputas

## Objetivo

Implementar o fluxo de evidencias privadas e arbitragem humana centralizada previsto no MVP.

## Contexto

O contrato nao julga qualidade subjetiva. A avaliacao deve ocorrer off-chain por um arbitro, enquanto o contrato executa a decisao financeira.

## Escopo

- Upload privado de arquivos de entrega e evidencia.
- Calculo de hash SHA-256 para arquivos/evidencias.
- Registro de evidencias em `evidence_files`.
- Vinculo de evidencia a job, milestone e disputa.
- Tela para freelancer submeter entrega com evidencia.
- Tela para cliente abrir disputa com justificativa e evidencia.
- Workspace privado de disputa para o arbitro.
- Acao arbitral para chamar `resolveDispute` com split em BPS.
- Historico de decisoes e hashes usados.

## Fora de Escopo

- Arbitragem descentralizada.
- Appeals complexos.
- Kleros ou integracao externa.

## Entregaveis

- Storage privado configurado localmente ou em provider escolhido.
- APIs de upload e listagem de evidencias.
- UI de disputa para partes e arbitro.
- Fluxo completo `openDispute` -> revisao off-chain -> `resolveDispute`.

## Criterios de Aceite

- Entrega pode ser enviada com arquivo privado e hash verificavel.
- Disputa pode reunir evidencias das duas partes.
- Arbitro ve as evidencias e decide um split.
- Contrato executa a divisao financeira conforme decisao arbitral.
- Dados sensiveis nao sao publicados on-chain, apenas hashes.

## Dependencias

- Fase 02 concluida.
- Fase 03 recomendada para UX completa.
- Storage privado definido.

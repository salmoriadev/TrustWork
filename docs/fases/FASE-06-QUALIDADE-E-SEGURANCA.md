# Fase 06 - Qualidade e Seguranca

## Objetivo

Elevar a confiabilidade tecnica do MVP antes de qualquer uso publico com valor real, mesmo baixo.

## Contexto

O projeto lida com custodia programatica. Bugs de contrato, projecao incorreta de eventos ou fluxos confusos de assinatura podem causar perda, travamento ou liberacao indevida de fundos.

## Escopo

- Expandir testes unitarios do contrato.
- Adicionar fuzz tests para valores, splits e transicoes.
- Testar falhas de permissao e status invalido.
- Adicionar testes automatizados do backend.
- Adicionar testes de integracao backend/indexer.
- Adicionar testes criticos do frontend.
- Introduzir Alembic para migracoes.
- Criar pipeline CI.
- Revisar fluxo de assinatura e previews de transacao.
- Criar checklist de seguranca pre-deploy.

## Fora de Escopo

- Auditoria externa paga.
- Bug bounty publico.
- Mainnet sem cap.

## Entregaveis

- Suite de testes automatizados ampliada.
- CI executando contrato, backend e frontend.
- Migracoes Alembic.
- Checklist de seguranca.
- Relatorio de riscos residuais.

## Criterios de Aceite

- CI roda em branch/PR.
- Testes de contrato cobrem caminhos felizes e falhas principais.
- Backend tem testes para endpoints e projector.
- Frontend tem cobertura dos fluxos criticos.
- Nenhuma funcao administrativa permite saque arbitrario de fundos de usuarios.

## Dependencias

- Fases 00 a 05 estabilizadas o suficiente para teste.

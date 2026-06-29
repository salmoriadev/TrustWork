# Fase 03 - Produto Marketplace Minimo

Status: iniciada em [RESULTADO-FASE-03.md](RESULTADO-FASE-03.md).

## Objetivo

Transformar a demo tecnica em uma experiencia minima de marketplace com perfis, descoberta por swipe, matches e criacao guiada de contrato.

## Contexto

O canvas e o white paper definem que o produto deve parecer um app de freelance, nao uma tela DeFi. Esta fase cria a camada de produto ao redor do escrow.

## Escopo

- Login por wallet com assinatura de mensagem.
- Cadastro basico de usuario e perfil.
- Preferencia de papel: cliente, freelancer ou ambos.
- Listagem de jobs disponiveis.
- Persistencia de swipes em `swipe_actions`.
- Regra simples de match.
- Chat desbloqueado apenas apos match, mesmo que inicialmente basico.
- Builder guiado de escopo e milestones.
- Dashboard de contratos ativos.

## Fora de Escopo

- Recomendacao sofisticada.
- Mobile nativo.
- Boosts pagos.
- Planos de agencia.

## Entregaveis

- Fluxo de onboarding basico.
- Swipe persistido no backend.
- Matches consultaveis.
- Tela de dashboard com contratos ativos.
- Criacao de job orientada por milestones.

## Criterios de Aceite

- Usuario conecta carteira e cria perfil.
- Usuario cliente cria job com milestones.
- Usuario freelancer visualiza cards e registra swipe.
- Match gera uma relacao operacional entre as partes.
- A criacao do contrato usa os dados acordados no builder.

## Dependencias

- Fase 02 concluida.
- Tabelas `users` e `swipe_actions` operacionais.
- Estrategia minima de sessao/autenticacao definida.

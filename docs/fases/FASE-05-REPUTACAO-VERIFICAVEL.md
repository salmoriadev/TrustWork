# Fase 05 - Reputacao Verificavel

## Objetivo

Implementar o diferencial de reputacao baseada em trabalho pago e eventos verificaveis do contrato.

## Contexto

O white paper posiciona reputacao verificavel como elemento central contra lock-in de plataformas tradicionais. A reputacao deve ser agregada, auditavel e preservar privacidade.

## Escopo

- Calcular jobs concluidos.
- Calcular milestones concluidos.
- Calcular volume verificado em faixas publicas.
- Calcular taxa de aprovacao direta.
- Calcular taxa de disputa.
- Calcular clientes recorrentes.
- Atualizar `user_reputation_snapshots` a partir de eventos.
- Exibir painel publico de reputacao.
- Implementar grant simples para reputacao privada detalhada.
- Criar sinais iniciais de risco Sybil.

## Fora de Escopo

- Provas zero-knowledge.
- Badges soulbound.
- Sistema avancado de score proprietario.

## Entregaveis

- Worker/servico de atualizacao de reputacao.
- API de reputacao publica.
- API de permissao para detalhes privados.
- UI de reputacao no perfil.
- Documentacao das metricas.

## Criterios de Aceite

- Reputacao muda apos pagamento aprovado/resolvido.
- Volume aparece em faixas, nao em valor exato publico.
- Disputas impactam metricas.
- Dados privados exigem permissao do owner.
- Eventos on-chain conseguem explicar os numeros agregados.

## Dependencias

- Fase 02 concluida.
- Fase 04 recomendada para historico de disputas completo.

# Trilha de Producao e Comercializacao

Esta pasta define o trabalho necessario para transformar o TrustWork de um MVP tecnico em um
produto implantavel, operavel e comercializavel. A analise-base foi feita em **2026-08-03** contra
o codigo da branch `main` no commit `a813a76`, considerando tambem as melhorias de frontend ainda
presentes no worktree.

As fases historicas 00-09 em [`docs/fases`](../fases/README.md) continuam registrando a construcao
do MVP. Esta trilha comeca na fase 10 porque corrige lacunas descobertas depois do MVP e adiciona
os requisitos que nao podem ser tratados apenas como evolucao visual.

## Documentos

| Documento | Finalidade |
| --- | --- |
| [Diagnostico atual](00-DIAGNOSTICO-ATUAL.md) | Diferencia implementado, parcial, mockado e ausente. |
| [Arquitetura-alvo](01-ARQUITETURA-ALVO.md) | Define componentes, fluxos e fontes de verdade de producao. |
| [Requisitos de produto](02-REQUISITOS-DE-PRODUTO.md) | Especifica jornadas e capacidades minimas do produto. |
| [Seguranca e ameacas](03-SEGURANCA-E-AMEACAS.md) | Define ativos, riscos, controles e requisitos do contrato. |
| [Operacao e deploy](04-OPERACAO-E-DEPLOY.md) | Define ambientes, observabilidade, backups e runbooks. |
| [Compliance e comercializacao](05-COMPLIANCE-E-COMERCIALIZACAO.md) | Lista decisoes juridicas, comerciais e de atendimento. |
| [Roadmap de producao](ROADMAP-PRODUCAO.md) | Ordena as fases 10-18, dependencias e marcos. |
| [Planos de execucao](execucao/README.md) | Quebra cada fase em tarefas, saidas e evidencias. |
| [Release gates](RELEASE-GATES.md) | Estabelece criterios objetivos para staging, beta e mainnet. |
| [Scans de seguranca](SCANS-DE-SEGURANCA.md) | Documenta ferramentas, escopos, bloqueios e excecoes de scan. |

## Fases

| Fase | Status | Especificacao | Execucao | Resultado obrigatorio |
| --- | --- | --- | --- | --- |
| 10 | em validacao | [Fundacao confiavel](fases/FASE-10-FUNDACAO-CONFIAVEL.md) | [Tarefas 10.x](execucao/FASE-10.md) | Build reproduzivel, contratos de dados seguros e mocks isolados. |
| 11 | nao iniciada | [Identidade e autorizacao](fases/FASE-11-IDENTIDADE-E-AUTORIZACAO.md) | [Tarefas 11.x](execucao/FASE-11.md) | SIWE, sessoes e permissoes por participante. |
| 12 | nao iniciada | [Wallet e transacoes](fases/FASE-12-WALLET-E-TRANSACOES.md) | [Tarefas 12.x](execucao/FASE-12.md) | Um provider, rede validada e receipts confirmados. |
| 13 | nao iniciada | [Evidencias privadas](fases/FASE-13-EVIDENCIAS-PRIVADAS.md) | [Tarefas 13.x](execucao/FASE-13.md) | Upload criptografado e hash verificavel de ponta a ponta. |
| 14 | nao iniciada | [Escrow V2](fases/FASE-14-ESCROW-V2.md) | [Tarefas 14.x](execucao/FASE-14.md) | Saidas de seguranca e regras economicas fixadas por job. |
| 15 | nao iniciada | [Backend e indexador](fases/FASE-15-BACKEND-E-INDEXADOR.md) | [Tarefas 15.x](execucao/FASE-15.md) | Processamento resiliente, migracoes e APIs protegidas. |
| 16 | nao iniciada | [Produto comercial](fases/FASE-16-PRODUTO-COMERCIAL.md) | [Tarefas 16.x](execucao/FASE-16.md) | Jornadas completas de cliente, freelancer e arbitro. |
| 17 | nao iniciada | [Qualidade e staging](fases/FASE-17-QUALIDADE-E-STAGING.md) | [Tarefas 17.x](execucao/FASE-17.md) | E2E real em Base Sepolia e operacao observavel. |
| 18 | nao iniciada | [Auditoria e lancamento](fases/FASE-18-AUDITORIA-E-LANCAMENTO.md) | [Tarefas 18.x](execucao/FASE-18.md) | Auditoria remediada, compliance aprovado e rollout controlado. |

## Definicao de pronto

"Pronto para deploy" significa que o release gate de staging foi aprovado. "Pronto para ser
comercializado" significa que os gates de beta e mainnet foram aprovados, incluindo seguranca,
operacao, suporte e parecer juridico. Conclusao de tarefas sem evidencia nao conclui uma fase.

## Regras de manutencao

- Atualizar o diagnostico quando uma fase alterar uma afirmacao sobre o estado atual.
- Registrar links para testes, transacoes e auditorias na fase correspondente.
- Nao marcar um criterio como concluido com base apenas em implementacao; anexar evidencia.
- Decisoes irreversiveis de contrato, custodia, arbitragem e jurisdicao exigem ADR proprio.
- Segredos, documentos pessoais e evidencias de usuarios nunca pertencem ao Git.

# Plano de Execucao para Producao

## Finalidade

Esta pasta transforma o [Roadmap de Producao](../ROADMAP-PRODUCAO.md) em trabalho executavel.
Cada fase possui um unico playbook com tarefas numeradas, dependencias, saidas e evidencias. Os
arquivos em [`../fases`](../fases/) continuam sendo a especificacao de escopo e prevalecem em caso
de divergencia.

## Como usar

1. Confirmar que as dependencias da fase foram concluidas.
2. Atribuir responsavel e aprovador para a fase.
3. Executar tarefas na ordem indicada, salvo paralelismo explicitamente permitido.
4. Marcar item apenas depois de produzir a evidencia descrita.
5. Anexar links de CI, deploy, transacoes, dashboards ou relatorios na secao de evidencias.
6. Atualizar o status da fase no [indice de producao](../README.md).

## Estados

| Estado | Significado |
| --- | --- |
| `nao iniciada` | Nenhum trabalho aceito como evidencia. |
| `em andamento` | Ha tarefa ativa e responsavel definido. |
| `bloqueada` | Dependencia ou decisao externa impede progresso. |
| `em validacao` | Implementacao terminou, mas o gate ainda nao foi aprovado. |
| `concluida` | Todas as tarefas e o gate de saida possuem evidencia. |

## Regras de conclusao

- Codigo sem teste nao conclui tarefa.
- Teste local sem CI hospedada nao conclui gate de release.
- Configuracao sem ambiente implantado nao prova operacao.
- Finding alto/critico exige correcao ou excecao formal com owner e validade.
- Mudanca financeira ou administrativa do contrato exige ADR e nova revisao de seguranca.
- Documento juridico deve ser aprovado por profissional habilitado; checklist tecnico nao substitui
  parecer.

## Sequencia e playbooks

| Fase | Status atual | Dependencias | Playbook | Resultado |
| --- | --- | --- | --- | --- |
| 10 | em validacao | nenhuma | [Fundacao](FASE-10.md) | G0 reproduzivel e protegido. |
| 11 | nao iniciada | 10 | [Identidade](FASE-11.md) | SIWE, sessao e autorizacao. |
| 12 | nao iniciada | 10 | [Wallet](FASE-12.md) | Wallet unica e receipts reais. |
| 13 | nao iniciada | 11, 12 | [Evidencias](FASE-13.md) | Arquivos privados verificaveis. |
| 14 | nao iniciada | 10 + decisoes | [Escrow V2](FASE-14.md) | Regras economicas e saidas seguras. |
| 15 | nao iniciada | 10 | [Backend](FASE-15.md) | API/indexador resilientes. |
| 16 | nao iniciada | 11-15 | [Produto](FASE-16.md) | Jornadas completas por papel. |
| 17 | nao iniciada | 16 | [Staging](FASE-17.md) | G1 aprovado em Base Sepolia. |
| 18 | nao iniciada | 17 | [Lancamento](FASE-18.md) | G2/G3 e rollout comercial. |

## Paralelismo permitido

- Depois do G0, fases 11, 12, 14 e 15 podem avancar em paralelo com owners diferentes.
- Fase 13 inicia quando identidade e wallet tiverem contratos estaveis.
- Fase 16 integra as entregas de 11 a 15; nao deve recriar logica dessas fases na UI.
- Fases 17 e 18 sao sequenciais porque exigem codigo congelado e evidencia operacional.

## Registro de evidencias

Cada playbook termina com uma tabela de evidencias. Preencher com links ou identificadores
imutaveis: commit SHA, run de CI, digest, endereco, tx hash, dashboard, relatorio e aprovacao.

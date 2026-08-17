# Fase 18 - Auditoria e Lancamento Comercial

**Status:** nao iniciada
**Dependencias:** Fase 17 e release candidate congelado
**Esforco indicativo:** 4-8+ semanas, condicionado a terceiros

**Plano de execucao:** [tarefas 18.x](../execucao/FASE-18.md)

## Objetivo

Reduzir risco residual, concluir autorizacoes juridicas/operacionais e lancar em Base Mainnet com
allowlist, caps e capacidade de resposta proporcionais ao risco.

## Escopo

### Auditoria e pentest

- [ ] Contratar auditoria independente do contrato no commit congelado.
- [ ] Auditar integracao, scripts de deploy, roles, invariantes e premissas economicas.
- [ ] Executar pentest de SIWE, autorizacao, storage, API, frontend e operacao administrativa.
- [ ] Remediar findings e obter reteste/carta de encerramento.
- [ ] Publicar resumo e escopo, preservando informacao exploravel enquanto necessario.
- [ ] Abrir canal de vulnerabilidade e bug bounty privado/publico conforme risco.

### Compliance e negocio

- [ ] Obter parecer juridico assinado para entidade, mercados e modelo.
- [ ] Implementar requisitos de KYC/AML/sancoes definidos pelo parecer.
- [ ] Publicar termos, privacidade, riscos, fees e regras de arbitragem.
- [ ] Configurar contabilidade, tributacao, treasury e faturamento.
- [ ] Treinar suporte, arbitros e responsaveis por incidente.

### Mainnet

- [ ] Criar multisigs com hardware wallets, signatarios e politicas independentes.
- [ ] Simular deploy e configuracao completa em fork.
- [ ] Deployar, verificar fonte/bytecode e publicar enderecos oficiais.
- [ ] Validar USDC Base Mainnet pela lista oficial da Circle.
- [ ] Configurar allowlist, cap por job, TVL global e alertas.
- [ ] Executar smoke financeiro com menor valor pratico e reconciliar.

### Rollout

- [ ] Iniciar com usuarios convidados, poucos jobs simultaneos e suporte proximo.
- [ ] Reuniao diaria de risco durante janela inicial.
- [ ] Revisar TVL, disputas, falhas, latencia, suporte e fraude antes de elevar caps.
- [ ] Publicar status e incidentes relevantes.
- [ ] Fazer retrospectiva e decisao formal para Gate G3.

## Entregaveis

- Relatorios de auditoria, pentest, remediacao e commit correspondente.
- Pareceres/aprovacoes e documentos externos publicados.
- Enderecos mainnet, multisigs, configuracoes, txs de deploy e verificacao.
- Runbook de lancamento, rollback/pause e contatos de emergencia.
- Dashboard de risco, TVL, saldo/passivo e operacao.
- Relatorio do beta mainnet e decisao de expansao.

## Criterios de aceite

1. Gate G2 de [Release Gates](../RELEASE-GATES.md) esta aprovado por engenharia, seguranca,
   operacao e juridico.
2. Nenhum finding critico/alto esta aberto no codigo implantado.
3. Bytecode mainnet corresponde ao source/commit auditado e verificado.
4. Roles e treasury nao dependem de EOA unica.
5. Reconciliacao do primeiro fluxo financeiro fecha sem divergencia.
6. Suporte e resposta a incidente estao disponiveis durante todo o rollout.

## Criterios para ampliar acesso

- Periodo de beta e volume minimo definidos pelo comite de risco foram cumpridos.
- SLOs e limites de disputa/fraude/suporte foram atendidos.
- Nao houve incidente financeiro critico sem remediacao.
- Auditoria continua valida para o codigo implantado.
- Gate G3 foi aprovado formalmente.

## Principio de lancamento

Deploy mainnet nao significa lancamento irrestrito. Cap e allowlist sao controles de seguranca; so
devem crescer depois que dados operacionais provarem capacidade tecnica, arbitral e de suporte.

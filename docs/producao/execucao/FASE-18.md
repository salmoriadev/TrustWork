# Fase 18 - Auditoria e Lancamento: Execucao

**Status:** nao iniciada
**Especificacao:** [FASE-18-AUDITORIA-E-LANCAMENTO](../fases/FASE-18-AUDITORIA-E-LANCAMENTO.md)
**Dependencias:** fase 17 e G1
**Gates de saida:** G2 e, depois de operacao comprovada, G3

## Resultado esperado

Codigo auditado, modelo juridico aprovado, operacao preparada e mainnet iniciada com allowlist,
caps baixos e criterios objetivos de expansao.

## Tarefas

### 18.1 Compliance e estrutura comercial

- [ ] Obter parecer juridico para entidade, mercados e classificacao do servico.
- [ ] Decidir e implementar KYC/KYB, AML e sancoes ou registrar inaplicabilidade.
- [ ] Publicar termos, privacidade, riscos, fees e arbitragem.
- [ ] Definir contabilidade, tributacao, treasury e faturamento.
- [ ] Firmar contratos com arbitros e fornecedores de dados.
- [ ] Validar aceite versionado dos documentos no produto.

**Saida:** capacidade legal e operacional para cobrar/aceitar valor.
**Evidencia:** pareceres, versoes publicadas e aprovacoes.

### 18.2 Auditoria independente do contrato

- [ ] Contratar auditoria para commit/bytecode congelados.
- [ ] Incluir contrato, integracao, deploy, roles e premissas economicas.
- [ ] Entregar spec, invariantes, tests e threat model.
- [ ] Classificar e corrigir findings.
- [ ] Obter reteste e carta/relatorio de encerramento.
- [ ] Publicar resumo e escopo apropriados.

**Saida:** contrato mainnet sem finding alto aberto.
**Evidencia:** relatorio, commit auditado e reteste.

### 18.3 Pentest da plataforma

- [ ] Testar SIWE, sessao, CSRF, IDOR e roles.
- [ ] Testar APIs, uploads, storage, URLs assinadas e KMS.
- [ ] Testar frontend, WalletConnect e supply chain.
- [ ] Testar superficies administrativas e suporte.
- [ ] Corrigir findings e executar reteste.
- [ ] Abrir canal de vulnerabilidade e definir bug bounty.

**Saida:** aplicacao off-chain sem P0/P1 aberto.
**Evidencia:** relatorio de pentest, reteste e politica de disclosure.

### 18.4 Preparacao de governanca mainnet

- [ ] Criar multisigs com hardware wallets e signatarios independentes.
- [ ] Definir quorum, delays, rotacao e recuperacao.
- [ ] Separar admin, pause, arbitragem e treasury.
- [ ] Ensaiar proposta, assinatura, execucao e emergencia.
- [ ] Publicar inventario de enderecos e poderes.
- [ ] Aprovar caps iniciais por job e TVL.

**Saida:** nenhuma chave pessoal controla fundos/parametros sozinha.
**Evidencia:** enderecos Safe, politicas e simulacoes.

### 18.5 Deploy mainnet controlado

- [ ] Simular deploy/configuracao completa em fork.
- [ ] Validar enderecos oficiais de chain e USDC.
- [ ] Executar deploy pelo processo multisig aprovado.
- [ ] Verificar fonte e bytecode no explorer.
- [ ] Publicar enderecos, ABI, parametros e bloco inicial.
- [ ] Executar smoke financeiro com menor valor pratico.
- [ ] Reconciliar saldo, eventos, projecao e fee.

**Saida:** mainnet implantada e verificada sem abrir acesso amplo.
**Evidencia:** tx hashes, explorer, manifestos e reconciliacao.

### 18.6 Operacao e suporte

- [ ] Treinar suporte, arbitros, plantao e comunicacao.
- [ ] Validar dashboards, alertas, status page e runbooks.
- [ ] Definir SLA e matriz de severidade.
- [ ] Confirmar fornecedores, limites e contatos de emergencia.
- [ ] Ensaiar pause, rollback off-chain e comunicacao publica.
- [ ] Definir reuniao e relatorio diario da janela inicial.

**Saida:** pessoas e processos prontos antes do primeiro usuario.
**Evidencia:** escala, treinamento e exercicio final.

### 18.7 Beta mainnet limitado

- [ ] Ativar allowlist com poucos usuarios/jobs.
- [ ] Aplicar cap por job e TVL global.
- [ ] Monitorar transacoes, saldo/passivo, disputas e fraude.
- [ ] Manter suporte proximo e reuniao diaria de risco.
- [ ] Registrar incidentes e decisoes de elevar/manter/reduzir caps.
- [ ] Suspender entrada se criterio de rollback for atingido.

**Saida:** valor real opera sob exposicao controlada.
**Evidencia:** relatorio do beta, metricas e decisoes de risco.

### 18.8 G2, G3 e expansao

- [ ] Aprovar G2 antes de aceitar beta mainnet.
- [ ] Definir periodo/volume minimo para avaliar expansao.
- [ ] Comprovar SLOs por quatro semanas.
- [ ] Confirmar auditoria/pentest validos para o codigo implantado.
- [ ] Confirmar capacidade de suporte/arbitragem.
- [ ] Aprovar G3 antes de elevar acesso ou caps.
- [ ] Publicar retrospectiva e riscos residuais.

**Saida:** expansao baseada em evidencia, nao em pressao comercial.
**Evidencia:** atas G2/G3, SLOs, metricas e aprovadores.

## Evidencias

| Item | Referencia |
| --- | --- |
| Parecer/compliance | pendente |
| Auditoria/reteste | pendente |
| Pentest/reteste | pendente |
| Multisigs/mainnet | pendente |
| Beta/G2/G3 | pendente |

## Gate de saida

- [ ] G2 aprovado antes do primeiro valor real de usuario.
- [ ] Nenhum finding alto/critico aberto no codigo implantado.
- [ ] Mainnet usa allowlist, caps, multisig e monitoramento.
- [ ] G3 so e aprovado depois do periodo operacional definido.

# Fase 17 - Qualidade e Staging

**Status:** nao iniciada
**Dependencias:** Fase 16
**Esforco indicativo:** 3-4 semanas de validacao ativa

**Plano de execucao:** [tarefas 17.x](../execucao/FASE-17.md)

## Objetivo

Provar em Base Sepolia que produto, contrato, indexador, storage e operacao funcionam juntos por um
periodo sustentado, inclusive sob falhas, antes de submeter o release a auditoria/lancamento.

## Escopo

### Ambiente de staging

- [ ] Infra equivalente a producao em topologia e configuracao, com escala menor.
- [ ] Escrow V2 deployado e verificado com enderecos oficiais registrados.
- [ ] USDC Base Sepolia validado contra a Circle.
- [ ] Seeds apenas para contas internas identificadas; sem fallback mock.
- [ ] Dashboards, alertas, backups, status page e plantao ativos.

### Suites

- [ ] E2E completo de cliente, freelancer, arbitro e suporte.
- [ ] Matriz de wallets, browsers e mobile.
- [ ] Testes de carga, soak e concorrencia em swipes/jobs/uploads.
- [ ] DAST/pentest de API e frontend.
- [ ] Fuzz/invariant/fork finais do contrato congelado.
- [ ] Testes de compatibilidade entre ABI, API e frontend.

### Game days

- [ ] RPC primario fora e fallback ativo.
- [ ] Reorg e replay do indexador.
- [ ] Redis e worker indisponiveis.
- [ ] Restore de banco/storage.
- [ ] Transacao pendente/revertida/replaced.
- [ ] Evidencia inacessivel ou tentativa de acesso indevido.
- [ ] Suspeita de exploit e processo de pause/comunicacao.

### Beta convidado

- [ ] Executar por no minimo duas semanas sem valor real.
- [ ] Coletar UAT, suporte, funil, tempos e falhas.
- [ ] Classificar findings e corrigir todos P0/P1.
- [ ] Congelar escopo e commit que segue para auditoria.

## Entregaveis

- Ambiente staging reproduzivel e inventario de enderecos.
- Relatorio E2E com tx hashes e matriz de compatibilidade.
- Relatorio de carga, seguranca, acessibilidade e game days.
- Baseline de SLO e capacidade.
- Release candidate congelado para Fase 18.

## Criterios de aceite

1. Gate G1 de [Release Gates](../RELEASE-GATES.md) integralmente aprovado.
2. Duas semanas de beta testnet sem finding P0/P1 aberto.
3. SLOs de staging atendidos e alertas acionados corretamente nos game days.
4. Restore e rebuild do indexador concluem dentro do RTO definido.
5. Todas as jornadas possuem evidencia de E2E real e UAT aprovada.
6. Commit/bytecode candidato a auditoria esta congelado.

## Regra de regressao

Mudanca funcional depois do congelamento retorna os casos afetados para teste e pode reiniciar o
periodo de estabilidade. Mudanca no contrato exige aprovacao de seguranca e ajuste do escopo de
auditoria.

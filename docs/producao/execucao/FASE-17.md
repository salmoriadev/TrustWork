# Fase 17 - Qualidade e Staging: Execucao

**Status:** nao iniciada
**Especificacao:** [FASE-17-QUALIDADE-E-STAGING](../fases/FASE-17-QUALIDADE-E-STAGING.md)
**Dependencias:** fase 16
**Gate de saida:** G1

## Resultado esperado

Release candidate opera em Base Sepolia, com topologia equivalente a producao, observabilidade,
recuperacao testada e beta convidado sem valor real.

## Tarefas

### 17.1 Infraestrutura de staging

- [ ] Provisionar frontend CDN/WAF, API, worker e indexador separados.
- [ ] Provisionar PostgreSQL/Redis gerenciados e storage/KMS privados.
- [ ] Configurar RPC primario e fallback independentes.
- [ ] Separar segredos, wallets, multisig e dados do ambiente.
- [ ] Configurar DNS, TLS, CORS e WalletConnect oficiais.
- [ ] Registrar infraestrutura como codigo e inventario.

**Saida:** staging reproduz topologia de producao em escala menor.
**Evidencia:** IaC, diagrama implantado e scan de configuracao.

### 17.2 Deploy verificavel

- [ ] Deployar Escrow V2 em Base Sepolia.
- [ ] Validar USDC de testnet contra fonte oficial.
- [ ] Verificar fonte e bytecode no explorer.
- [ ] Publicar endereco, bloco inicial, ABI e parametros.
- [ ] Aplicar migrations e seeds apenas para contas internas identificadas.
- [ ] Executar smoke de config, bytecode, API, storage e indexador.

**Saida:** ambiente oficial sem fallback mock.
**Evidencia:** tx hashes, explorer, manifesto e smoke.

### 17.3 CI/CD e operacao basica

- [ ] Promover artefato imutavel por digest.
- [ ] Configurar deploy canario/blue-green e rollback.
- [ ] Ativar logs, metricas, traces, dashboards e alertas.
- [ ] Configurar backups, PITR e restore ensaiado.
- [ ] Publicar status page e escala de plantao.
- [ ] Vincular alertas a owner e runbook.

**Saida:** deploy e degradacao sao reversiveis/observaveis.
**Evidencia:** pipeline, rollback, restore e alerta de teste.

### 17.4 E2E e matriz de compatibilidade

- [ ] Executar cliente -> freelancer -> arbitro -> encerramento.
- [ ] Cobrir cancelamento, revisao, disputa e timeout.
- [ ] Executar matriz de wallets, browsers e mobile.
- [ ] Testar receipt, revert, replacement e lag de indexacao.
- [ ] Verificar ABI, OpenAPI e frontend do mesmo release.
- [ ] Guardar tx hashes e evidencias do run.

**Saida:** jornadas completas repetiveis em testnet.
**Evidencia:** relatorio E2E e matriz assinada.

### 17.5 Performance e seguranca

- [ ] Executar carga em leitura, swipe, job, upload e worker.
- [ ] Executar soak e concorrencia de eventos/transacoes.
- [ ] Executar DAST e pentest preliminar de API/frontend.
- [ ] Executar fuzz, invariant e fork no commit candidato.
- [ ] Validar SLOs iniciais e capacidade.
- [ ] Corrigir findings P0/P1.

**Saida:** capacidade e riscos conhecidos antes do beta.
**Evidencia:** relatorios load/soak/DAST/Foundry.

### 17.6 Game days

- [ ] Derrubar RPC primario e validar fallback.
- [ ] Simular reorg e replay do indexador.
- [ ] Indisponibilizar Redis/worker.
- [ ] Restaurar banco e storage.
- [ ] Simular tx pendente/revertida/replaced.
- [ ] Simular evidencia inacessivel/acesso indevido.
- [ ] Simular exploit, pause e comunicacao.

**Saida:** equipe executa runbooks dentro de RTO/RPO.
**Evidencia:** timeline, metricas, lacunas e acoes de cada game day.

### 17.7 Beta convidado

- [ ] Selecionar usuarios e definir suporte/SLA.
- [ ] Operar no minimo duas semanas sem valor real.
- [ ] Medir funil, falhas, suporte, lag e disputas.
- [ ] Coletar feedback estruturado por papel.
- [ ] Corrigir P0/P1 e revisar riscos aceitos.
- [ ] Confirmar capacidade operacional para auditoria.

**Saida:** prova de uso e operacao, nao apenas teste interno.
**Evidencia:** relatorio de duas semanas e decisao go/no-go.

### 17.8 Congelamento

- [ ] Congelar escopo, commit, bytecode e configuracao candidatos.
- [ ] Gerar SBOM e manifestos finais.
- [ ] Listar findings e excecoes abertas.
- [ ] Atualizar threat model e documentacao operacional.
- [ ] Aprovar G1 e entregar pacote para auditoria.

**Saida:** objeto exato da fase 18 identificado.
**Evidencia:** tag/commit, digests, G1 e pacote de auditoria.

## Evidencias

| Item | Referencia |
| --- | --- |
| Ambiente/enderecos | pendente |
| CI/CD e rollback | pendente |
| E2E/matriz | pendente |
| Game days/restore | pendente |
| Beta e G1 | pendente |

## Gate de saida

- [ ] Todos os itens G1 possuem evidencia.
- [ ] Beta operou duas semanas sem P0/P1 aberto.
- [ ] Restore e incident response foram exercitados.
- [ ] Commit candidato esta congelado para auditoria.

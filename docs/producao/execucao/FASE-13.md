# Fase 13 - Evidencias Privadas: Execucao

**Status:** nao iniciada
**Especificacao:** [FASE-13-EVIDENCIAS-PRIVADAS](../fases/FASE-13-EVIDENCIAS-PRIVADAS.md)
**Dependencias:** fases 11 e 12
**Gate relacionado:** G1 - storage privado

## Resultado esperado

Arquivos ficam privados, criptografados, escaneados e vinculados por manifesto canonico ao job,
milestone, uploader e compromisso on-chain.

## Tarefas

### 13.1 Decisoes de dados e storage

- [ ] Escolher object storage, KMS e regiao por ambiente.
- [ ] Classificar perfil, descricao, evidencia e compliance.
- [ ] Definir limites de tipo, tamanho e quantidade.
- [ ] Definir retencao, exclusao, legal hold e backup.
- [ ] Definir manifesto canonico versionado.
- [ ] Registrar ameacas de upload e acesso indevido.

**Saida:** arquitetura e ciclo de vida aprovados.
**Evidencia:** ADR, data map e threat model atualizados.

### 13.2 Modelo e autorizacao

- [ ] Criar migrations para objeto, manifesto, estado e acesso.
- [ ] Vincular evidencia a job, milestone, uploader e disputa.
- [ ] Aplicar policies de cliente, freelancer e arbitro atribuido.
- [ ] Definir estados `uploading`, `scanning`, `ready`, `rejected`, `deleted`.
- [ ] Impedir acesso por mera descoberta de ID ou URI.

**Saida:** metadata privada e autorizada pela sessao.
**Evidencia:** migration e testes IDOR por estado/papel.

### 13.3 Upload seguro

- [ ] Emitir URL assinada curta para chave de objeto controlada pelo servidor.
- [ ] Limitar tamanho, metodo, content type e tempo.
- [ ] Calcular SHA-256 durante upload e confirmar no storage.
- [ ] Validar MIME por conteudo, extensao e assinatura magica.
- [ ] Executar malware scan assincrono e quarentena.
- [ ] Rejeitar arquivo ate o scan terminar.

**Saida:** arquivo nao confiavel nunca e publicado diretamente.
**Evidencia:** testes de arquivo valido, MIME falso, excesso, malware e URL expirada.

### 13.4 Integridade canonica

- [ ] Serializar manifesto de forma deterministica e versionada.
- [ ] Incluir hash, tamanho, tipo, job, milestone e uploader.
- [ ] Calcular compromisso `bytes32` uma unica vez no backend.
- [ ] Retornar compromisso pronto ao frontend, sem rehash manual.
- [ ] Criar verificador arquivo -> manifesto -> API -> on-chain.

**Saida:** o mesmo arquivo produz compromisso reproduzivel e auditavel.
**Evidencia:** vetores de teste compartilhados entre backend/frontend/contrato.

### 13.5 Download e auditoria

- [ ] Autorizar cada solicitacao de download.
- [ ] Emitir URL assinada curta, sem cache publico.
- [ ] Registrar ator, objeto, job, finalidade e horario.
- [ ] Omitir URL, conteudo e chaves de logs.
- [ ] Bloquear objeto rejeitado, deletado ou sob restricao.

**Saida:** acesso privado, temporario e rastreavel.
**Evidencia:** testes de permissao e audit log sem segredo.

### 13.6 Privacidade e ciclo de vida

- [ ] Implementar retencao por classe.
- [ ] Implementar legal hold para disputa.
- [ ] Implementar exclusao/anonimizacao quando permitida.
- [ ] Documentar limites de exclusao do compromisso on-chain.
- [ ] Testar restauracao e indisponibilidade do storage/KMS.

**Saida:** ciclo de vida executavel e compativel com politica juridica.
**Evidencia:** jobs de lifecycle e exercicio de exclusao/restore.

### 13.7 Validacao E2E

- [ ] Testar upload, scan, submit on-chain e verificacao.
- [ ] Testar acesso por cliente, freelancer, arbitro e terceiro.
- [ ] Testar arquivo adulterado e manifesto divergente.
- [ ] Executar scan de bucket publico e configuracao KMS.
- [ ] Medir performance e custo de arquivos nos limites.

**Saida:** evidencia privada verificavel de ponta a ponta.
**Evidencia:** E2E, relatorio de seguranca e custos.

## Evidencias

| Item | Referencia |
| --- | --- |
| ADR storage/KMS | pendente |
| Manifesto e vetores | pendente |
| Suite upload/download | pendente |
| Scan de configuracao | pendente |
| E2E on-chain | pendente |

## Gate de saida

- [ ] Nenhum objeto ou bucket permite acesso publico.
- [ ] Conteudo so fica disponivel depois do malware scan.
- [ ] Hash/manifesto/compromisso podem ser reconstruidos.
- [ ] Acesso indevido e alteracao de arquivo falham nos testes.

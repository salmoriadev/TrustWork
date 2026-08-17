# Fase 13 - Evidencias Privadas

**Status:** nao iniciada
**Dependencias:** Fases 11 e 12
**Esforco indicativo:** 2-4 semanas

**Plano de execucao:** [tarefas 13.x](../execucao/FASE-13.md)

## Objetivo

Armazenar entregas e evidencias com confidencialidade, autorizacao e integridade reproduzivel,
vinculando o mesmo compromisso criptografico ao arquivo, milestone e transacao on-chain.

## Escopo

### Storage e upload

- [ ] Escolher object storage privado e KMS por ambiente.
- [ ] Implementar upload direto com URL curta assinada e limite de tamanho.
- [ ] Validar MIME por conteudo, extensao, checksum e malware.
- [ ] Cifrar objetos e impedir listagem/acesso publico.
- [ ] Registrar estado `uploading`, `scanning`, `ready`, `rejected` e `deleted`.
- [ ] Implementar download autorizado com URL curta e audit log.

### Integridade

- [ ] Definir e versionar manifesto canonico conforme [arquitetura-alvo](../01-ARQUITETURA-ALVO.md).
- [ ] Calcular SHA-256 do objeto durante upload e verificar no storage.
- [ ] Calcular compromisso `bytes32` uma unica vez sobre o manifesto canonico.
- [ ] Enviar o compromisso retornado pela API sem rehash manual no frontend.
- [ ] Criar verificador que reconstrua manifesto e compare arquivo, API e on-chain.
- [ ] Vincular evidencia a job, milestone, uploader e eventual disputa.

### Privacidade e ciclo de vida

- [ ] Aplicar policy de cliente/freelancer/arbitro atribuida.
- [ ] Definir retencao por classe e legal hold para disputa.
- [ ] Implementar exclusao/anonimizacao off-chain quando permitida.
- [ ] Impedir conteudo, URLs assinadas e chaves em logs.
- [ ] Registrar todo acesso a evidencia para auditoria.

## Entregaveis

- Adaptador de storage e migracoes de metadata.
- Pipeline upload -> scan -> manifesto -> compromisso.
- Endpoints autorizados de upload, status, download e verificacao.
- UI de evidencia sem campos de hash manuais.
- Politica de retencao e runbooks de indisponibilidade/vazamento.

## Criterios de aceite

1. URL anonima ou usuario nao participante nao acessa metadata nem arquivo.
2. Alterar um byte do arquivo faz a verificacao falhar.
3. Compromisso exibido pela API e igual ao `bytes32` submetido on-chain.
4. Evidencia rejeitada por malware/tamanho nao pode ser submetida.
5. Arbitro perde acesso ao encerrar atribuicao conforme politica.
6. Backup/restore preserva objetos e capacidade de verificacao.

## Validacao

- Testes de IDOR, URL expirada, MIME falso, tamanho, malware de teste e upload interrompido.
- Teste golden do manifesto em backend e frontend.
- E2E com upload, submit on-chain, download e verificacao independente.
- Teste de retencao, legal hold e exclusao.

## Fora de escopo

- Publicacao de evidencias em IPFS publico.
- Provas zero-knowledge.
- Edicao de arquivo depois de submetido; nova versao gera nova evidencia.

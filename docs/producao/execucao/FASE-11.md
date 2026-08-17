# Fase 11 - Identidade e Autorizacao: Execucao

**Status:** nao iniciada
**Especificacao:** [FASE-11-IDENTIDADE-E-AUTORIZACAO](../fases/FASE-11-IDENTIDADE-E-AUTORIZACAO.md)
**Dependencias:** G0 aprovado
**Gate relacionado:** G1 - identidade e acesso

## Resultado esperado

A API deriva a identidade de uma sessao SIWE valida e aplica autorizacao por relacionamento e
papel. Nenhuma mutacao confia em uma wallet enviada no corpo.

## Tarefas

### 11.1 Contrato de autenticacao

- [ ] Registrar ADR para sessao por cookie ou bearer token.
- [ ] Definir TTL de nonce, sessao e refresh.
- [ ] Definir dominio, URI, chain ID e ambientes aceitos.
- [ ] Definir revogacao, rotacao e troca de wallet/rede.
- [ ] Modelar aceite versionado de termos e privacidade.

**Saida:** contrato de auth revisado antes do codigo.
**Evidencia:** ADR aprovado por backend, frontend e seguranca.

### 11.2 Persistencia de nonce e sessao

- [ ] Criar migrations para nonces, sessoes, refresh e aceite de termos.
- [ ] Gerar nonce criptograficamente aleatorio, atomico e de uso unico.
- [ ] Armazenar apenas material necessario e aplicar expiracao.
- [ ] Consumir nonce na mesma transacao que cria a sessao.
- [ ] Criar indices e limpeza de registros expirados.

**Saida:** replay e corrida de nonce impedidos no banco.
**Evidencia:** testes concorrentes e migration aplicada/revertida.

### 11.3 Fluxo SIWE

- [ ] Implementar endpoint de nonce.
- [ ] Gerar mensagem ERC-4361 com todos os campos obrigatorios.
- [ ] Validar dominio, URI, chain, issued-at, expiration e nonce.
- [ ] Validar EOA por recuperacao de assinatura.
- [ ] Suportar ou testar explicitamente wallets ERC-1271.
- [ ] Rejeitar assinatura reutilizada, expirada ou de outro ambiente.

**Saida:** login por wallet verificavel e sem replay.
**Evidencia:** suite positiva/negativa EOA e ERC-1271.

### 11.4 Ciclo de sessao

- [ ] Criar sessao curta e refresh rotativo.
- [ ] Implementar logout da sessao e revogacao global da wallet.
- [ ] Invalidar refresh reutilizado.
- [ ] Tratar expiracao, account change e chain change no frontend.
- [ ] Proteger cookies com `Secure`, `HttpOnly` e `SameSite` quando aplicavel.

**Saida:** sessao recuperavel, expiravel e revogavel.
**Evidencia:** testes de rotacao, roubo/reuso, logout e expiracao.

### 11.5 Policy layer de autorizacao

- [ ] Remover `actor_wallet` e `uploader_wallet` como identidade em mutacoes.
- [ ] Derivar wallet exclusivamente da sessao.
- [ ] Criar policies para cliente, freelancer, arbitro, suporte e operador.
- [ ] Autorizar job pelo relacionamento on-chain/projetado.
- [ ] Proteger perfil privado, match, evidencia, disputa e metricas.
- [ ] Separar rotas publicas, autenticadas e administrativas.

**Saida:** acesso horizontal e vertical bloqueado por policy central.
**Evidencia:** matriz RBAC/ABAC e testes de IDOR para cada recurso.

### 11.6 Hardening da API

- [ ] Aplicar rate limit por IP, wallet, sessao e rota.
- [ ] Aplicar CSRF quando houver autenticacao por cookie.
- [ ] Restringir CORS por allowlist exata de ambiente.
- [ ] Adicionar headers seguros e limite de payload.
- [ ] Padronizar erros sem revelar recurso privado.
- [ ] Registrar auth e acesso sensivel sem segredo ou PII desnecessaria.

**Saida:** superficie de auth resistente a abuso basico.
**Evidencia:** testes automatizados, scan e eventos de audit log.

### 11.7 Integracao e revisao

- [ ] Atualizar OpenAPI e tipos gerados.
- [ ] Atualizar frontend para estado autenticado real.
- [ ] Executar testes de concorrencia e replay.
- [ ] Executar revisao de seguranca focada em auth/IDOR.
- [ ] Documentar operacao de revogacao e incidente de sessao.

**Saida:** auth consumivel pelas fases 13 e 16.
**Evidencia:** CI, relatorio de revisao e smoke E2E.

## Evidencias

| Item | Referencia |
| --- | --- |
| ADR de sessao | pendente |
| Migration | pendente |
| Matriz de autorizacao | pendente |
| Suite SIWE | pendente |
| Revisao de seguranca | pendente |

## Gate de saida

- [ ] SIWE rejeita replay, dominio/chain incorretos e expiracao.
- [ ] Nenhuma mutacao usa wallet declarada como identidade.
- [ ] IDOR e escalacao de papel estao cobertos por testes.
- [ ] Rate limits e audit logs estao ativos no ambiente de teste.

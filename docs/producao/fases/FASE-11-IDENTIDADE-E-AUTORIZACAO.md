# Fase 11 - Identidade e Autorizacao

**Status:** nao iniciada
**Dependencias:** Fase 10
**Esforco indicativo:** 2-3 semanas

**Plano de execucao:** [tarefas 11.x](../execucao/FASE-11.md)

## Objetivo

Provar controle da wallet e garantir que cada acao off-chain seja executada apenas pelo papel
autorizado. Endereco enviado no payload deixa de ser identidade.

## Escopo

### SIWE e sessao

- [ ] Implementar endpoint de nonce atomico, aleatorio, curto e de uso unico.
- [ ] Gerar mensagem ERC-4361 com dominio, URI, chain ID, issued-at e expiration-time.
- [ ] Validar assinatura EOA e preparar suporte/teste para ERC-1271.
- [ ] Consumir nonce em transacao para impedir replay e concorrencia.
- [ ] Criar sessao curta e refresh rotativo com revogacao.
- [ ] Implementar logout, expiracao, troca de wallet/rede e revogacao global.
- [ ] Persistir aceite da versao de termos e politica de privacidade.

### Autorizacao

- [ ] Remover `actor_wallet`/`uploader_wallet` como fonte de identidade em mutacoes.
- [ ] Criar policy layer para cliente, freelancer, arbitro, suporte e operador.
- [ ] Autorizar acesso a job pelo relacionamento on-chain/projetado.
- [ ] Proteger perfis privados, matches, evidencias, disputas e metricas internas.
- [ ] Separar endpoints publicos, autenticados e administrativos.
- [ ] Adicionar audit log para auth, acesso sensivel e acao administrativa.

### Protecoes de API

- [ ] Rate limit por IP, wallet, sessao e rota.
- [ ] Protecao CSRF se a sessao usar cookie.
- [ ] CORS por allowlist exata de ambiente.
- [ ] Headers seguros e cookies `Secure`, `HttpOnly` e `SameSite` adequados.
- [ ] Mensagens de erro sem revelar existencia de recurso privado.

## Entregaveis

- Modulo de auth, modelos de nonce/sessao/aceite e migracoes.
- Middleware/dependencies FastAPI para ator autenticado.
- Matriz de permissoes executavel em testes.
- Fluxo de login/logout no frontend.
- Documentacao da sessao e runbook de revogacao.

## Criterios de aceite

1. Nao e possivel alterar perfil, swipe ou evidencia de outra wallet trocando JSON/URL.
2. Nonce reutilizado, expirado, de outro dominio ou outra chain e rejeitado.
3. Usuario nao participante nao descobre nem acessa recurso privado.
4. Arbitro ve apenas disputas atribuidas; suporte nao ve evidencia por padrao.
5. Logout/revogacao impede uso de access e refresh tokens anteriores.
6. Casos EOA e ERC-1271 suportados passam na suite prevista.

## Validacao

- Testes de replay, concorrencia, expiracao, troca de dominio e chain.
- Testes horizontais/verticais de autorizacao para cada rota.
- Testes de rate limit e revogacao.
- Pentest focado em IDOR, sessao, CSRF e assinatura.

## Referencia

- [ERC-4361: Sign-In with Ethereum](https://eips.ethereum.org/EIPS/eip-4361)

## Fora de escopo

- Login social custodial.
- Recuperacao de wallet.
- Passkeys/account abstraction, reservadas para pos-lancamento.

# Seguranca e Modelo de Ameacas

## Objetivo

Proteger fundos, identidade, evidencias privadas e integridade da projecao. Este documento nao
substitui auditoria independente nem threat model atualizado a cada mudanca de arquitetura.

## Ativos criticos

1. USDC bloqueado no escrow.
2. Chaves e papeis administrativos.
3. Sessoes autenticadas e nonces SIWE.
4. Evidencias, descricoes privadas e dados pessoais.
5. Integridade de jobs, milestones, fees e decisoes arbitrais.
6. Cursor, eventos e projecoes do indexador.
7. Segredos de infraestrutura, RPC, storage e notificacoes.

## Adversarios considerados

- Usuario tentando agir por outra wallet.
- Cliente ou freelancer tentando obter pagamento indevido.
- Arbitro malicioso, comprometido ou indisponivel.
- Operador interno abusando de acesso.
- Bot realizando spam, scraping, DoS ou Sybil.
- Atacante explorando frontend, API, dependencia ou contrato.
- RPC comprometido ou divergente.
- Reorg e falha parcial entre blockchain, banco e fila.

## Principais ameacas e controles

| Ameaca | Impacto | Controle minimo |
| --- | --- | --- |
| Falsificacao de wallet na API | Alteracao de perfil/evidencia alheia | SIWE, ator derivado da sessao e RBAC. |
| Replay de assinatura | Sessao indevida | Nonce atomico, expiracao, dominio e chain ID. |
| Rede ou contrato errado | Perda ou transacao invalida | Allowlist por ambiente, chain switch e simulacao. |
| ID truncado em JavaScript | Job divergente | Strings decimais e `bigint` na borda. |
| Hash nao reproduzivel | Evidencia sem valor probatorio | Manifesto canonico versionado e teste de verificacao. |
| Leitura de evidencia privada | Vazamento comercial/PII | Object storage privado, KMS, ABAC e URL curta assinada. |
| Fee alterada apos funding | Mudanca unilateral de termos | Snapshot imutavel por job. |
| Admin EOA comprometido | Pausa/role hostil | Multisig, hardware wallets, delay e menor privilegio. |
| Arbitro indisponivel | Fundos presos | SLA, timeout e fallback definidos no contrato. |
| Freelancer nao entrega | Fundos presos | Data de inicio/entrega e refund controlado. |
| Pause bloqueia saidas | Fundos presos em emergencia | Pause granular; preservar saidas seguras. |
| Indexador sofre reorg | Estado off-chain incorreto | Confirmacoes, block hash, rollback/rebuild. |
| Redis falha apos commit | Evento/alerta perdido | Outbox transacional e retry com DLQ. |
| Dependencia vulneravel | Comprometimento/DoS | Lockfile, scanning, SBOM e politica de atualizacao. |

## Requisitos do smart contract V2

- Fixar por job: token, fee, fee recipient aplicavel, arbitro e periodos.
- Incluir `deliveryDeadline` ou mecanismo equivalente de nao inicio/nao entrega.
- Definir timeout de arbitragem e caminho de fallback.
- Separar pausa de novas entradas de funcoes que devolvem/liberam fundos com seguranca.
- Manter checks-effects-interactions e `SafeERC20` em todas as transferencias.
- Usar administracao de duas etapas com delay. OpenZeppelin recomenda
  [`AccessControlDefaultAdminRules`](https://docs.openzeppelin.com/contracts/5.x/api/access).
- Definir explicitamente se o contrato e imutavel ou atualizavel. Se atualizavel, documentar
  governanca, storage layout, timelock e processo de upgrade; se imutavel, documentar migracao.
- Emitir eventos suficientes para reconstruir configuracoes economicas e deadlines.
- Limitar quantidade de milestones e custo de loops para evitar jobs inexequiveis.
- Definir cap por job e cap global de TVL para beta.

## Suite de seguranca do contrato

- Unit tests para cada transicao valida e invalida.
- Fuzz de valores, deadlines, splits, fees, assinaturas e quantidade de milestones.
- Invariantes: conservacao de fundos, payout nunca acima do deposito, milestone finalizado uma vez,
  job terminal irreversivel e nonce sem replay.
- Fork tests com o USDC oficial de Base e comportamento real de decimals/allowance.
- Analise estatica com Slither e ferramentas equivalentes.
- Testes diferenciais entre eventos e projecao do backend.
- Auditoria externa apos congelamento de escopo e nova revisao para mudancas posteriores.

## Seguranca da aplicacao

- CSP restritiva, HSTS, TLS, headers seguros e dependencia de terceiros minimizada.
- Rate limit por IP, sessao, wallet e rota; limites menores para auth, upload e RPC.
- Validacao de arquivo por assinatura real, tamanho, MIME, extensao e malware scan.
- Criptografia em transito e em repouso; chaves separadas por ambiente.
- Logs estruturados com redacao de tokens, cookies, PII, corpos e hashes sensiveis.
- Segredos em secret manager, rotacao e acesso auditado.
- SAST, dependency scanning, secret scanning e container scanning na CI.
- Pentest do app antes de mainnet e depois de mudancas significativas.

## Governanca e resposta

- Multisig com signatarios independentes para admin e treasury.
- Runbook de pause/unpause que descreve quando pausar, quem aprova e como comunicar.
- Canal privado de reporte e programa de bug bounty antes de ampliar TVL.
- Classificacao de incidentes, responsavel de plantao e obrigacao de post-mortem.
- Inventario publico dos enderecos oficiais de contrato, multisig e token.

## Gates de seguranca

Mainnet e bloqueada enquanto existir qualquer item:

- Finding critico/alto aberto em contrato, app ou dependencia de producao.
- Caminho conhecido que prende fundos sem prazo ou governanca definida.
- Admin em EOA unica.
- Evidencia acessivel sem autorizacao ou sem verificacao de integridade.
- Transacao que a interface declara concluida antes de receipt.
- Auditoria externa inexistente ou escopo do contrato alterado depois da auditoria.

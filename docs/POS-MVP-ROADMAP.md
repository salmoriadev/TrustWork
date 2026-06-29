# Roadmap Pos-MVP

Priorizado com base no white paper, canvas e aprendizados das fases 00-08.

## Fase 09-A — Onboarding sem Fricao (prioridade maxima)

Reduzir a necessidade de ETH/gas manual e assinatura unica para criar+financiar.

- Account abstraction (ERC-4337) com SimpleAccount.
- Paymaster para gas sponsorship.
- Acoes batched: approve USDC + createJob + fundJob em uma transacao.
- Passkeys e recuperacao de conta (WebAuthn).

**Por que primeiro:** A maior barreira para usuarios nao-web3 e ter que comprar ETH e fazer multiplas transacoes.

---

## Fase 09-B — API de Escrow para Comunidades

Transformar o contrato em infraestrutura reutilizavel.

- Contrato factory para deploy de escrow por comunidade/hackathon.
- API publica com autenticacao por assinatura.
- Webhooks para eventos.
- Limites e caps por API key.

**Por que segundo:** O white paper sugere crescimento de marketplace para infraestrutura.

---

## Fase 09-C — Monetizacao Expandida

- Boosts pagos para freelancers (destaque em swipes).
- Vagas destacadas para clientes.
- Plano Pro para agencias (multiplos contratos, branding, relatorios).
- Comissao diferenciada por volume.

**Por que terceiro:** Sem validacao de demanda real do beta, monetizacao complexa e prematura.

---

## Fase 09-D — Reputacao Avancada e Badges

- Badges on-chain (soulbound) para marcos: primeiro job, 10 jobs, sem disputas.
- Score composto: volume, taxa de aprovacao, antiguidade, diversidade de clientes.
- Provas zero-knowledge para privacidade de detalhes.

---

## Fase 09-E — Multi-Stablecoin / Cross-Chain

- Suporte a outras stablecoins (USDT, DAI, EURC).
- Wormhole / LayerZero para escrow entre chains.
- Uniswap swap integrado para aceitacao multi-coin.

---

## Consideracoes de Seguranca

- Auditoria externa do contrato antes de mainnet.
- Cap global de TVL ate auditoria.
- Bug bounty privado antes de valor real significativo.

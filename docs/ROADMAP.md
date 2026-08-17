# Roadmap Tecnico

> **Documento historico do MVP.** O roadmap vigente para deploy e comercializacao esta em
> [Roadmap de Producao](producao/ROADMAP-PRODUCAO.md), com as fases 10-18, dependencias e release
> gates objetivos. Os itens abaixo permanecem como registro da direcao original.

## Fase 1 - MVP controlado

- Base Sepolia como staging.
- Base Mainnet em producao com cap baixo por job.
- WalletConnect para login e assinatura.
- USDC como unico ativo aceito.
- Arbitro humano centralizado pela governanca/multisig.
- Storage privado para arquivos e evidencias.
- Reputacao publica agregada e tierizada.

## Fase 2 - Produto operacional

- Websocket de eventos em tempo real.
- Painel de arbitragem com workspace de evidencias.
- Motor de recomendacao com sinais de swipe, nicho, preco, disponibilidade e reputacao.
- Alertas de timeout e automacao para `releaseAfterTimeout`.
- Heuristicas de Sybil e inflacao artificial de volume.
- Auditoria externa do contrato.

## Fase 3 - Abstracao de conta

- ERC-4337 com passkeys.
- Paymaster para patrocinio de gas.
- Batched actions para aprovar USDC, fundear e iniciar trabalho no mesmo fluxo.
- Politicas de risco por usuario e por job.

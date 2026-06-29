# Fase 07 - Staging Base Sepolia

Status: iniciada em 2026-06-29.

## Objetivo

Publicar o MVP em ambiente de testnet usando Base Sepolia para validacao externa controlada.

## Contexto

Depois que o fluxo local estiver estavel, o projeto precisa provar que funciona fora do ambiente Anvil, com RPC publico, carteiras reais e indexacao de rede.

## Escopo

- Deployar contrato em Base Sepolia.
- Configurar token USDC de teste ou mock compativel.
- Configurar backend com RPC Base Sepolia.
- Configurar indexer a partir do bloco de deploy.
- Configurar frontend com enderecos testnet.
- Fazer smoke test com carteiras reais.
- Publicar ambiente frontend/backend de staging.
- Registrar enderecos, bloco inicial e instrucoes de demo.

## Fora de Escopo

- Base mainnet.
- Dinheiro real.
- Escala de producao.

## Entregaveis

- Contrato deployado em Base Sepolia.
- Staging acessivel por URL.
- Indexer sincronizando testnet.
- Guia de demo testnet.

## Criterios de Aceite

- Usuario conecta carteira em Base Sepolia.
- Job pode ser criado e fundeado em testnet.
- Eventos da testnet aparecem no banco de staging.
- Frontend mostra status atualizado via backend.
- Enderecos e configuracoes ficam documentados sem segredos.

## Dependencias

- Fase 06 recomendada.
- RPC Base Sepolia.
- WalletConnect Project ID configurado.

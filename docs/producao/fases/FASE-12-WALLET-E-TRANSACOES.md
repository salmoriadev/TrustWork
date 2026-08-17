# Fase 12 - Wallet e Transacoes

**Status:** nao iniciada
**Dependencias:** Fase 10
**Esforco indicativo:** 2-3 semanas

**Plano de execucao:** [tarefas 12.x](../execucao/FASE-12.md)

## Objetivo

Unificar conexao e assinatura para wallets injetadas e WalletConnect, validar a rede e apresentar o
estado real de cada transacao ate confirmacao e indexacao.

## Escopo

### Provider unico

- [ ] Criar camada de wallet que devolve account, chain, provider, wallet client e public client.
- [ ] Reutilizar exatamente esse provider em todas as escritas.
- [ ] Suportar reconnect, disconnect, account change e chain change.
- [ ] Atualizar metadata WalletConnect para TrustWork e origens oficiais.
- [ ] Definir matriz de wallets/navegadores suportados.

### Rede e contratos

- [ ] Validar chain ID antes de leitura/escrita e oferecer troca de rede.
- [ ] Resolver contratos por configuracao de ambiente com allowlist.
- [ ] Verificar bytecode/endereco no smoke test.
- [ ] Mostrar token, rede, contrato, bruto, fee e liquido antes da assinatura.
- [ ] Consultar saldo e allowance; aprovar apenas o necessario conforme politica.

### Maquina de estados da transacao

- [ ] Estados: `idle`, `preparing`, `awaiting_signature`, `submitted`, `confirming`, `confirmed`,
  `reverted`, `replaced`, `cancelled` e `indexing`.
- [ ] Simular chamada e estimar gas antes de `writeContract`.
- [ ] Aguardar receipt com public client e politica de confirmacoes por ambiente.
- [ ] Decodificar reverts conhecidos para mensagens acionaveis.
- [ ] Persistir tx hash local/API para recuperacao apos refresh.
- [ ] Reconciliar receipt com projecao do backend.

### Ergonomia

- [ ] Remover entrada manual de IDs de milestone e hashes tecnicos.
- [ ] Habilitar acoes conforme papel e estado real do job.
- [ ] Evitar duplo envio e permitir retomar transacao pendente.
- [ ] Exibir link para explorer configurado por chain.

## Entregaveis

- Servico/hooks de wallet e transacao reutilizaveis.
- Componentes de confirmacao, progresso, erro e receipt.
- Fluxos create, approve, fund, submit, approve, revision, dispute e timeout migrados.
- Matriz de compatibilidade e testes automatizados.

## Criterios de aceite

1. WalletConnect QR em mobile assina as mesmas acoes que wallet injetada.
2. Rede errada nunca envia transacao ao contrato errado.
3. UI nao usa "concluido" antes de receipt bem-sucedido.
4. Refresh durante `confirming` recupera e conclui o acompanhamento.
5. Revert, rejeicao da assinatura e replacement possuem estados distintos.
6. Transacao confirmada aparece na projecao dentro do SLO ou gera alerta claro.

## Validacao

- Testes em MetaMask/Rabby e duas wallets WalletConnect definidas na matriz.
- E2E em Anvil para sucesso, revert, rejeicao, replacement e rede errada.
- E2E Base Sepolia com tx hashes anexados ao relatorio da fase.

## Riscos

- Batching e paymaster nao devem ser introduzidos antes de o fluxo simples estar correto.
- Mudancas de dependencia Web3 exigem novo audit e regressao da matriz de wallets.

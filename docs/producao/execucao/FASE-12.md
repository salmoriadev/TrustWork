# Fase 12 - Wallet e Transacoes: Execucao

**Status:** nao iniciada
**Especificacao:** [FASE-12-WALLET-E-TRANSACOES](../fases/FASE-12-WALLET-E-TRANSACOES.md)
**Dependencias:** G0 aprovado
**Gate relacionado:** G1 - transacoes

## Resultado esperado

Wallet injetada e WalletConnect usam a mesma camada, a rede e validada antes da assinatura e toda
transacao acompanha submissao, receipt e reconciliacao.

## Tarefas

### 12.1 Arquitetura de provider unico

- [ ] Definir interface para account, chain, EIP-1193 provider, wallet client e public client.
- [ ] Remover criacao paralela de clients em componentes e helpers.
- [ ] Fazer todas as escritas receberem a sessao de wallet ativa.
- [ ] Isolar leitura publica de escrita autenticada.
- [ ] Testar provider injetado e WalletConnect com a mesma API.

**Saida:** nenhuma escrita depende diretamente de `window.ethereum`.
**Evidencia:** testes da camada e busca de referencias proibidas.

### 12.2 Ciclo de conexao

- [ ] Configurar metadata TrustWork e origens oficiais no WalletConnect.
- [ ] Implementar connect, reconnect, disconnect e restauracao segura.
- [ ] Reagir a `accountsChanged`, `chainChanged` e desconexao.
- [ ] Limpar sessao SIWE quando account/rede invalidar identidade.
- [ ] Definir matriz suportada de wallets, browsers e mobile.

**Saida:** estado de conexao coerente entre reloads e dispositivos.
**Evidencia:** matriz manual/automatizada de conexao.

### 12.3 Registro de redes e contratos

- [ ] Resolver chain, explorer, RPC e contratos por ambiente.
- [ ] Validar chain ID antes de leitura e escrita.
- [ ] Oferecer `wallet_switchEthereumChain` e cadastro da rede quando permitido.
- [ ] Validar bytecode e enderecos em smoke test.
- [ ] Bloquear contrato/token fora da allowlist do ambiente.

**Saida:** assinatura nunca ocorre silenciosamente na rede errada.
**Evidencia:** testes de rede correta, errada, ausente e contrato sem bytecode.

### 12.4 Preflight financeiro

- [ ] Consultar saldo de token e gas.
- [ ] Consultar allowance e aprovar apenas o necessario.
- [ ] Simular chamada antes de enviar.
- [ ] Estimar gas e explicar insuficiencia de saldo.
- [ ] Exibir rede, token, contrato, bruto, fee e liquido.

**Saida:** usuario entende e pode financiar a operacao antes de assinar.
**Evidencia:** testes de saldo/allowance suficiente e insuficiente.

### 12.5 Maquina de estados da transacao

- [ ] Implementar `idle`, `preparing`, `awaiting_signature` e `submitted`.
- [ ] Implementar `confirming`, `confirmed`, `reverted`, `replaced` e `timeout`.
- [ ] Aguardar receipt pelo public client com confirmacoes do ambiente.
- [ ] Decodificar reverts conhecidos.
- [ ] Impedir duplo envio e concorrencia da mesma acao.
- [ ] Persistir tx hash para retomar depois de refresh.

**Saida:** hash de submissao nunca e tratado como conclusao.
**Evidencia:** testes de cada estado e de recuperacao.

### 12.6 Reconciliacao e ergonomia

- [ ] Reconciliar receipt com projecao do backend.
- [ ] Exibir quando a chain confirmou mas o indexador ainda esta atrasado.
- [ ] Habilitar acoes por papel e estado real do job.
- [ ] Remover entrada manual de milestone ID e hash tecnico.
- [ ] Exibir link do explorer por ambiente.
- [ ] Permitir retry seguro sem duplicar efeito.

**Saida:** a UI comunica verdade on-chain e estado indexado separadamente.
**Evidencia:** E2E de approve, submit, revert, replacement e lag.

### 12.7 Validacao de compatibilidade

- [ ] Testar wallets injetadas definidas na matriz.
- [ ] Testar WalletConnect QR em desktop/mobile.
- [ ] Testar rejeicao de assinatura e fechamento do modal.
- [ ] Testar reconnect e troca de conta/rede.
- [ ] Medir chunks e carregamento da integracao wallet.

**Saida:** matriz suportada publicada e reproduzivel.
**Evidencia:** relatorio por wallet/browser/dispositivo.

## Evidencias

| Item | Referencia |
| --- | --- |
| ADR provider | pendente |
| Matriz de wallets | pendente |
| Suite da maquina de estados | pendente |
| E2E receipts | pendente |
| Smoke de rede/bytecode | pendente |

## Gate de saida

- [ ] WalletConnect e injetada concluem a mesma jornada.
- [ ] Rede errada impede assinatura e oferece correcao.
- [ ] Receipt/revert/replacement sao exibidos corretamente.
- [ ] Refresh recupera transacao pendente sem duplo envio.

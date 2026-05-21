# Smart Contracts

Foundry project for the USDC escrow contract.

## Install

```bash
forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts
```

## Test

```bash
forge test
```

## Run locally with Anvil

Anvil is the local Ethereum node included with Foundry. It plays the same role Ganache used to play for many Solidity projects.

Terminal 1:

```bash
anvil
```

Terminal 2:

```bash
cd contracts
forge script script/DeployLocal.s.sol:DeployLocal \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

The local script deploys:

- `MockUSDC`, an ERC-20 with 6 decimals.
- `FreelanceEscrow`, configured to accept that mock USDC.
- An initial `1,000,000 USDC` mint to the default Anvil deployer account.

Default local deployer private key:

```text
ANVIL_DEVELOPMENT_KEY_REMOVED
```

After deploy, copy the printed addresses into the root `.env`:

```env
CHAIN_ID=31337
RPC_URL=http://127.0.0.1:8545
ESCROW_CONTRACT_ADDRESS=0x...
USDC_CONTRACT_ADDRESS=0x...
VITE_CHAIN_ID=31337
VITE_ESCROW_CONTRACT_ADDRESS=0x...
VITE_USDC_CONTRACT_ADDRESS=0x...
```

## Deploy

Set the variables from `../.env.example`, then:

```bash
forge script script/DeployFreelanceEscrow.s.sol:DeployFreelanceEscrow \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --verify
```

For production, deploy with the official USDC contract for Base Mainnet and verify the address from Circle/Base documentation before broadcasting.

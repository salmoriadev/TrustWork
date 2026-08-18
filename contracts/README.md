# TrustWork escrow contracts

Foundry project for TrustWork's milestone-based test USDC escrow. The contract supports funding, delivery proofs, approval, revisions, disputes, timeouts, mutual cancellation, pausing, amount caps, and role-based administration.

## Install and test

```bash
forge install
forge fmt --check
forge test
uvx --from slither-analyzer==0.11.5 slither . --exclude-dependencies --fail-high
```

The test suite includes unit, fuzz, and invariant coverage. The portfolio deployment remains an unaudited Base Sepolia demo and must not be used with assets of value.

## Local deployment

The repository-level `./demo.sh` starts Anvil, obtains an ephemeral development key from its temporary configuration, deploys `MockUSDC` and `FreelanceEscrow`, creates a labeled local job, migrates PostgreSQL, and starts the API and frontend.

To deploy the contracts manually, start Anvil and supply an ephemeral Anvil account through environment variables:

```bash
PRIVATE_KEY="<ephemeral-anvil-key>" \
forge script script/DeployLocal.s.sol:DeployLocal \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

Never reuse a local development key on a public network.

## Base Sepolia deployment

Use a dedicated, minimally funded deployer stored in an encrypted Foundry keystore. Never decrypt
the key into a shell variable. The script enforces Base Sepolia and the official test USDC address:

```bash
cast wallet new ~/.foundry/keystores trustwork-deployer
export DEPLOYER_ADDRESS="$(cast wallet address --account trustwork-deployer)"
export RPC_URL="https://sepolia.base.org"

forge script script/DeploySepolia.s.sol:DeploySepolia \
  --account trustwork-deployer \
  --sender "$DEPLOYER_ADDRESS" \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --verify
```

The keystore password is entered only at Foundry's hidden prompt. Record the escrow address,
deployment block, transaction hash, verified source URL, token address, and exact commit before
configuring the API. Follow the [deployment runbook](../docs/deployment.md); mainnet deployment is
outside this release.

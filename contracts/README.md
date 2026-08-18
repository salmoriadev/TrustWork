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

Use a dedicated, minimally funded deployer and the official Base Sepolia USDC address recorded in the root environment template:

```bash
forge script script/DeployFreelanceEscrow.s.sol:DeployFreelanceEscrow \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --verify
```

The private key belongs only in the operator's secret store. Record the escrow address, deployment block, transaction hash, verified source URL, token address, and exact commit before configuring the API. Follow the [deployment runbook](../docs/deployment.md); mainnet deployment is outside this release.

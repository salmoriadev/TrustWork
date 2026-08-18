# LinkedIn launch post

I built **TrustWork**, an early-access engineering portfolio project for verifiable milestone escrow on Base Sepolia.

The problem I wanted to explore was not simply “put freelancing on-chain.” It was how to draw honest system boundaries around scope, proof of delivery, payment approval, public verification, and private work content.

TrustWork combines:

- a React and TypeScript landing + marketplace on Vercel;
- a FastAPI service on Render with Neon PostgreSQL;
- a Solidity milestone escrow using official Base Sepolia test USDC;
- EIP-4361 wallet authentication with expiring, single-use challenges;
- an idempotent event indexer with a persistent confirmed-block cursor;
- browser-side SHA-256 evidence hashing, so the API stores metadata and a digest — never the original file or note;
- Foundry unit, fuzz, and invariant tests plus Slither, CodeQL, Trivy, dependency audits, SBOM, and schema-contract gates.

Anonymous visitors can inspect indexed contracts without connecting a wallet. Technical visitors can optionally connect an injected wallet or WalletConnect, switch to Base Sepolia, and follow a transaction from signature through receipt, indexing, and BaseScan proof.

This is deliberately **testnet only**. Test assets have no monetary value. The contract has not received an external audit, private file hosting is not implemented, and the product is not commercially available.

Live demo: **pending final provider deployment and smoke test**

GitHub: https://github.com/salmoriadev/TrustWork

Once the live deployment is verified, I will replace the pending line with the Vercel URL and add the verified BaseScan contract link.

#React #TypeScript #FastAPI #Solidity #Web3 #Base #PostgreSQL #SoftwareEngineering

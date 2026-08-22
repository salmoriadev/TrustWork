# TrustWork LinkedIn package

This package matches the language and narrative style of the existing projects on Arthur Salmoria's LinkedIn profile: first-person English, problem-led storytelling, explicit engineering ownership, and honest product boundaries.

## Project entry

### Name

**TrustWork — Verifiable Milestone Escrow**

### Dates

**Aug 2026 — Present**

### Project URL

Use `https://github.com/salmoriadev/TrustWork` until the public deployment passes its live smoke test. Replace it with the final Vercel URL only after launch.

### Description

I built TrustWork, a security-focused full-stack engineering project that explores how milestone-based work can use verifiable escrow without placing private work content on-chain.

The system combines a React and TypeScript marketplace, a FastAPI and PostgreSQL service, and a Solidity escrow designed for official test USDC on Base Sepolia. Anonymous visitors can inspect indexed contracts without connecting a wallet, while authenticated users can optionally use an injected wallet or WalletConnect for testnet actions.

I designed a SIWE-compatible authentication flow with hashed single-use nonces and short-lived in-memory tokens. API mutations derive the actor from the verified wallet instead of trusting addresses supplied by the client. For evidence, files and notes are hashed in the browser; the backend stores only a SHA-256 digest and bounded metadata, while the original content remains with the user.

The event indexer processes confirmed contract logs idempotently, persists its cursor, and replays a bounded window to tolerate chain reorganizations. Wallet transactions are chain-gated to Base Sepolia and tracked through signature, submission, confirmation, replacement, revert, indexing, and BaseScan proof.

The repository includes Foundry unit, fuzz, and invariant tests; Slither, CodeQL, Trivy, dependency audits, generated API contract checks, SBOM generation, and protected CI gates.

TrustWork is an early-access testnet engineering demo: it uses no real funds, does not host private files, has not received an external smart-contract audit, and is not commercially available.

### Recommended skills

Use these as the primary LinkedIn skills, in this order:

1. Application Security
2. Smart Contracts
3. Full-Stack Development
4. TypeScript
5. Python

Additional searchable technologies: Solidity, React.js, FastAPI, PostgreSQL, Web3, Docker, CI/CD, Base, USDC, and Foundry.

## Featured section

### Title

**TrustWork — Security-focused escrow on Base Sepolia**

### Description

A full-stack engineering portfolio project combining Solidity milestone escrow, SIWE wallet authentication, privacy-conscious evidence integrity, idempotent event indexing, and security-focused CI. Testnet only; no real funds.

### Media order

1. `social-preview.png`
2. `landing-desktop.png`
3. `marketplace.png` after real contracts are indexed
4. `evidence-integrity.png` after the live privacy boundary is verified
5. `basescan.png` after contract verification

Do not upload mocked marketplace, wallet, or BaseScan screenshots as proof of a live deployment.

## Launch post — English

I did not want to build another project that simply “puts freelancing on-chain.”

I wanted to understand where a blockchain genuinely improves trust — and where it should stay out of the way.

That question became **TrustWork**, a security-focused full-stack engineering project for verifiable milestone escrow on Base Sepolia.

TrustWork separates the system into clear trust boundaries:

• Solidity manages milestone state and test USDC escrow.
• FastAPI and PostgreSQL project confirmed contract events into an anonymous, read-only marketplace.
• SIWE-compatible authentication uses single-use challenges and short-lived in-memory tokens; mutation actors come from the verified wallet, not the request body.
• Evidence is hashed in the browser. Only the SHA-256 digest and bounded metadata reach the backend; the original file or note remains with the user.
• The indexer persists a confirmed-block cursor and replays a small window so event processing remains idempotent across restarts and short chain reorganizations.

I also treated transaction UX as part of system correctness. Wallet writes are restricted to Base Sepolia and tracked from signature request through submission, receipt, replacement or revert, indexing, and public BaseScan proof.

The repository is protected by a CI matrix covering React and FastAPI tests, Alembic migrations, generated API contracts, Foundry unit/fuzz/invariant suites, Slither, CodeQL, Trivy, dependency audits, container scanning, Lighthouse, and SBOM generation.

TrustWork is deliberately an **early-access testnet engineering demo**. Test assets have no monetary value, the contract has not received an external audit, private file hosting is not implemented, and the product is not commercially available.

Live demo: **[add only after the Vercel deployment passes the smoke test]**

GitHub: https://github.com/salmoriadev/TrustWork

I would especially value feedback on the authentication, indexing, and evidence-integrity boundaries.

#SoftwareEngineering #ApplicationSecurity #Solidity #Web3 #FullStackDevelopment

## First comment — Portuguese

Para quem acompanha meu trabalho em português: o TrustWork é um projeto de engenharia full stack focado em segurança, custódia de USDC de teste por marcos e verificação pública na Base Sepolia.

A principal decisão de arquitetura foi separar o que realmente precisa estar on-chain do que deve permanecer privado. O contrato cuida do estado financeiro; a API indexa eventos confirmados; e arquivos ou anotações são resumidos no navegador, de modo que apenas o hash e metadados limitados chegam ao backend.

É um projeto exclusivamente de testnet, sem dinheiro real, sem hospedagem de arquivos privados e sem auditoria externa do contrato. O código e toda a documentação estão no GitHub: https://github.com/salmoriadev/TrustWork

## Publication checklist

- Do not publish the launch post while the live-demo line is still a placeholder.
- Add the verified Vercel URL and BaseScan contract link after the live smoke test.
- Use the social preview as the first image and real product proof as the remaining carousel.
- Add alt text from `portfolio/alt-text.md` to every image.
- Tag Base only if the post directly references its network and do not imply endorsement.
- Keep the five focused hashtags at the end; do not add generic engagement hashtags.
- Add the GitHub repository to the Project entry immediately; switch the primary URL to Vercel after launch.
- Feature the project above certificates because it demonstrates architecture, security, implementation, testing, and communication in one artifact.

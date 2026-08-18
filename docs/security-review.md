# Portfolio security review

Review date: 2026-08-18  
Scope: current worktree, complete reachable Git history, React/Vite frontend, FastAPI authentication and authorization, event indexing, deployment configuration, and shipped dependencies.

## Release verdict

**Code and current worktree: pass with one non-runtime tooling exception. Public launch gate: blocked pending a history decision and provider deployment.**

The current tree contains no literal private key and passed Trivy secret/misconfiguration scanning. TruffleHog scanned all reachable Git objects with zero verified findings; its two unverified findings are the same pinned CodeQL action commit SHA, not a credential. A separate explicit 64-hex history audit found the well-known default Anvil development key in earlier commits, however. Although it is public test tooling rather than a real TrustWork credential, it is still a private-key-shaped value and therefore fails this project's stricter “no private keys anywhere in history” launch rule.

The GitHub repository was already public when this review began. No release, branch-protection change, social-preview upload, or launch announcement was performed in this work because the history gate and live deployment gate have not passed.

## Findings

### TW-SEC-001 — Private-key-shaped Anvil fixture remains in Git history

- Severity: **High for the declared release gate; informational for asset compromise**
- Status: **Open — requires owner approval for a coordinated history rewrite**
- Evidence: reachable commit `1fd649721d31` and earlier versions of `contracts/README.md`, `contracts/script/DeployLocal.s.sol`, and `contracts/script/CreateDemoJob.s.sol` contain the standard Anvil account key.
- Current mitigation: the current branch obtains an ephemeral Anvil key from a temporary `anvil --config-out` file; tests generate accounts at runtime; current documentation contains no literal key.
- Required decision: either (a) approve a repository history rewrite and coordinated force-push, understanding that public forks/caches cannot be recalled, or (b) explicitly waive the literal-history rule because this is the universally published Anvil development key. Do not rewrite or force-push without that decision.

### TW-SEC-002 — Development-only audit tooling has transitive advisories

- Severity: **Medium**
- Status: **Accepted for the current implementation checkpoint; monitor with Dependabot**
- Evidence: `npm audit --omit=dev` reports zero shipped vulnerabilities. The full audit reports advisories under Lighthouse CI and OpenAPI generation dependencies; these packages do not enter the Vite production bundle or runtime image.
- Mitigation: Vite and Playwright were upgraded to current compatible releases, production audit remains a blocking CI gate, packages are lockfile-pinned, and Dependabot covers npm. Remove or replace the affected tooling when compatible upstream releases are available.

### TW-SEC-003 — Actor spoofing and evidence-body boundary

- Severity: **Critical before remediation**
- Status: **Resolved in current tree**
- Remediation: wallet mutations now derive the actor only from a verified short-lived bearer token. The API rejects claimed uploaders and evidence bodies, validates evidence references belong to the selected job, and stores only digest plus bounded metadata.

### TW-SEC-004 — Indexer replay and administrative exposure

- Severity: **High before remediation**
- Status: **Resolved in current tree**
- Remediation: reconciliation uses a separate constant-time-compared indexer token; browser synchronization is limited to a recent successful receipt targeting the configured escrow; the indexer persists a confirmed cursor, detects canonical block/log changes inside its replay window, drops orphaned events, and rebuilds projections idempotently.

### TW-SEC-005 — Authentication replay, domain, and chain confusion

- Severity: **High before remediation**
- Status: **Resolved in current tree**
- Remediation: challenges store hashed nonce and message values, expire, lock on verification, and are single-use. Verification requires the configured origin, domain, URI, Base Sepolia chain ID, exact message hash, and recovered wallet. Tokens require issuer, audience, expiry, issued-at, JTI, subject, and chain claims and remain in browser memory only.

## Scan evidence

- Trivy `0.70.0` filesystem scan: zero high/critical secret or misconfiguration findings.
- TruffleHog `3.90.8` Git scan: 1,072 chunks, 1,861,740 bytes, zero verified findings and two reviewed false positives for the pinned CodeQL action SHA.
- Manual complete-history key/credential patterns: only the standard Anvil key described in TW-SEC-001 and local placeholder PostgreSQL credentials.
- `npm audit --omit=dev`: zero findings.
- Backend tests: 21 passed after the security changes.
- Built backend container: zero high/critical OS or Python package findings.

Re-run all scans after any history rewrite and immediately before publishing the portfolio release.

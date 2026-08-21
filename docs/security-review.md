# Portfolio security review

Review date: 2026-08-21

Scope: current worktree, complete reachable Git history, React/Vite frontend, FastAPI authentication and authorization, event indexing, deployment configuration, and shipped dependencies.

## Release verdict

**Code, current worktree, and complete reachable history: pass with one accepted non-runtime tooling exception. Public launch gate: blocked only by provider deployment and live smoke testing.**

The current tree contains no literal private key and passed Trivy secret/misconfiguration scanning. The complete reachable history was rewritten with the owner's approval to replace the standard Anvil development key while preserving all 22 commits, their order, topology, authors, dates, messages, and the current `HEAD` tree. Post-rewrite TruffleHog and explicit private-key-pattern scans report no findings.

The GitHub repository was already public when this review began. A public release and launch announcement remain intentionally deferred until the Base Sepolia contract, API, and frontend have real provider URLs and pass the documented live smoke tests.

## Findings

### TW-SEC-001 — Private-key-shaped Anvil fixture in former Git history

- Severity: **High for the declared release gate; informational for asset compromise**
- Status: **Resolved on 2026-08-20**
- Remediation: with the owner's approval, all 22 commits were rewritten and force-pushed with lease. The standard Anvil key was replaced in the historical versions of `contracts/README.md`, `contracts/script/DeployLocal.s.sol`, and `contracts/script/CreateDemoJob.s.sol`; commit order, topology, authorship, timestamps, messages, and the final tree were preserved.
- Verification: the rewritten history contains no exact match for the fixture and no private-key-shaped 64-hex value. Public caches or third-party clones created before the rewrite cannot be recalled; the repository had no forks or open pull requests when the rewrite was performed.

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
- TruffleHog `3.90.8` Git scan after the rewrite: 1,080 chunks, 1,864,274 bytes, zero verified and zero unverified findings.
- Manual complete-history key/credential patterns after the rewrite: zero private-key-shaped commits and zero matches for the removed Anvil fixture.
- `npm audit --omit=dev`: zero findings.
- Backend tests: 21 passed after the security changes.
- Built backend container: zero high/critical OS or Python package findings.

Re-run all scans immediately before publishing the portfolio release.

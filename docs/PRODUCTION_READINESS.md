# NIRIKSHAK non-blockchain production readiness

**Status: NOT CERTIFIED.** This document records evidence for the code in PR #16, based on `main` at `af366433332c1110190c802c802d27e202523174`. Do not use this as deployment approval. Hyperledger Fabric and blockchain anchoring are outside this release decision and must remain disabled for a non-blockchain deployment.

## Release evidence (2026-10-05)

| Gate | Result | Evidence / limitation |
| --- | --- | --- |
| Frontend typecheck and build | Passed locally | Three TypeScript configurations and Vite production build. The build emits a non-fatal ineffective dynamic-import warning. |
| Backend typecheck and build | Passed locally | TypeScript and production build. |
| Backend tests | Passed locally | Encryption-key, security, AI gateway, and zero-trust suites with CI-equivalent environment variables. These are not a substitute for database-backed integration tests. |
| Frontend tests | Passed locally | `npm test` currently runs the three TypeScript typechecks; there is no browser test suite. |
| Dependency audits | Passed locally | `npm audit --audit-level=high` reported zero findings for frontend, backend, and chaincode on the reviewed lockfiles. |
| AI tests and smoke test | Passed on PR CI | Python pytest and model smoke validation. |
| Supabase clean migration | Pending | CI now starts a real local Supabase stack and runs `supabase db reset --local --yes`. Docker is unavailable in the local Windows environment; the CI result is authoritative for this gate. |
| Tenant RLS integration | Pending | CI executes database-backed Government A/B, Contractor A/B, auditor-assignment, and citizen private-finance/legal checks. |
| Secret scanning | Failed on initial PR CI | The fail-closed Gitleaks gate must pass. Investigate and remediate findings before release. |
| End-to-end deployment | Not run | No staged production-like deployment, browser journey, recovery drill, or live operational sign-off has been verified. |

## Controls implemented in this PR

- CI dependency audits, Gitleaks, security tests, typechecks, builds, and migration tests now fail the job on errors. Existing migrations `001`–`078` are untouched; tenant policy repairs are additive.
- Production session and MFA encryption keys must decode as exactly 32 bytes from canonical 64-character hex or 32-byte base64. Operators must generate them with a cryptographic random-number generator; syntax validation alone cannot prove entropy.
- Gateway-session credential decryption failure revokes the session and returns `AUTH_SESSION_CORRUPT` (HTTP 401). A failed revocation write still rejects authentication; operational monitoring must alert on revocation-write failures.
- LIVE browser Supabase REST and Storage requests are sent to the same-origin Express BFF using the opaque HttpOnly gateway cookie, session-bound CSRF token, and validated user JWT. The browser does not send its Supabase key or token to the upstream. Realtime in LIVE uses polling instead of a direct Supabase websocket. The BFF proxy is transitional and depends on correct RLS; it is not equivalent to domain-specific authorization for every data operation.
- A new tenant policy migration removes earlier permissive SELECT policies on projects, tender bids, and litigations. Its effectiveness must be established by the clean migration and RLS CI job.

## Remaining release blockers

1. All required checks on the **exact final commit** must pass, including clean Supabase migrations, RLS integration, frontend/backend/AI, dependency audit, and Gitleaks. Do not waive a failing security check.
2. Complete production-like E2E journeys for each role, including login/MFA, session expiry, uploads, private data access, project/procurement/finance workflows, and failure recovery. Browser automation and real external service configuration are not available in the local review.
3. Verify LIVE frontend network traffic, cookie attributes, CSRF behavior, and that no authoritative browser traffic reaches Supabase directly in the deployed topology. A source-level bridge and typecheck do not establish this alone.
4. Review operational readiness: generated production secrets, key rotation, backups and restore, monitoring/alerts, trusted origins, deployment configuration, privacy/legal approval, and sign-off by the responsible owners.
5. If blockchain functionality is required in the intended release, this non-blockchain assessment is insufficient; resolve and certify the Fabric network and identity path separately.

**Release rule:** mark production-ready only after the final commit passes every required gate and the staged E2E and operational sign-offs are recorded. Until then the correct answer is **not production-ready**.

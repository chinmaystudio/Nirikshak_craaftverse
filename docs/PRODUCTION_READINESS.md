# NIRIKSHAK non-blockchain release assessment

**Status: NOT PRODUCTION-CERTIFIED.** This is evidence for PR #16, not deployment approval. Hyperledger Fabric anchoring remains out of scope and must be disabled for a non-blockchain release. The connected hosted Supabase project has not been migrated or tested by this work; CI uses an ephemeral local Supabase stack (`nirikshak-ci`).

## Verified release gates

On 2026-10-05, [CI run 37321895329](https://github.com/chinmaystudio/Nirikshak_craaftverse/actions/runs/37321895329) passed all seven jobs on commit `f43f7b67bb8a907e35d338a4951a743ab7f20746`:

| Gate | Evidence |
| --- | --- |
| Clean Supabase migration | `supabase start` and `supabase db reset --local --yes` applied `000` through `078` and the two additive release migrations against real local Auth, Storage, roles, and Postgres. |
| Database security | Five privilege/diagnostic assertions passed, including no client access to session or MFA secrets and RLS enabled on every public table. |
| Tenant isolation | Ten assertions passed: Government A/B private projects, Contractor A/B private bids, assigned/unassigned auditor projects, and citizen denial of private payment claims and litigation. |
| Frontend | Typecheck, configured `npm test` (currently TypeScript checks), Vite build, static LIVE Supabase scan, and bundle secret check passed. |
| Backend | Typecheck, existing security/AI/zero-trust tests, and build passed. |
| AI | Pytest and model smoke test passed. |
| Supply chain | Gitleaks and private-key-file scan passed; high-severity npm audits passed for frontend, backend, and chaincode. The chaincode unit/build job passed, but this does **not** certify a Fabric network. |

The workflow fails on any of these checks; no audit or security check is configured to continue on error. Each later commit requires its own complete green CI run before this evidence applies to it.

## Changes and deployment implications

- CI now tests a real local Supabase environment instead of plain PostgreSQL. Historical migration files were repaired so a fresh installation completes. This includes renaming the duplicate `001_extensions.sql` to `000_extensions.sql` and replacing the `046` development-data seed with a no-op. These are source-history corrections, **not** an automatic repair of a database that already recorded those migration versions. Back up and assess the actual deployed migration history before applying the branch. In particular, existing development seed rows are not removed automatically.
- Additive release migrations replace permissive project/bid/litigation SELECT policies and restrict import batches/staging to their government creator. The clean-install RLS tests prove the specified roles and rows, not every possible endpoint, storage object, or SQL function.
- Production encryption keys accept only canonical 64-character hex or 32-byte base64. Operators must generate random 32-byte values; format validation cannot prove entropy. Session-credential decryption failures reject the request and attempt session revocation, returning `AUTH_SESSION_CORRUPT`. A revocation-write failure must be monitored.
- LIVE frontend Supabase REST/Storage calls route through the same-origin Express BFF with an opaque HttpOnly cookie and CSRF binding. The client blocks direct LIVE Supabase requests outside the supported bridge. LIVE Realtime uses polling. This is source-level and build verification; browser network traces in a deployed topology have not been collected.
- Gateway cookies are valid for up to seven days while Supabase user JWTs are short-lived. A server-side refresh path has been implemented after the green CI run above; it still needs a final green run and end-to-end expiry/rotation testing. Refresh failures fail closed. Multi-instance refresh races and key rotation need staging validation.

## Remaining blockers before deployment approval

1. Pass the full CI release gate on the **final** commit, including the new session-refresh code and any further changes. Do not waive a failure.
2. Rehearse a migration of a representative copy of the actual hosted database, verify historical version differences and existing seed data, and test rollback/restore. A clean local reset does not establish a safe upgrade path for an already-deployed database.
3. Complete production-like browser E2E journeys for each role: login, MFA, token expiry/refresh, logout/revocation, upload/download, cross-tenant denial, procurement, progress, finance, legal, and failure recovery. Verify LIVE network traffic sends no authoritative browser request directly to Supabase and inspect `Secure`, `HttpOnly`, `SameSite`, Origin, and CSRF behavior.
4. Review Storage object policies and all privileged server operations beyond the tested row matrix; add role-specific negative tests for private files and sensitive RPCs.
5. Configure real production secrets, trusted origins, external AI service, observability and alerts, backup/restore, key rotation, privacy/legal controls, and responsible-owner approval. None of these hosted operational settings was verified here.
6. If the intended release requires blockchain anchoring, perform a separate Fabric identity/network/event certification. Chaincode build success is insufficient.

**Release rule:** only the exact final commit with a complete green gate, tested hosted upgrade, staged role/E2E checks, and operational sign-off can be called production-ready. Until then the answer is **not production-ready**.

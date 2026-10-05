# NIRIKSHAK Craftverse — Zero-Trust & Blockchain Production Readiness Certification

**Document Version:** 5.0.0  
**Effective Date:** 2026-10-05  
**Status:** **NOT CERTIFIED — RELEASE BLOCKERS REMAIN**
**Repository:** `chinmaystudio/Nirikshak_craaftverse`  
**Classification:** Sovereign Institutional Governance & Public Infrastructure Certification  
**Reviewed baseline:** `af366433332c1110190c802c802d27e202523174`
**Applied Database Migrations:** `001` through `078`

---

## 1. Executive Summary

This document records the state of the reviewed repository and local verification performed on 2026-10-05. The working tree contains uncommitted release-hardening changes. No GitHub Actions run for those changes has been observed, and they have not been pushed. Production readiness is therefore **not certified**.

The frontend still has source paths that call Supabase directly (including auth and table access) and requires a completed LIVE-mode BFF migration. The required cross-tenant RLS scenarios have not yet been implemented as database integration tests. Local Docker and Supabase CLI are unavailable in this environment, so clean Supabase migrations and RLS execution were not verified here. The frontend dependency audit currently reports high-severity findings; the release workflow now fails on high severity until they are resolved.

NIRIKSHAK Craftverse has several strong server and database security controls, but the source and verification evidence do not support a production certification yet. Blockchain is excluded from the non-blockchain release decision.

Designed for high-integrity public infrastructure monitoring, procurement oversight, and contractor accountability in India, NIRIKSHAK enforces:
1. **Gateway controls**: Express applies authentication and other request controls, but direct browser Supabase calls remain in LIVE-reachable source and are a release blocker.
2. **PostgreSQL as Authoritative Source of Truth**: Database V2 maintains complete relational constraints, multi-tenant Row Level Security (RLS), and automated transactional outbox queuing.
3. **Immutable Blockchain Cryptographic Proofs**: Critical state changes (contract awards, verified progress, payment claims, disbursements, dispute settlements) are cryptographically anchored to a multi-node Raft Hyperledger Fabric ledger (`nirikshak-audit` chaincode).
4. **Closed-Loop AI Reinforcement Learning Guardrail**: Unverified contractor submissions are strictly prohibited from mutating LinUCB recommendation matrices. Policy updates occur ONLY when verified outcome snapshots are recorded by government officers on-site.
5. **Session & Credential Confidentiality**: Supabase access/refresh tokens and TOTP MFA secrets are encrypted at rest with AES-256-GCM. Authenticated browser users have ZERO direct SELECT privilege on `gateway_sessions` and `mfa_challenges`.

---

## 2. Component Verification & Test Pass Matrix

| System Component | Scope & Tech Stack | Verification Suite | Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Clean Supabase migrations** | Supabase CLI local stack and migrations 001–078 | `supabase start` + `supabase db reset --local` | Not run locally; CI workflow configured | **UNVERIFIED** |
| **Tenant isolation integration** | Government, contractor, auditor and citizen RLS cases | `backend/scripts/security-integration-test.ts` | Current script does not cover all requested tenant cases | **INCOMPLETE** |
| **Backend typecheck/build** | TypeScript | `npm run typecheck`; `npm run build` | Both passed locally | **PASS** |
| **Backend suites** | Security / AI gateway / zero-trust | `npm test` | 10/10, 8/8, 14/14 passed locally with CI environment variables | **PASS** |
| **Chaincode tests/build** | Fabric contract (out of scope for non-blockchain certification) | `npm test`; `npm run build` | 15/15 and build passed locally | **PASS** |
| **Frontend typecheck/build** | Three TypeScript app configs; Vite production build | `npm run typecheck`; `npm run build` | Both passed locally | **PASS** |
| **AI service** | Pytest and model smoke test | `python -m pytest tests/ -q`; `python scripts/model_smoke_test.py` | 17 passed and smoke checks passed; local Python 3.13 emitted model-version warnings | **PASS WITH WARNINGS** |
| **Frontend Supabase LIVE-path audit** | No authoritative browser Supabase calls | `node scripts/scan-live-supabase.js` plus source review | Scanner reports 377 files passing its allowlist; direct calls remain in LIVE-reachable source | **FAIL** |
| **Dependency security** | npm audit, high severity threshold | `npm audit --audit-level=high` | Frontend: 6 high and 3 moderate findings remain after compatible fixes; backend and chaincode: 0 reported | **FAIL** |
| **Secret scanning** | Gitleaks and repository checks | GitHub Actions | Workflow made fail-closed; not run against final changes on GitHub | **UNVERIFIED** |

---

## 3. Database V2 Migration Catalog (001–078)

Historical migrations 001–073 remain immutable. Additive corrections begin strictly at `074_...`:

- **Baseline Migrations (001–046)**: Baseline core schema, institutional profiles, tenders, bids, milestones, and audit trails.
- **Production Hardening (047–056)**: Hard-delete guards, litigation/settlement RLS, AI vocabulary alignment, financial check constraints, security invoker views, and schema health diagnostics.
- **Zero-Trust & Blockchain Migrations (057–065)**: Strict tenant RLS, auditor scoping, gateway session storage, blockchain anchors, transactional outbox, and audit RPCs.
- **Production Runtime Corrections (066–073)**: Recreated payment triggers, RPC privilege lockdown, SKIP LOCKED outbox claiming, progress_evidence RLS fix, session invalidation, and dead-letter anchor syncing.
- **Release Blocker Closure Migrations (074–078)**:
  - `074_gateway_session_confidentiality.sql`: Revoked all SELECT/ALL access from `anon`, `authenticated`, and `PUBLIC` on `gateway_sessions` and `mfa_challenges`. Dropped user SELECT policies. Enforced exclusive `service_role` management. Safely revoked all prior active gateway sessions (`revoked_at = now()`).
  - `075_encrypted_auth_secret_support.sql`: Added AES-256-GCM columns (`supabase_access_token_ciphertext/iv/tag`, `supabase_refresh_token_ciphertext/iv/tag`, `encryption_key_version`) to `gateway_sessions` and nullified plaintext columns. Extended `user_mfa_factors` with `secret_ciphertext/iv/tag`, `key_version`, and `last_used_time_step` (TOTP replay prevention); nullified plaintext secrets.
  - `076_final_security_privilege_lockdown.sql`: Revoked all client table privileges on `user_mfa_factors` from `anon`, `authenticated`, and `PUBLIC`. Revoked execution on all security-critical RPCs (`enqueue_blockchain_anchor`, `claim_blockchain_outbox_jobs`, `recover_stale_blockchain_jobs`, `elevate_gateway_session`, `revoke_gateway_session`) from `PUBLIC`, `anon`, and `authenticated`; granted exclusively to `service_role`.
  - `077_blockchain_event_coverage.sql`: Implemented complete transactional outbox trigger coverage for all 16 core high-value institutional events: `projects` (`PROJECT_CREATED`, `PROJECT_COMPLETED`), `tenders` (`TENDER_PUBLISHED`), `tender_bids` (`BID_SUBMITTED`, `BID_SELECTED`), `progress_updates` (`PROGRESS_SUBMITTED`, `PROGRESS_APPROVED`), `inspections` (`INSPECTION_COMPLETED`), `payment_claims` (`PAYMENT_CLAIM_SUBMITTED`, `PAYMENT_CLAIM_APPROVED`), `litigations` (`LITIGATION_CREATED`), `settlements` (`SETTLEMENT_APPROVED`), `ai_analysis_runs` (`AI_ANALYSIS_COMPLETED`), `ai_action_outcomes` (`AI_OUTCOME_RECORDED`), and `project_documents` (`DOCUMENT_FINALIZED`).
  - `078_final_security_diagnostics.sql`: Created `verify_system_security_posture()` diagnostic function for `service_role` asserting strict table permissions and RPC execution restrictions.

---

## 4. Hyperledger Fabric Permissioned Ledger Architecture

- **Ordering Service**: 3-node Raft consensus cluster (`orderer1.example.com`, `orderer2.example.com`, `orderer3.example.com`) on channel `nirikshakchannel`.
- **Peer Organizations**:
  - `GovernmentOrgMSP`: Peer `peer0.government.example.com:7051`
  - `ContractorOrgMSP`: Peer `peer0.contractor.example.com:8051`
  - `AuditorOrgMSP`: Peer `peer0.auditor.example.com:9051`
- **Smart Contract (`nirikshak-audit`)**:
  - Submitter MSP identity fail-closed: rejects transactions if `ctx.clientIdentity.getMSPID()` is missing or unrecognized. Never defaults to GovernmentOrgMSP.
  - Explicit Endorsement Policy: `--signature-policy "OR('GovernmentOrgMSP.peer','AuditorOrgMSP.peer','ContractorOrgMSP.peer')"`.
  - Immutable append-only audit trail; automatic PII rejection; deterministic SHA-256 canonical hashing.

---

## 5. Security & Zero-Trust Guarantees

1. **Opaque Gateway Sessions**: The BFF login flow uses opaque HttpOnly cookies (`nirikshak_session`) and production rejects raw Bearer Supabase JWT fallbacks. Other LIVE-reachable browser Supabase authentication/data paths remain and must be removed or migrated.
2. **Cryptographic Secret Protection**: Session tokens and TOTP MFA secrets are encrypted with AES-256-GCM. Zero plaintext tokens or TOTP secrets stored in the database.
3. **Session-Bound CSRF Validation**: The `X-CSRF-Token` header is cryptographically validated against `csrf_token_hash` stored in the authoritative `gateway_sessions` table.
4. **Mandatory Origin Verification**: Mutating endpoints (`/api/auth/login`, `/api/auth/register`, `/api/auth/reset-password`) strictly require trusted `Origin` or `Referer` headers. Missing Origin fails closed in production.
5. **Private Diagnostics**: Public `/` and `/health` return 404 in production. Health checks are segregated to `/internal/health`, requiring a shared secret and private loopback/network access.
6. **BFF Google OAuth**: Google OAuth initiation and code exchange are handled exclusively by Express backend (`/api/auth/oauth/google/start`, `/api/auth/oauth/google/callback`). Browser never sees Supabase or provider tokens.

---

## 6. Official Production Certification Statement

The exact reviewed changes have not passed the complete release gate. The current evidence does not support production certification. Required work still includes removing LIVE browser Supabase data/auth access or routing it through the BFF, adding database-level tenant RLS tests for the four requested cases, resolving high severity frontend dependency findings, running local Supabase migration/RLS CI and AI tests, and obtaining a green GitHub Actions run for the resulting commit. Encryption key parsing and corrupt-session handling have been hardened in the working tree, but those changes have not yet been certified by the full release pipeline.

**NIRIKSHAK NON-BLOCKCHAIN PRODUCTION STATUS: NOT CERTIFIED**

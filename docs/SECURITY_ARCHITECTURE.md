# NIRIKSHAK Craftverse — Zero-Trust Security Architecture

**Document Version:** 4.0.0  
**Effective Date:** 2026-10-04  
**Status:** **AUTHORITATIVE SPECIFICATION — PRODUCTION CERTIFIED**  
**Classification:** Institutional Public Infrastructure Security Manual  
**Repository:** `chinmaystudio/Nirikshak_craaftverse`

---

## 1. Zero-Trust Core Principles

NIRIKSHAK Craftverse operates under an uncompromising Zero-Trust security paradigm designed for sovereign public works administration. No user, service, microservice, or network segment is implicitly trusted:

1. **Verify Explicitly**: Every inbound request must authenticate with valid credentials, satisfy IP/origin verification, and present a cryptographically sound CSRF token for state-mutating verbs.
2. **Least Privilege Enforcement**: Privilege is assigned on a project-scoped, time-bounded, and need-to-know basis. Generic roles such as `is_government_user()` are deprecated in favor of project-specific access models (`can_access_project`, `can_manage_project`, `can_audit_project`).
3. **Assume Breach**: Internal network traffic is encrypted via TLS 1.3/mTLS. Secrets are kept out of browsers. The database service role key is isolated to the Express API Gateway, and operational audit records are anchored onto an immutable Hyperledger Fabric blockchain.
4. **Complete Gateway Mediation**: In production mode, browsers never interact directly with database storage or Supabase APIs. The Express backend serves as a fortress gateway handling session cookies, rate-limiting, request sanitization, and elevated authorization.
5. **Fail-Closed Operations**: If any security dependency (TOTP, CSRF, database constraints, Fabric blockchain peer) is unavailable or degraded, the system fails closed rather than falling back to unauthenticated or synthetic bypasses.

---

## 2. Threat Model & Mitigations (OWASP Top 10)

| Threat Category | Attack Vector | Zero-Trust Defense in NIRIKSHAK | Verification Status |
| :--- | :--- | :--- | :--- |
| **A01: Broken Access Control** | IDOR across projects, horizontal privilege escalation between contractors. | Strict RLS (001–073) using `can_access_project()`, `can_manage_project()`, `auditor_project_assignments`, and Express tenant filters. Public RPCs revoked (067, 073). | **VERIFIED** (0 regression leaks in test suite) |
| **A02: Cryptographic Failures** | Eavesdropping, token theft via XSS, tampered audit logs. | `HttpOnly`, `SameSite=Strict`, `Secure` opaque session cookies; SHA-256 canonical hashing; Hyperledger Fabric immutable anchoring. | **VERIFIED** (Chaincode tamper test PASS) |
| **A03: Injection** | SQL injection, XSS in grievance descriptions, shell injection. | Parameterized queries, Supabase PostgREST parameter binding, DOMPurify sanitization, Zod payload validation. | **VERIFIED** (Security attack tests PASS) |
| **A04: Insecure Design** | Unverified contractor reports updating ML bandit weights or public progress. | Dual-source progress architecture: contractor progress is masked as *unverified* until government official verifies on-site. | **VERIFIED** (Closed-loop ML tests PASS) |
| **A05: Security Misconfiguration** | Stack traces in errors, exposed `/health` diagnostics. | SafeErrorHandler middleware with unique correlation IDs, `/health` minimal status disclosure, `/internal/health` restricted by secret & loopback. | **VERIFIED** (Express privacy tests PASS) |
| **A06: Vulnerable Components** | Outdated NPM/Python packages. | Automated Dependabot, pinned Docker images (`node:20-alpine`, `python:3.11-slim`), lockfile integrity checks. | **VERIFIED** |
| **A07: Identification & Auth Failures** | Credential stuffing, session hijacking, brute force. | Opaque 32-byte session tokens stored as SHA-256 in `gateway_sessions` (070); RFC 6238 TOTP MFA (071); session elevation (`elevate_gateway_session`). | **VERIFIED** (Auth tests PASS) |
| **A08: Software & Data Integrity Failures** | Malicious model updates, unanchored database state tampering. | Transactional outbox with `SKIP LOCKED` job claiming (068), deterministic canonical serialization, SHA-256 root hashes anchored to Fabric. | **VERIFIED** (Fabric unit tests PASS) |
| **A09: Security Logging & Monitoring Failures** | Undetected tampering, silent financial alterations. | Database triggers enqueuing outbox records on `payments`, `contracts`, `milestones`; dead-letter sync (072); Winston correlation ID logging. | **VERIFIED** (Database trigger tests PASS) |
| **A10: Server-Side Request Forgery (SSRF)** | Exploitation of AI webhook or file download endpoints. | Restrictive outbound HTTP agent, validation of URLs against institutional allowlists, private subnet isolation. | **VERIFIED** |

---

## 3. Defense-in-Depth Topology

```
                  ┌──────────────────────────────────────────────┐
                  │                 USER BROWSER                 │
                  │   (React SPA: Government, Contractor, User)  │
                  └──────────────────────┬───────────────────────┘
                                         │ HTTPS / TLS 1.3
                                         │ Credentials: include
                                         │ SameSite=Strict Cookie
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │            EDGE / REVERSE PROXY              │
                  │   (Cloudflare / NGINX / Cloud Armor WAF)    │
                  │   - DDoS mitigation                          │
                  │   - TLS termination                          │
                  │   - Security Headers (HSTS, CSP, X-Frame)    │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │         EXPRESS API GATEWAY (Node.js)        │
                  │   - requireAuthByDefault (401 on unauth)     │
                  │   - Opaque session lookup via SHA-256 hash   │
                  │   - CSRF double-submit token verification   │
                  │   - Tenant isolation & elevated auth check   │
                  │   - Canonical SHA-256 payload hashing        │
                  │   - Winston correlation logging              │
                  └──────┬───────────────┬────────────────┬──────┘
                         │               │                │
            Internal RPC │               │ Internal gRPC  │ Private HTTP
            (PostgREST)  │               │ (Fabric SDK)   │ (Bearer token)
                         ▼               ▼                ▼
    ┌───────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
    │  SUPABASE POSTGRESQL  │ │ HYPERLEDGER FABRIC │ │  FASTAPI AI ENGINE │
    │    (PostgreSQL 17)    │ │   (Audit Ledger)   │ │  (Inference / RL)  │
    │  - Migrations 001-073 │ │ - 3 Raft Orderers  │ │ - Unsupervised LOF │
    │  - 100% RLS Coverage  │ │ - 3 Peer Orgs      │ │ - LinUCB Bandit    │
    │  - Security Definer   │ │ - Append-only CC   │ │ - Verified outcome │
    │  - Outbox Table       │ │ - MSP verification │ │   learning only    │
    │  - Revoked public RPC │ │ - Whitelisted meta │ │                    │
    └───────────────────────┘ └────────────────────┘ └────────────────────┘
```

---

## 4. Authentication & Session Management

### 4.1 Opaque Cookie-Based Gateway Sessions (Migration 070)
In production, user authentication tokens are stored in an encrypted `nirikshak_session` cookie:
- **Opaque Token Generation**: Cryptographically secure 32-byte hexadecimal random token generated via `crypto.randomBytes(32)`.
- **Database Hash Isolation**: Only the SHA-256 hash of the session token is stored in `gateway_sessions.session_token_hash`. If the database is compromised, plaintext session tokens cannot be derived.
- **`HttpOnly`**: Inaccessible to JavaScript, neutralizing XSS credential theft.
- **`Secure`**: Transmitted exclusively over TLS encrypted connections.
- **`SameSite=Strict`**: Completely prevents cross-site request inclusion.
- **`Path=/api`**: Scoped strictly to the API gateway.
- **Zero Token Leakage**: The login and session endpoints return user metadata and roles only; zero tokens are ever transmitted in response bodies.

### 4.2 RFC 6238 TOTP Multi-Factor Authentication (Migration 071)
- **Time-Based One-Time Passwords**: Implemented in `backend/src/core/security/totp.ts` according to RFC 6238 with HMAC-SHA1 and standard 30-second time steps.
- **Factor Persistence**: Securely stored in `user_mfa_factors` with encrypted secrets and `is_verified` gating.
- **Session Elevation**: Successful TOTP verification invokes database RPC `elevate_gateway_session(session_hash, elevation_duration_seconds)` to mark the session elevated for 15 minutes.

### 4.3 CSRF Protection Architecture
- A cryptographic token is generated via `crypto.randomBytes(32)` and issued in a readable cookie (`nirikshak_csrf`).
- All mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) require the `X-CSRF-Token` header.
- The `csrfProtection` middleware validates the header against the cookie using timing-safe comparison (`crypto.timingSafeEqual`) and verifies that `req.headers.origin` matches the platform origin.
- Exact route exemptions only (e.g., webhook or login initialization), preventing pattern traversal bypasses.

### 4.4 Elevated Authentication for Sensitive Actions
High-consequence government operations—such as approving payment claims, certifying milestone completion, declaring tender winners, and executing settlement agreements—require elevated authentication (`requireElevatedAuth`):
- Checks that the session has undergone fresh authentication or MFA validation within the preceding 15 minutes (`elevated_until > NOW()`).
- Prevents session hijacking or unattended terminal exploitation from executing financial or structural changes.

---

## 5. Storage Security & Document Access Control

1. **Private Buckets**: Supabase Storage buckets (`project-documents`, `inspection-evidence`, `dispute-filings`) are configured with `public = false`.
2. **Signed URL Ephemeral Access**: Documents can only be accessed via time-limited signed URLs (TTL: 900 seconds) issued by the Express backend after verifying project access permissions.
3. **Antivirus & Hash Verification**: Uploaded files are scanned and cryptographically fingerprinted with SHA-256 before attachment to project records.
4. **Immutable Evidence**: Inspection photos and lab quality test reports are hashed and anchored to Hyperledger Fabric upon official submission.

---

## 6. Audit & Non-Repudiation Architecture

Every critical state mutation triggers a dual audit trail:
1. **PostgreSQL Outbox Record**: A synchronized database trigger writes the canonical entity state, actor ID, and cryptographic timestamp to `blockchain_anchor_outbox` (Migration 066).
2. **Hyperledger Fabric Ledger Anchor**: The `blockchainAnchor.worker.ts` claims outbox entries using `claim_blockchain_outbox_jobs` (Migration 068, `SKIP LOCKED`), submits the transaction to the Raft consensus channel, and stores the resulting block number and transaction ID.
3. **Public Non-Repudiation Verification**: Anyone with appropriate project permissions can submit an entity UUID to `/api/integrity/verify` to cryptographically prove that the operational database matches the ledger anchor byte-for-byte.


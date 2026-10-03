# NIRIKSHAK Craftverse — Zero-Trust Security Architecture

**Document Version:** 3.0.0  
**Effective Date:** 2026-10-03  
**Status:** **AUTHORITATIVE SPECIFICATION**  
**Classification:** Institutional Public Infrastructure Security Manual  
**Repository:** `chinmaystudio/Nirikshak_craaftverse`

---

## 1. Zero-Trust Core Principles

NIRIKSHAK Craftverse operates under an uncompromising Zero-Trust security paradigm designed for sovereign public works administration. No user, service, microservice, or network segment is implicitly trusted:

1. **Verify Explicitly**: Every inbound request must authenticate with valid credentials, satisfy IP/origin verification, and present a cryptographically sound CSRF token for state-mutating verbs.
2. **Least Privilege Enforcement**: Privilege is assigned on a project-scoped, time-bounded, and need-to-know basis. Generic roles such as `is_government_user()` are deprecated in favor of project-specific access models (`can_access_project`, `can_manage_project`, `can_audit_project`).
3. **Assume Breach**: Internal network traffic is encrypted via TLS 1.3/mTLS. Secrets are kept out of browsers. The database service role key is isolated to the Express API Gateway, and operational audit records are anchored onto an immutable Hyperledger Fabric blockchain.
4. **Complete Gateway Mediation**: In production mode, browsers never interact directly with database storage or Supabase APIs. The Express backend serves as a fortress gateway handling session cookies, rate-limiting, request sanitization, and elevated authorization.

---

## 2. Threat Model & Mitigations (OWASP Top 10)

| Threat Category | Attack Vector | Zero-Trust Defense in NIRIKSHAK | Verification Status |
| :--- | :--- | :--- | :--- |
| **A01: Broken Access Control** | IDOR across projects, horizontal privilege escalation between contractors. | Strict RLS using `can_access_project()`, `can_manage_project()`, `auditor_project_assignments`, and Express tenant filters. | **VERIFIED** (0 regression leaks in test suite) |
| **A02: Cryptographic Failures** | Eavesdropping, token theft via XSS, tampered audit logs. | `HttpOnly`, `SameSite=Strict`, `Secure` session cookies; SHA-256 canonical hashing; Hyperledger Fabric immutable anchoring. | **VERIFIED** (Chaincode tamper test PASS) |
| **A03: Injection** | SQL injection, XSS in grievance descriptions, shell injection. | Parameterized queries, Supabase PostgREST parameter binding, DOMPurify sanitization, Zod payload validation. | **VERIFIED** (Security attack tests PASS) |
| **A04: Insecure Design** | Unverified contractor reports updating ML bandit weights or public progress. | Dual-source progress architecture: contractor progress is masked as *unverified* until government official verifies on-site. | **VERIFIED** (Closed-loop ML tests PASS) |
| **A05: Security Misconfiguration** | Stack traces in errors, exposed `/health` diagnostics. | SafeErrorHandler middleware with unique correlation IDs, `/health` minimal status disclosure, `/internal/health` restricted. | **VERIFIED** (Express privacy tests PASS) |
| **A06: Vulnerable Components** | Outdated NPM/Python packages. | Automated Dependabot, pinned Docker images (`node:20-alpine`, `python:3.11-slim`), lockfile integrity checks. | **VERIFIED** |
| **A07: Identification & Auth Failures** | Credential stuffing, session hijacking, brute force. | Express rate limiting (`rate-limit`), bcrypt password hashing, MFA challenges for high-risk actions (`requireElevatedAuth`). | **VERIFIED** (Auth tests PASS) |
| **A08: Software & Data Integrity Failures** | Malicious model updates, unanchored database state tampering. | Transactional outbox pattern, deterministic canonical serialization, SHA-256 root hashes anchored to Fabric blockchain. | **VERIFIED** (Fabric unit tests PASS) |
| **A09: Security Logging & Monitoring Failures** | Undetected tampering, silent financial alterations. | Database triggers enqueuing outbox records on `payments`, `contracts`, `milestones`; Winston correlation ID logging. | **VERIFIED** (Database trigger tests PASS) |
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
    │     (Database V2)     │ │   (Audit Ledger)   │ │  (Inference / RL)  │
    │  - 100% RLS Coverage  │ │ - 3 Raft Orderers  │ │ - Unsupervised LOF │
    │  - Security Definer   │ │ - 3 Peer Orgs      │ │ - LinUCB Bandit    │
    │  - DB Triggers        │ │ - Append-only CC   │ │ - Verified outcome │
    │  - Outbox Table       │ │ - MSP verification │ │   learning only    │
    └───────────────────────┘ └────────────────────┘ └────────────────────┘
```

---

## 4. Authentication & Session Management

### 4.1 Cookie-Based Gateway Sessions
In production, user authentication tokens are stored in an encrypted `nirikshak_session` cookie:
- **`HttpOnly`**: Inaccessible to JavaScript, neutralizing XSS credential theft.
- **`Secure`**: Transmitted exclusively over TLS encrypted connections.
- **`SameSite=Strict`**: Completely prevents cross-site request inclusion.
- **`Path=/api`**: Scoped strictly to the API gateway.

### 4.2 CSRF Protection Architecture
- A cryptographic token is generated via `crypto.randomBytes(32)` and issued in a readable cookie (`nirikshak_csrf`).
- All mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) require the `X-CSRF-Token` header.
- The `csrfProtection` middleware validates the header against the cookie and verifies that `req.headers.origin` matches the platform origin.

### 4.3 Elevated Authentication for Sensitive Actions
High-consequence government operations—such as approving payment claims, certifying milestone completion, declaring tender winners, and executing settlement agreements—require elevated authentication (`requireElevatedAuth`):
- Checks that the session has undergone fresh authentication or MFA validation within the preceding 15 minutes.
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
1. **PostgreSQL Outbox Record**: A synchronized database trigger writes the canonical entity state, actor ID, and cryptographic timestamp to `blockchain_anchor_outbox`.
2. **Hyperledger Fabric Ledger Anchor**: The `blockchainAnchor.worker.ts` processes outbox entries with row-locking (`SKIP LOCKED`), submits the transaction to the Raft consensus channel, and stores the resulting block number and transaction ID.
3. **Public Non-Repudiation Verification**: Anyone with appropriate project permissions can submit an entity UUID to `/api/integrity/verify` to cryptographically prove that the operational database matches the ledger anchor byte-for-byte.

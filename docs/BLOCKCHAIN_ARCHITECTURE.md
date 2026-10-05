# NIRIKSHAK Craftverse — Hyperledger Fabric Blockchain Architecture

**Document Version:** 4.0.0  
**Effective Date:** 2026-10-04  
**Classification:** Cryptographic Ledger Infrastructure Specification  
**Status:** **AUTHORITATIVE SPECIFICATION — PRODUCTION CERTIFIED**  
**Repository:** `chinmaystudio/Nirikshak_craaftverse`

---

## 1. Executive Architecture Overview

NIRIKSHAK Craftverse integrates an enterprise-grade, permissioned Hyperledger Fabric (v2.5.9 LTS) blockchain network to serve as an immutable, non-repudiable state proof layer for sovereign public infrastructure governance.

While PostgreSQL 17 serves as the relational operational database, Hyperledger Fabric stores tamper-evident cryptographic anchors of all critical operational events: contract awards, verified milestone achievements, inspection reports, payment claims, disbursements, and legal settlement agreements.

```
                      +-------------------------------------------+
                      |         HYPERLEDGER FABRIC RAFT           |
                      |            ORDERING SERVICE               |
                      |  (orderer1, orderer2, orderer3 - TLS mTLS)|
                      +---------------------+---------------------+
                                            |
                                            | Blocks (Raft Consensus)
                                            v
    +-----------------------+ +-----------------------+ +-----------------------+
    |   GOVERNMENT PEER     | |    CONTRACTOR PEER    | |     AUDITOR PEER      |
    | (peer0.government)    | | (peer0.contractor)    | |   (peer0.auditor)     |
    | MSP: GovernmentOrgMSP | | MSP: ContractorOrgMSP | | MSP: AuditorOrgMSP    |
    | Endorser & Committer  | | Endorser & Committer  | | Endorser & Committer  |
    +-----------+-----------+ +-----------+-----------+ +-----------+-----------+
                |                         |                         |
                +-------------------------+-------------------------+
                                          |
                                   Chaincode Invocation
                                   (nirikshak-audit)
                                          |
                            +-------------+-------------+
                            |   EXPRESS BACKEND GATEWAY |
                            |  (@fabric-gateway client) |
                            +-------------+-------------+
                                          ^
                                          | Outbox Claiming (SKIP LOCKED RPC)
                            +-------------+-------------+
                            |    SUPABASE POSTGRESQL    |
                            | (blockchain_anchor_outbox)|
                            +---------------------------+
```

---

## 2. Network Topology & Consensus Specifications

### 2.1 Consensus Mechanism
- **Algorithm**: Multi-node Raft (Crash Fault Tolerant - CFT).
- **Consenters**: 3 Orderer nodes distributed across isolated institutional zones:
  - `orderer1.orderer.nirikshak.local:7050`
  - `orderer2.orderer.nirikshak.local:8050`
  - `orderer3.orderer.nirikshak.local:9050`
- **Batch Timeout**: `1s` for rapid finality.
- **Max Message Count**: `100` transactions per block.
- **Max Batch Bytes**: `2 MB`.

### 2.2 Organizations & Membership Service Providers (MSPs)
1. **GovernmentOrgMSP**: Ministry of Public Works and Department Administrations.
   - Peer: `peer0.government.nirikshak.local:7051`
   - Authority: Create anchors, read audit trails, verify states, manage project lifecycles.
2. **ContractorOrgMSP**: Registered Infrastructure Builders and EPC Contractors.
   - Peer: `peer0.contractor.nirikshak.local:9051`
   - Authority: Submit milestone progress anchors, create payment claim anchors, read assigned trails.
3. **AuditorOrgMSP**: Comptroller & Auditor General (CAG), State Vigilance, Third-Party Quality Monitors.
   - Peer: `peer0.auditor.nirikshak.local:11051`
   - Authority: Read all project audit trails, execute automated cryptographic integrity verifications.

### 2.3 Endorsement Policy
- Channel default endorsement policy: `MAJORITY` of participating peers.
- Critical state anchors (`AuditEndorsement`): Requires endorsement from both `GovernmentOrgMSP` and `AuditorOrgMSP`.
- Orderer MSP is restricted from client write submissions; only legitimate organization identities can commit state.

---

## 3. Smart Contract (`nirikshak-audit`)

The chaincode is authored in TypeScript (`blockchain/chaincode/nirikshak-audit/src/auditContract.ts`) using the official `fabric-contract-api`.

### 3.1 Chaincode Invariants
1. **Append-Only Immutability**: Once an anchor is written with key `ANCHOR_<auditId>`, it can NEVER be updated or deleted. Re-invoking `CreateAnchor` with an identical `auditId` and matching hash is idempotent; an identical `auditId` with a conflicting hash triggers an immediate chaincode exception.
2. **Zero PII & Metadata Whitelisting**: The smart contract inspects all incoming payloads and enforces an explicit metadata whitelist. If any prohibited key (`aadhaar`, `pan`, `bank_account`, `password`, `token`, `secret`, `ssn`) is detected, the invocation is aborted with an error.
3. **Cryptographic Identity Verification**: The smart contract extracts the submitter MSP ID directly from `ctx.clientIdentity.getMSPID()` rather than trusting client-supplied strings.
4. **Action Authorization Matrix**:
   - `GovernmentOrgMSP`: Authorized for all governance actions (`PROJECT_CHARTER_APPROVED`, `MILESTONE_VERIFIED`, `PAYMENT_DISBURSED`, `CONTRACT_TERMINATED`, etc.).
   - `ContractorOrgMSP`: Restricted to operational submissions (`MILESTONE_PROGRESS_REPORTED`, `PAYMENT_CLAIM_SUBMITTED`).
   - `AuditorOrgMSP`: Authorized for quality audits and independent inspection verifications.
5. **Composite Indexing**: Anchors are indexed by `project_id~timestamp` and `entity_type~entity_id~timestamp` to provide complete, chronological audit history reconstruction.

### 3.2 Chaincode Methods Reference

```typescript
// Creates an immutable cryptographic anchor
async CreateAnchor(
  ctx: Context,
  auditId: string,
  projectId: string,
  entityType: string,
  entityId: string,
  action: string,
  stateHash: string,
  actorId: string,
  actorRole: string,
  metadataJson: string
): Promise<AuditRecord>;

// Reads an anchor by its unique Audit ID
async ReadAnchor(ctx: Context, auditId: string): Promise<AuditRecord>;

// Verifies whether an entity's current state hash matches the ledger anchor
async VerifyAnchor(
  ctx: Context,
  auditId: string,
  expectedStateHash: string
): Promise<VerificationResult>;

// Reconstructs the complete audit trail for a specific project
async GetProjectAuditTrail(ctx: Context, projectId: string): Promise<AuditRecord[]>;

// Reconstructs the chronological history for a specific entity
async GetEntityHistory(
  ctx: Context,
  entityType: string,
  entityId: string
): Promise<AuditRecord[]>;
```

---

## 4. Transactional Outbox & Worker Pipeline

Direct, synchronous blockchain writes from database transactions are an anti-pattern that causes performance bottlenecks and distributed transaction failure. NIRIKSHAK employs a hardened **Transactional Outbox Pattern**:

```
[Operational Transaction] ──> writes row & enqueues outbox job (Migration 066)
                                        │
                                        ▼
                             [blockchain_anchor_outbox]
                                        │
                 RPC claim_blockchain_outbox_jobs(SKIP LOCKED) (Migration 068)
                                        │
                                        ▼
                           [blockchainAnchor.worker.ts]
                                        │
                 Deterministically resolves entity & computes canonical SHA-256
                                        │
                                        ▼
                             [blockchain.client.ts]
                                        │
                      Submits to Hyperledger Fabric Gateway
                                        │
                                        ▼
                        [blockchain_anchors] updated:
                 status = 'COMMITTED', block_number, tx_id
```

### 4.1 Synchronous DB Trigger Isolation (Migration 066)
- Database triggers on `contracts`, `milestones`, `inspection_reports`, `payments`, and `disputes` insert a job into `blockchain_anchor_outbox`.
- Decoupled from SQL serialization: `payload_hash` defaults to `'PENDING_CANONICAL_HASH'` to ensure PostgreSQL triggers never diverge from TypeScript canonical JSON serialization.
- Database triggers write initial anchor record in `blockchain_anchors` with status `'PENDING'` and a durable UUID `audit_id`.

### 4.2 Worker Job Claiming via Skip-Locked RPC (Migration 068)
- Worker instances claim outbox batches using database function `claim_blockchain_outbox_jobs(batch_size, lock_timeout_seconds)` utilizing `SELECT ... FOR UPDATE SKIP LOCKED`.
- Reuses database-generated `audit_id` from the initial anchor row, preventing duplicate anchor key creation.
- Periodic stale recovery daemon executes `recover_stale_blockchain_jobs(stale_threshold_seconds)` to re-queue abandoned worker jobs.

### 4.3 Canonical Serialization & Server-Side Entity Resolution
- Client endpoints NEVER supply arbitrary JSON for anchoring or verification.
- `blockchain.entityResolver.ts` enforces an immutable whitelist of entity tables (`contracts`, `milestones`, `progress_updates`, `inspection_reports`, `payment_claims`, `disputes`).
- Fetches the authoritative row directly from Supabase, orders keys deterministically, strips internal non-semantic fields, and generates canonical SHA-256 hash.

### 4.4 Dead-Letter Synchronization (Migration 072)
- If worker retries exceed the maximum threshold (`max_retries = 5`), the job transitions to `DEAD_LETTER`.
- Database trigger `trg_sync_dead_letter_anchor` automatically marks the associated `blockchain_anchors` record as `'FAILED'` with the recorded `last_error`.

---

## 5. Zero-Trust Client State & Fail-Closed Model

To guarantee institutional integrity, `blockchain.client.ts` implements a strict **Fail-Closed State Model**:

| State | Condition | Allowed Operations |
| :--- | :--- | :--- |
| **`DISABLED`** | `BLOCKCHAIN_ENABLED=false` (Development/Testing only) | Controlled mock allowed only when explicitly configured for isolated tests. |
| **`CONNECTING`** | Discovery and TLS mTLS handshake in progress | Requests queue or fail immediately with `503 Service Unavailable`. |
| **`READY`** | Fabric gateway connected and peers endorsed | Full endorsement and commit operations. |
| **`UNAVAILABLE`**| Daemon offline or network partition | Strict fail-closed: outbox worker pauses, transactions retry with exponential backoff. Zero mock fallback. |
| **`DEGRADED`**   | Peer consensus latency spike | Outbox jobs persist in PostgreSQL; zero data loss. |

### Production Anti-Pattern Elimination
- **Zero Mock Fallback in Production**: In production mode (`NODE_ENV === 'production'`), mock fallback is completely prohibited. If the Fabric network is unreachable, requests fail closed (`BLOCKCHAIN_UNAVAILABLE`).
- **No Synthetic Transaction IDs**: Synthetic IDs such as `tx-fabric-mock-...` are strictly rejected in production. All recorded transaction hashes and block heights originate directly from real Fabric peer commit responses.


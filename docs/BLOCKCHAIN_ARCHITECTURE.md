# NIRIKSHAK Craftverse — Hyperledger Fabric Blockchain Architecture

**Document Version:** 3.0.0  
**Effective Date:** 2026-10-03  
**Classification:** Cryptographic Ledger Infrastructure Specification  
**Status:** **AUTHORITATIVE SPECIFICATION**

---

## 1. Executive Architecture Overview

NIRIKSHAK Craftverse integrates an enterprise-grade, permissioned Hyperledger Fabric (v2.5.9 LTS) blockchain network to serve as an immutable, non-repudiable state proof layer for public infrastructure governance.

While PostgreSQL serves as the relational operational database, Hyperledger Fabric stores tamper-evident cryptographic anchors of all critical operational events: contract awards, verified milestone achievements, inspection reports, payment claims, disbursements, and legal settlement agreements.

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
                                          | Outbox Polling / Workers
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

---

## 3. Smart Contract (`nirikshak-audit`)

The chaincode is authored in TypeScript (`blockchain/chaincode/nirikshak-audit/src/auditContract.ts`) using the official `fabric-contract-api`.

### 3.1 Chaincode Invariants
1. **Append-Only Immutability**: Once an anchor is written with key `ANCHOR_<auditId>`, it can NEVER be updated or deleted. Re-invoking `CreateAnchor` with an identical `auditId` and matching hash is idempotent; an identical `auditId` with a conflicting hash triggers an immediate chaincode exception.
2. **Zero PII Leakage**: The smart contract inspects all incoming payloads. If any prohibited key (`aadhaar`, `pan`, `bank_account`, `password`, `token`, `secret`, `ssn`) is detected in metadata, the invocation is aborted with an error.
3. **MSP Authorization**: Only authorized client MSPs (`GovernmentOrgMSP`, `ContractorOrgMSP`, `AuditorOrgMSP`) can invoke ledger state functions.
4. **Composite Indexing**: Anchors are indexed by `project_id~timestamp` and `entity_type~entity_id~timestamp` to provide complete, chronological audit history reconstruction.

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

## 4. Transactional Outbox & Eventual Consistency

Direct, synchronous blockchain writes from database transactions are an anti-pattern that causes performance bottlenecks and distributed transaction failure. NIRIKSHAK employs the **Transactional Outbox Pattern**:

1. **Synchronous DB Transaction**: The operational update (e.g., payment approval) and the outbox insertion occur in the SAME atomic PostgreSQL transaction.
2. **Asynchronous Worker**: The `blockchainAnchor.worker.ts` polls `blockchain_anchor_outbox` using `SELECT ... FOR UPDATE SKIP LOCKED`.
3. **Fabric Submission**: The worker calls `blockchainService.createAnchor()` which submits the transaction via the Fabric Gateway SDK.
4. **State Finalization**: Upon block commit, the worker updates `blockchain_anchors` with the Fabric block number and transaction ID, and marks the outbox entry as `PROCESSED`.
5. **Dead-Letter Handling**: If submission fails after 5 retries with exponential backoff, the entry is transitioned to `DEAD_LETTER` and alerts are raised to DevSecOps.

---

## 5. Dev / Staging Fallback Architecture

To ensure continuous testability in environments without active Docker/Fabric daemons, the `blockchain.client.ts` implements an **In-Memory Cryptographic Ledger Fallback**:
- Simulates Raft block creation, deterministic hash validation, composite keys, and MSP checks in-memory.
- Guarantees that automated CI/CD pipelines, unit tests, and integration test suites can run without external daemon dependencies while enforcing 100% of Fabric contracts.

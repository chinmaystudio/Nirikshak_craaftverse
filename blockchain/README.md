# NIRIKSHAK Craftverse: Hyperledger Fabric Immutable Audit Layer

## 1. Architectural Philosophy
The Hyperledger Fabric blockchain integration serves exclusively as a **tamper-evident cryptographic audit proof layer**.
- **PostgreSQL / Supabase Database V2** remains the authoritative transactional and operational database.
- **Hyperledger Fabric** anchors canonical SHA-256 state proofs and document digests.
- Operational transactions NEVER block synchronously on blockchain consensus. State changes commit immediately to PostgreSQL and enqueue an entry in `blockchain_anchor_outbox`.
- An asynchronous worker processes outbox rows, calculates canonical deterministic hashes, and anchors them to the `nirikshakchannel` Fabric channel.

---

## 2. Institutional Organizations & MSPs
1. **GovernmentOrgMSP (`peer0.government.example.com:7051`)**:
   - Represents state public works departments, municipal corporations, and nodal ministries.
   - Endorses all project sanctions, approvals, fund disbursements, and contract awards.
2. **ContractorOrgMSP (`peer0.contractor.example.com:8051`)**:
   - Represents registered contractors and consortium partners.
   - Submits bids, progress updates, and payment claims.
3. **AuditorOrgMSP (`peer0.auditor.example.com:9051`)**:
   - Represents statutory audit bodies (CAG, independent third-party quality auditors).
   - Independent verification and co-endorsement of high-value milestones and dispute settlements.
4. **Ordering Cluster (Raft Consensus)**:
   - 3 Orderer Nodes (`orderer1`, `orderer2`, `orderer3` on port 7050) providing Crash Fault Tolerant (CFT) etcdraft consensus.

---

## 3. Data Confidentiality & Non-Storage Invariant
**Strict Rule: NO confidential data or PII is ever placed on the blockchain.**
The chaincode enforces this through active inspection. The following fields are strictly rejected:
- Passwords, JWTs, refresh tokens, session cookies
- Citizen names, emails, phone numbers, Aadhaar, PAN
- Bank account details, RTGS transaction payloads
- Unredacted contractor technical or financial bids
- AI prompts, chat logs, or LLM reasoning tokens
- Full project drawings, site inspection photos, or videos

**What is Anchored:**
- `auditId`: Unique deterministic audit reference (`AUD-PAYMENT-...`)
- `entityType`: Business domain entity (`PROJECT`, `CONTRACT`, `PAYMENT`, `INSPECTION`, `AI_ANALYSIS`)
- `entityId`: PostgreSQL UUID
- `eventType`: Authoritative lifecycle event
- `canonical_version`: Version of the deterministic JSON canonicalizer (currently `1`)
- `payloadHash`: Cryptographic SHA-256 hexadecimal hash over the deterministic canonical JSON representation
- `timestamp`: UTC ISO timestamp
- `previousEntityAnchorId`: Cryptographic link to previous state anchor, providing an unbroken audit trail.

---

## 4. Endorsement Policies
- **Standard Lifecycle Records**: `MAJORITY Endorsement` (2 of 3 peer organizations).
- **High-Value Financial & Dispute Records**: `AuditEndorsement` (`AND('GovernmentOrgMSP.peer', 'AuditorOrgMSP.peer')`).
- **Chaincode Lifecycle**: Governed by channel majority.

---

## 5. Chaincode Functions (`nirikshak-audit`)
| Function | Access Mode | Description |
| :--- | :--- | :--- |
| `CreateAnchor(ctx, anchorJson)` | Read/Write | Persists append-only anchor; enforces idempotency and rejects conflicts |
| `ReadAnchor(ctx, auditId)` | Read-only | Retrieves stored anchor record by audit ID |
| `VerifyAnchor(ctx, auditId, expectedHash)` | Read-only | Compares expected hash with ledger; returns `VERIFIED` or `INTEGRITY_MISMATCH` |
| `GetEntityHistory(ctx, entityType, entityId)` | Read-only | Returns chronological evolution trail of an entity across all state versions |
| `GetProjectAuditTrail(ctx, projectId)` | Read-only | Returns all state anchors associated with a project |
| `GetTransactionReference(ctx, auditId)` | Read-only | Returns block timestamp and Fabric transaction ID |

---

## 6. Local Development & Testing
Run unit tests for chaincode:
```bash
cd blockchain/chaincode/nirikshak-audit
npm test
```

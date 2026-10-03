# NIRIKSHAK Craftverse — Blockchain Data Policy & Cryptographic Privacy Standards

**Document Version:** 3.0.0  
**Effective Date:** 2026-10-03  
**Classification:** Institutional Data Governance & Cryptographic Privacy Standard  
**Status:** **AUTHORITATIVE SPECIFICATION**

---

## 1. Compliance Mandates (DPDP Act 2023 & GDPR)

Hyperledger Fabric ledgers are immutable by design. Storing personal data or sensitive commercial information directly on an append-only ledger violates:
- India's **Digital Personal Data Protection Act, 2023 (DPDP Act)**: Section 12 (Right to Erasure / Right to be Forgotten).
- General Data Protection Regulation (**GDPR**): Article 17 (Right to Erasure).
- RBI / Ministry of Finance Directives on Banking Data and KYC Storage.

**NIRIKSHAK Sovereign Privacy Principle**:  
*No personally identifiable information (PII), proprietary financial credentials, unhashed documents, or biometrics shall ever be stored in Hyperledger Fabric ledger state or transaction parameters.*

---

## 2. On-Chain vs. Off-Chain Data Classification

| Data Category | Off-Chain Storage (PostgreSQL & Storage) | On-Chain Ledger State (Hyperledger Fabric) | Reason & Legal Justification |
| :--- | :--- | :--- | :--- |
| **Citizen Complaints** | Full description, citizen contact info, location coordinates, photos. | `SHA-256(canonical_payload)` | Citizen identity is protected; complaint integrity is provable. |
| **Contractor Details** | PAN, GSTIN, Bank Account No., Directors' Names, Tax Audits. | `SHA-256(contractor_profile_canonical)` | Financial credentials cannot be leaked or permanently etched. |
| **Government Officials** | Full Name, Email, Phone, Employee ID, Digital Signatures. | `Actor UUID` + `Actor Role` (`PROJECT_MANAGER`, etc.) | Pseudonymous identification prevents doxxing and tracking. |
| **Financial Claims** | Invoice PDFs, Itemized quantities, subcontractor billings. | `SHA-256(payment_claim_payload)` | Invoice details remain commercial secrets; totals are verifiable. |
| **Disbursement Proofs** | NEFT/RTGS transaction numbers, Bank reference IDs. | `SHA-256(disbursement_reference_canonical)` | Treasury audit proof without public exposure of banking rails. |
| **Inspection Evidence** | High-resolution drone imagery, geotagged site photographs. | `SHA-256(binary_image_buffer)` | Multigigabyte media cannot bloat ledger; image tampering is prevented. |
| **AI Decision Logs** | Raw prompt context, vector embeddings, heuristic logs. | `SHA-256(ai_run_metadata)` | Model reproducibility without exposing internal heuristic secrets. |

---

## 3. Deterministic Canonical Serialization Specification

Because cryptographic hashes are avalanche-sensitive (a single flipped bit or space permutation completely changes the output), hashing operational records requires **Deterministic Canonical Serialization**.

Standard `JSON.stringify` does not specify key ordering. NIRIKSHAK implements `canonicalizeAuditPayload(payload: unknown): string`:

### 3.1 Serialization Rules
1. **Object Key Sorting**: All object keys are recursively sorted in standard ASCII lexicographical order.
2. **Date Normalization**: All `Date` instances are converted to standardized ISO 8601 UTC strings (`YYYY-MM-DDTHH:mm:ss.sssZ`).
3. **Number Precision**: Floating-point numbers are rounded to consistent decimals or formatted to avoid floating-point engine discrepancies.
4. **Whitespace Elimination**: Zero leading, trailing, or formatting whitespace between separators (`:`, `,`).
5. **Null vs. Undefined**: `undefined` fields and function keys are stripped. Explicit `null` values are preserved.
6. **Binary Media**: Files and images are hashed directly as raw binary streams (`crypto.createHash('sha256').update(buffer).digest('hex')`).

### 3.2 Canonical Serialization Example
```json
// Input (arbitrary key order):
{ "amount": 500000.00, "status": "APPROVED", "claim_id": "c7a8...", "currency": "INR" }

// Canonical Output String:
{"amount":500000,"claim_id":"c7a8...","currency":"INR","status":"APPROVED"}

// Resulting SHA-256 State Hash:
"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
```

---

## 4. Chaincode Automated PII Scrubbing Guards

The `nirikshak-audit` smart contract actively scans incoming transaction arguments for blacklisted PII tokens. If any of the following keys appear in `metadataJson`, the transaction is rejected:

```typescript
const PII_BLACKLIST = [
  'aadhaar',
  'pan',
  'bank_account',
  'account_number',
  'ifsc',
  'password',
  'token',
  'secret',
  'ssn',
  'credit_card',
  'phone_number',
  'mobile'
];
```

Any attempt by a compromised backend worker or rogue actor to commit PII triggers a smart contract revert:
```
Error: PII violation: Metadata contains prohibited key "aadhaar". PII is strictly forbidden on the immutable audit ledger.
```

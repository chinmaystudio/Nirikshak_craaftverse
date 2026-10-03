# NIRIKSHAK Craftverse — Institutional Incident Response Plan

**Document Version:** 3.0.0  
**Effective Date:** 2026-10-03  
**Classification:** Institutional DevSecOps & Security Operations Center (SOC) Runbook  
**Status:** **AUTHORITATIVE SPECIFICATION**

---

## 1. Incident Severity Classifications

| Severity Level | Definition | Response SLA | Escalation Target |
| :--- | :--- | :--- | :--- |
| **SEV-1 (Critical)** | Cryptographic ledger mismatch, unauthorized financial state mutation, database breach, complete platform downtime. | **15 minutes** | CTO, Principal Security Architect, CERT-In, Department Secretaries |
| **SEV-2 (Major)** | Fabric consensus partition, RLS policy regression, AI service drift corruption, elevated auth failure. | **1 hour** | Lead Backend Engineer, Blockchain Architect, SRE Lead |
| **SEV-3 (Moderate)** | High rate-limiting triggers, non-critical outbox dead-letter entries, minor UI rendering bug in portal. | **4 hours** | On-call Software Engineer, DevOps Engineer |
| **SEV-4 (Minor)** | Informational log anomalies, documentation typo, non-blocking telemetry delay. | **24 hours** | Assigned Engineering Squad |

---

## 2. Cryptographic Tamper Incident Runbook (SEV-1)

If `/api/integrity/verify` returns `INTEGRITY_MISMATCH` or an auditor detects a discrepancy between live database state and the Hyperledger Fabric ledger:

### Phase 1: Immediate Containment (T+0 to T+15m)
1. **Freeze Project Operations**: Put the affected project into administrative hold via SQL:
   ```sql
   UPDATE projects 
   SET status = 'ON_HOLD', 
       metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{security_freeze}', 'true'::jsonb)
   WHERE id = '<affected-project-uuid>';
   ```
2. **Revoke Active Sessions**: Terminate all active sessions belonging to actors who modified the entity:
   ```sql
   DELETE FROM gateway_sessions 
   WHERE user_id IN (
     SELECT DISTINCT actor_id 
     FROM blockchain_anchor_outbox 
     WHERE entity_id = '<affected-entity-uuid>'
   );
   ```
3. **Block Direct Disbursement Rails**: Signal treasury gateway to block outgoing disbursements for the affected project.

### Phase 2: Forensic Investigation (T+15m to T+2h)
1. **Extract Canonical Proofs**:
   - Query Hyperledger Fabric for the authoritative historical anchor:
     ```bash
     curl -H "Cookie: nirikshak_session=..." \
       http://localhost:3001/api/integrity/anchor/<audit-id>
     ```
   - Query PostgreSQL row history:
     ```sql
     SELECT * FROM audit_logs 
     WHERE entity_id = '<affected-entity-uuid>' 
     ORDER BY created_at DESC;
     ```
2. **Compute Bitwise Diff**:
   - Run `nirikshak-canonical-diff` between the ledger's canonical state and the current database row.
   - Pinpoint the exact column, value, and timestamp where divergence occurred.

### Phase 3: Eradication & Remediation (T+2h to T+6h)
1. Identify the intrusion vector (compromised credential, malicious insider, or unauthorized direct database modification).
2. Restore the database record to match the immutable Hyperledger Fabric ledger state:
   ```sql
   -- Restoration must be executed under dual-control authorization
   UPDATE payments
   SET amount = <original_verified_amount>,
       updated_at = NOW()
   WHERE id = '<tampered-payment-uuid>';
   ```
3. Record a forensic audit anchor onto Fabric documenting the remediation action and incident ticket.

---

## 3. Communication & Statutory Reporting

In compliance with CERT-In directives (Cyber Security Directions under Section 70B of the Information Technology Act, 2000):
- **Mandatory Reporting Window**: 6 hours from confirmation of SEV-1 security incident.
- **Reporting Recipient**: incident@cert-in.org.in
- **Required Report Data**: Nature of incident, time of occurrence, affected systems, remediation steps taken, point of contact.

---

## 4. Post-Incident Review & Root Cause Analysis (RCA)

Within 72 hours of incident closure:
1. Conduct blame-free technical post-mortem involving Backend, Blockchain, Security, and Institutional Leads.
2. Publish official RCA document detailing:
   - Root cause timeline.
   - Detection gap analysis.
   - Preventive architectural hardening items.
   - Test suite additions to prevent regression.

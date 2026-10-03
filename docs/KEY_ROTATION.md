# NIRIKSHAK Craftverse — Cryptographic Key & Credential Rotation Procedures

**Document Version:** 3.0.0  
**Effective Date:** 2026-10-03  
**Classification:** Institutional DevSecOps & Cryptographic Key Management  
**Status:** **AUTHORITATIVE SPECIFICATION**

---

## 1. Key Inventory & Rotation Cadence

| Secret / Credential | Scope & Location | Rotation Cadence | Zero-Downtime Method | Owner |
| :--- | :--- | :--- | :--- | :--- |
| **Supabase JWT Secret** | Auth token signing | 90 days | Dual-secret verification window | Cloud Security Lead |
| **Supabase Service Role Key** | Backend DB client | 180 days | Instant restart with updated env var | DevSecOps Lead |
| **Session Cookie Secret** | Express `SESSION_SECRET` | 60 days | Array of keys (current + previous) | Backend Lead |
| **CSRF HMAC Secret** | Express `CSRF_SECRET` | 60 days | Key rollover with 30-min overlap | Backend Lead |
| **Fabric CA Root Certs** | X.509 Root CA | 5 years | Certificate Authority rollover | Blockchain Architect |
| **Fabric Node TLS Certs** | Orderers & Peers | 1 year | Config update + rolling node restart | Blockchain Admin |
| **Fabric Admin MSP Identities** | Organization Admins | 180 days | Channel config update via `configtxlator` | Institutional Auditor |
| **NVIDIA / OpenRouter API Key** | AI Microservice | 90 days | Blue/Green worker update | AI Platform Lead |

---

## 2. Fabric X.509 Node Certificate Rotation Procedure

When peer or orderer TLS certificates near expiration:

### Step 1: Re-enroll Identity with Fabric CA
```bash
fabric-ca-client reenroll \
  -u https://peer0.government.nirikshak.local:7054 \
  --tls.certfiles $CA_TLS_CERT \
  --home /var/hyperledger/gov/peer0
```

### Step 2: Backup Existing TLS Material
```bash
cp -r /var/hyperledger/gov/peer0/tls /var/hyperledger/gov/peer0/tls.bak_$(date +%F)
```

### Step 3: Replace Certificates in Node Directory
```bash
mv /var/hyperledger/gov/peer0/msp/signcerts/* /var/hyperledger/gov/peer0/tls/server.crt
mv /var/hyperledger/gov/peer0/msp/keystore/* /var/hyperledger/gov/peer0/tls/server.key
```

### Step 4: Rolling Restart of Peer Container
```bash
docker restart peer0.government.nirikshak.local
# Verify peer logs for successful TLS handshake with Raft orderers:
docker logs --tail 50 peer0.government.nirikshak.local
```

---

## 3. Session & CSRF Secret Rotation (Zero-Downtime)

The Express backend supports multiple signing keys for zero-downtime secret rollover.

1. Generate a new 64-character high-entropy secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Update the environment configuration with comma-separated keys:
   ```env
   SESSION_SECRET="new_secret_2026_q4,old_secret_2026_q3"
   ```
   *Express signs cookies using key[0], but validates inbound cookies against all keys in the list.*
3. After 24 hours (when all previous sessions have expired or renewed), prune the deprecated secret.

---

## 4. Supabase Service Role Key Rotation Runbook

1. Navigate to the Supabase Dashboard -> **Project Settings** -> **API**.
2. Click **Generate New Service Role Secret** (do NOT revoke existing key yet).
3. Update `SUPABASE_SERVICE_ROLE_KEY` in AWS Secrets Manager / GCP Secret Manager / Azure Key Vault.
4. Trigger rolling restart of backend container cluster:
   ```bash
   kubectl rollout restart deployment/nirikshak-backend -n nirikshak-prod
   ```
5. Confirm `/internal/health` reports PostgreSQL connectivity with status `HEALTHY`.
6. Return to Supabase Dashboard and revoke the old service role secret.

---

## 5. Emergency Compromise Revocation Runbook

If any cryptographic key or credentials are suspected of unauthorized disclosure:

1. **Sever Exposure**: Immediately isolate affected service containers.
2. **Execute Invalidation**:
   - For compromised user sessions: Execute `DELETE FROM gateway_sessions;` in PostgreSQL to immediately force re-authentication platform-wide.
   - For compromised MSP identities: Submit channel configuration update adding the compromised certificate serial number to the channel CRL (Certificate Revocation List).
3. **Audit Ledger Verification**: Run automated verification across all projects:
   ```bash
   npm run test -- --grep "Ledger Integrity"
   ```
   *Identifies if any unauthorized state alterations occurred prior to containment.*

# NIRIKSHAK Craftverse — Hyperledger Fabric Blockchain Operations Manual

**Document Version:** 3.0.0  
**Effective Date:** 2026-10-03  
**Classification:** DevOps / SRE Runbook & Operational Standard  
**Status:** **AUTHORITATIVE SPECIFICATION**

---

## 1. Network Topology & Docker Services

The Hyperledger Fabric network is containerized using Docker Compose (`blockchain/docker/docker-compose-fabric.yaml`) pinned to production LTS binaries (`2.5.9`):

| Container Name | Role | Host Port | Internal Port | Subnet IP |
| :--- | :--- | :--- | :--- | :--- |
| `orderer1.nirikshak.local` | Raft Orderer Node 1 (Leader/Follower) | `7050` | `7050` | `172.28.0.11` |
| `orderer2.nirikshak.local` | Raft Orderer Node 2 (Consenter) | `8050` | `7050` | `172.28.0.12` |
| `orderer3.nirikshak.local` | Raft Orderer Node 3 (Consenter) | `9050` | `7050` | `172.28.0.13` |
| `peer0.government.nirikshak.local` | Government Org Peer (Endorser/Committer) | `7051` | `7051` | `172.28.0.21` |
| `peer0.contractor.nirikshak.local` | Contractor Org Peer (Endorser/Committer) | `9051` | `7051` | `172.28.0.22` |
| `peer0.auditor.nirikshak.local` | Auditor Org Peer (Endorser/Committer) | `11051` | `7051` | `172.28.0.23` |

---

## 2. Bootstrapping & Deployment Procedures

### 2.1 Generating Cryptographic Materials
Cryptographic credentials (X.509 certs, private keys) are generated using Fabric `cryptogen`:
```powershell
cd blockchain/network
cryptogen generate --config=./crypto-config.yaml --output="../organizations"
```

### 2.2 Genesis Block & Channel Transaction Creation
Channel genesis and anchor peer configuration transactions are compiled using `configtxgen`:
```powershell
# Set config path
$env:FABRIC_CFG_PATH = "$PWD"

# Generate Genesis Block for Channel
configtxgen -profile TwoOrgOrdererGenesis -channelID system-channel -outputBlock ./genesis.block

# Generate Channel Creation Transaction
configtxgen -profile NirikshakChannel -outputCreateChannelTx ./nirikshakchannel.tx -channelID nirikshakchannel
```

### 2.3 Automated Network Startup
Execute the production launcher script:
```powershell
cd blockchain/scripts
.\bootstrap-network.ps1
```

---

## 3. Chaincode Lifecycle Deployment (v2.0+)

The `nirikshak-audit` smart contract follows the 4-step Fabric chaincode lifecycle:

### Step 1: Package Chaincode
```bash
cd blockchain/chaincode/nirikshak-audit
npm run build
peer lifecycle chaincode package nirikshak-audit.tar.gz \
  --path . \
  --lang node \
  --label nirikshak-audit_1.0
```

### Step 2: Install Chaincode on All Peers
```bash
peer lifecycle chaincode install nirikshak-audit.tar.gz
# Export PACKAGE_ID from output (e.g. nirikshak-audit_1.0:9fa3...)
```

### Step 3: Approve Chaincode Definition for Each Organization
```bash
peer lifecycle chaincode approveformyorg -o orderer1.nirikshak.local:7050 \
  --ordererTLSHostnameOverride orderer1.nirikshak.local \
  --channelID nirikshakchannel \
  --name nirikshak-audit \
  --version 1.0 \
  --package-id $CC_PACKAGE_ID \
  --sequence 1 \
  --tls --cafile $ORDERER_CA
```

### Step 4: Commit Chaincode Definition to Channel
```bash
peer lifecycle chaincode commit -o orderer1.nirikshak.local:7050 \
  --channelID nirikshakchannel \
  --name nirikshak-audit \
  --version 1.0 \
  --sequence 1 \
  --tls --cafile $ORDERER_CA \
  --peerAddresses peer0.government.nirikshak.local:7051 --tlsRootCertFiles $GOV_PEER_CA \
  --peerAddresses peer0.auditor.nirikshak.local:11051 --tlsRootCertFiles $AUDITOR_PEER_CA
```

---

## 4. Blockchain Outbox Worker Maintenance

The backend synchronization worker (`backend/src/workers/blockchainAnchor.worker.ts`) operates autonomously.

### 4.1 Checking Worker Health
To inspect worker throughput and queue depth in PostgreSQL:
```sql
SELECT 
    status, 
    COUNT(*), 
    MIN(created_at) AS oldest_pending,
    MAX(retry_count) AS max_retries
FROM blockchain_anchor_outbox
GROUP BY status;
```

### 4.2 Recovering Dead-Letter Items
Entries that reached 5 retries due to temporary network partition transition to `DEAD_LETTER`. Once network connectivity is restored:
```sql
-- Reset dead-letter entries for re-processing
UPDATE blockchain_anchor_outbox
SET status = 'PENDING',
    retry_count = 0,
    error_message = NULL,
    next_retry_at = NOW()
WHERE status = 'DEAD_LETTER';
```

---

## 5. Routine Diagnostic & Audit Verification Commands

### 5.1 Querying Channel Height
```bash
peer channel getinfo -c nirikshakchannel
```
*Output confirms current block height and blockchain hash of previous block.*

### 5.2 Checking Endorsement Liveness
```bash
curl -s http://localhost:3001/internal/health | jq .services.blockchain
```
*Output validates gRPC peer connectivity and connection profile status.*

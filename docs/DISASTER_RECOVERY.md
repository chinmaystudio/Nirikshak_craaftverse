# NIRIKSHAK Craftverse — Disaster Recovery & Business Continuity Plan

**Document Version:** 3.0.0  
**Effective Date:** 2026-10-03  
**Classification:** Institutional SRE / Enterprise Business Continuity Manual  
**Status:** **AUTHORITATIVE SPECIFICATION**

---

## 1. Objectives & Metrics

| Metric | Target SLA | Strategy to Achieve Target |
| :--- | :--- | :--- |
| **Recovery Point Objective (RPO)** | **< 5 minutes** (Operational DB)<br>**0 minutes** (Blockchain Ledger) | Supabase continuous Write-Ahead Log (WAL) archiving; Raft state machine replication across 3 independent physical zones. |
| **Recovery Time Objective (RTO)** | **< 60 minutes** (Full System Cold Start)<br>**< 5 minutes** (Single Node Failover) | Automated container orchestration (Kubernetes / Docker Swarm); Terraform infrastructure-as-code; automated cold-start runbooks. |

---

## 2. Backup & Replication Architecture

### 2.1 Database V2 (PostgreSQL)
- **Continuous WAL Archiving**: Every transaction is streamed to geo-redundant S3/GCS buckets.
- **Daily Base Backups**: Automated full physical database snapshots taken at 02:00 IST daily, retained for 90 days.
- **Point-in-Time Recovery (PITR)**: Enables rolling back database state to any specific microsecond within the retention window.

### 2.2 Hyperledger Fabric (Ledger & Blockchain State)
- **State Machine Replication**: The Raft consensus protocol ensures that as long as 2 of the 3 orderers are active, transactions commit without interruption.
- **Peer Ledger Storage**: Each peer maintains a local LevelDB/GoLevelDB state store and ledger file directory (`/var/hyperledger/production/ledgersData`).
- **Ledger Re-sync**: If a peer is completely destroyed, a fresh container can be launched with identical MSP certificates; it will automatically replay blocks from block 0 from neighboring peers.

---

## 3. Disaster Recovery Scenario Procedures

### Scenario A: Catastrophic Primary Cloud Outage (Full Regional Failover)

```
[Primary Region: ap-south-1 (Mumbai)]  ──(Failover)──►  [Secondary Region: ap-south-2 (Hyderabad)]
  - PostgreSQL Master                                     - PostgreSQL Hot Standby (Read-Replica)
  - Fabric Orderer 1 & Peer 0 (Gov)                       - Fabric Orderer 2 & Peer 0 (Contractor)
  - API Gateway Cluster                                   - Fabric Orderer 3 & Peer 0 (Auditor)
                                                          - Hot Standby API Gateway Cluster
```

#### Step 1: Promote Standby Database
```sql
-- On Hyderabad standby PostgreSQL instance
SELECT pg_promote();
```

#### Step 2: Redirect DNS & Edge Routing
Update Cloudflare / AWS Route 53 DNS records:
```
api.nirikshak.gov.in  ->  cname-hyderabad.nirikshak.gov.in (TTL: 60s)
portal.nirikshak.gov.in -> cname-hyderabad-cdn.nirikshak.gov.in
```

#### Step 3: Verify Fabric Raft Quorum
Since Orderer 2 and Orderer 3 reside in Hyderabad, 2/3 quorum is maintained:
```bash
docker exec orderer2.nirikshak.local peer channel getinfo -c nirikshakchannel
```

#### Step 4: Resume Outbox Worker Processing
```bash
kubectl scale deployment/nirikshak-blockchain-worker --replicas=3 -n nirikshak-prod
```
*Worker automatically drains any pending items from `blockchain_anchor_outbox`.*

---

### Scenario B: Peer Node Disk Corruption

If a peer's persistent volume is corrupted:
1. Stop the failing container:
   ```bash
   docker stop peer0.government.nirikshak.local
   ```
2. Remove the corrupted ledger volume:
   ```bash
   docker volume rm docker_peer0-gov-data
   ```
3. Re-create the volume and launch the peer container with valid MSP credentials.
4. The peer will discover peers via gossip protocol and automatically catch up all historical blocks from the channel:
   ```bash
   docker logs -f peer0.government.nirikshak.local | grep "Committed block"
   ```

---

## 4. Disaster Recovery Testing Cadence

1. **Bi-Annual Simulated Regional Failover**: Exercise database promotion and DNS switchover in staging environments.
2. **Monthly Backup Restoration Drill**: Test physical restoration of PostgreSQL base backups and verify schema integrity with `verify_production_schema_health()`.
3. **Weekly Peer Quorum Recovery Drill**: Temporarily terminate one orderer and one peer node; verify that transactions continue anchoring and peers recover state upon restart.

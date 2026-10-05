const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'supabase', 'migrations');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

// Classifications:
// 1. Core: purely core application (auth, tenancy, projects, procurement, contracts, milestones, progress, inspections, finance, documents, notifications, AI, non-fabric audit)
// 2. Blockchain-only: blockchain_anchors, blockchain_anchor_outbox, fabric RPC, claiming, recovery, blockchain RLS, outbox triggers
// 3. Mixed: contains both core application objects and blockchain objects

const classifications = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf-8');
  
  // Specific checks
  const hasBlockchainAnchors = /blockchain_anchors/i.test(content);
  const hasBlockchainOutbox = /blockchain_anchor_outbox/i.test(content);
  const hasEnqueueRpc = /enqueue_blockchain_anchor/i.test(content);
  const hasWorkerClaiming = /claim_blockchain_outbox_jobs|recover_stale_blockchain_jobs/i.test(content);
  const hasFabricText = /fabric/i.test(content);

  const isAnyBlockchain = hasBlockchainAnchors || hasBlockchainOutbox || hasEnqueueRpc || hasWorkerClaiming || hasFabricText;

  let category = 'CORE';
  let details = '';

  if (file === '060_blockchain_audit_schema.sql') {
    category = 'BLOCKCHAIN-ONLY';
    details = 'Creates public.blockchain_anchors table, indexes, and RLS';
  } else if (file === '061_blockchain_outbox.sql') {
    category = 'BLOCKCHAIN-ONLY';
    details = 'Creates public.blockchain_anchor_outbox table, indexes, and RLS';
  } else if (file === '062_blockchain_rls.sql') {
    category = 'BLOCKCHAIN-ONLY';
    details = 'Creates RLS policies on blockchain_anchors and blockchain_anchor_outbox';
  } else if (file === '063_blockchain_rpc_integration.sql') {
    category = 'BLOCKCHAIN-ONLY';
    details = 'Defines enqueue_blockchain_anchor RPC, trg_anchor_payment_recorded, trg_anchor_contract_awarded';
  } else if (file === '065_final_security_validation.sql') {
    category = 'MIXED';
    details = 'Defines verify_production_security_readiness(): safe table/view/RLS audit (lines 8-54, 78-80) + blockchain-dependent queries on blockchain_anchors & outbox (lines 56-57)';
  } else if (file === '066_blockchain_runtime_correctness.sql') {
    category = 'BLOCKCHAIN-ONLY';
    details = 'Alters blockchain_anchors payload_hash, updates enqueue_blockchain_anchor, recreates payment & contract triggers';
  } else if (file === '067_blockchain_rpc_lockdown.sql') {
    category = 'BLOCKCHAIN-ONLY';
    details = 'Revokes execution on enqueue_blockchain_anchor and blockchain triggers';
  } else if (file === '068_blockchain_worker_claiming.sql') {
    category = 'BLOCKCHAIN-ONLY';
    details = 'Defines claim_blockchain_outbox_jobs and recover_stale_blockchain_jobs';
  } else if (file === '072_final_zero_trust_validation.sql') {
    category = 'MIXED';
    details = 'trg_sync_dead_letter_anchor on blockchain_anchor_outbox (lines 10-35, blockchain) + verify_all_tables_rls_enabled() (lines 37-61, safe core RLS check)';
  } else if (file === '073_final_constraints_and_grants.sql') {
    category = 'MIXED';
    details = 'Privilege revokes/grants on gateway_sessions, mfa_challenges, user_mfa_factors (safe core auth) + blockchain_anchors, outbox (blockchain)';
  } else if (file === '076_final_security_privilege_lockdown.sql') {
    category = 'MIXED';
    details = 'Locks down user_mfa_factors table and elevate/revoke_gateway_session RPCs (safe core auth) + IF EXISTS checks on enqueue_blockchain_anchor and worker claiming RPCs (blockchain)';
  } else if (file === '077_blockchain_event_coverage.sql') {
    category = 'BLOCKCHAIN-ONLY';
    details = 'Adds outbox enqueue triggers calling enqueue_blockchain_anchor across 11 core tables';
  } else if (file === '078_final_security_diagnostics.sql') {
    category = 'CORE';
    details = 'Defines verify_system_security_posture(): validates public tables RLS, gateway_sessions and user_mfa_factors permission lockdown and zero plaintext tokens';
  } else if (isAnyBlockchain) {
    category = 'MIXED';
    details = 'Contains blockchain references';
  } else {
    category = 'CORE';
  }

  classifications.push({ file, category, details });
}

console.log(JSON.stringify(classifications, null, 2));
fs.writeFileSync(path.join(__dirname, 'classification_report.json'), JSON.stringify(classifications, null, 2));

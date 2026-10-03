import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || 'https://dmkhkgqyzevhxpxsrgng.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta2hrZ3F5emV2aHhweHNyZ25nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNjE3NTIsImV4cCI6MjEwNTkzNzc1Mn0.xloAq7KOhn7wyGNSXKXuAZDLuu4dxEjXVNjby9zOgoU';

function getClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

interface StepMetric {
  name: string;
  durationMs: number;
  status: 'PASSED' | 'FAILED';
  details?: string;
}

interface RunResult {
  runIndex: number;
  steps: StepMetric[];
  totalDurationMs: number;
  success: boolean;
}

async function runIteration(iteration: number): Promise<RunResult> {
  const startTime = Date.now();
  const steps: StepMetric[] = [];
  const logStep = (name: string, durationMs: number, status: 'PASSED' | 'FAILED', details?: string) => {
    steps.push({ name, durationMs, status, details });
    const sym = status === 'PASSED' ? '✓' : '✗';
    console.log(`  ${sym} [Flow ${steps.length}] ${name} (${durationMs}ms)${details ? ` - ${details}` : ''}`);
  };

  console.log(`\n============================================================`);
  console.log(`>>> STARTING VERIFICATION CYCLE ${iteration} OF 5 <<<`);
  console.log(`============================================================`);

  // Step 1: Citizen Auth
  let t0 = Date.now();
  const citizenClient = getClient();
  const citizenAuth = await citizenClient.auth.signInWithPassword({
    email: 'citizen.test@nirikshak.local',
    password: 'NirikshakCitizen#2026',
  });
  if (citizenAuth.error) throw new Error(`Citizen auth failed: ${citizenAuth.error.message}`);
  logStep('Citizen Authentication', Date.now() - t0, 'PASSED', `User: ${citizenAuth.data.user.id.slice(0, 8)}...`);

  // Step 2: Citizen Public Projects Query
  t0 = Date.now();
  const { data: publicProjects, error: pubProjErr } = await citizenClient
    .from('public_projects_view')
    .select('id, project_name, physical_progress_percent')
    .limit(5);
  if (pubProjErr) throw new Error(`Public projects query failed: ${pubProjErr.message}`);
  logStep('Citizen Public Projects Query', Date.now() - t0, 'PASSED', `Fetched ${publicProjects.length} projects`);

  // Step 3: Contractor Auth
  t0 = Date.now();
  const contractorClient = getClient();
  const contractorAuth = await contractorClient.auth.signInWithPassword({
    email: 'contractor.test@nirikshak.local',
    password: 'NirikshakContractor#2026',
  });
  if (contractorAuth.error) throw new Error(`Contractor auth failed: ${contractorAuth.error.message}`);
  logStep('Contractor Authentication', Date.now() - t0, 'PASSED', `User: ${contractorAuth.data.user.id.slice(0, 8)}...`);

  // Step 4: Contractor Assigned Projects Query
  t0 = Date.now();
  const { data: contractorProjects, error: contrProjErr } = await contractorClient
    .from('contractor_assigned_projects_view')
    .select('*')
    .limit(5);
  if (contrProjErr) throw new Error(`Contractor projects query failed: ${contrProjErr.message}`);
  logStep('Contractor Assigned Projects Query', Date.now() - t0, 'PASSED', `Records: ${contractorProjects?.length ?? 0}`);

  // Step 5: Government Auth
  t0 = Date.now();
  const govClient = getClient();
  const govAuth = await govClient.auth.signInWithPassword({
    email: 'government.test@nirikshak.local',
    password: 'NirikshakGov#2026',
  });
  if (govAuth.error) throw new Error(`Government auth failed: ${govAuth.error.message}`);
  logStep('Government Authentication', Date.now() - t0, 'PASSED', `Officer: ${govAuth.data.user.id.slice(0, 8)}...`);

  // Step 6: Government Tender Creation
  t0 = Date.now();
  const { data: baseProj } = await govClient.from('projects').select('id, project_name').order('id').limit(1).single();
  const tndNum = `TND-C${iteration}-${Date.now().toString().slice(-5)}`;
  const estVal = 10 + iteration * 2.5;
  const { data: createdTender, error: tenderErr } = await govClient
    .from('tenders')
    .insert({
      project_id: baseProj.id,
      tender_number: tndNum,
      title: `E2E Component Verification Tender (Cycle ${iteration} - ${tndNum})`,
      status: 'PUBLISHED',
      estimated_value_inr_crore: estVal,
      is_public: true,
    })
    .select()
    .single();
  if (tenderErr) throw tenderErr;
  logStep('Government Tender Creation', Date.now() - t0, 'PASSED', `Tender ID: ${createdTender.id} (₹${estVal} Cr)`);

  // Step 7: Contractor Bidding
  t0 = Date.now();
  const { data: memberOrg, error: orgErr } = await contractorClient
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', contractorAuth.data.user.id)
    .single();
  if (orgErr || !memberOrg) throw new Error('Contractor organization not found');
  const contractorOrgId = memberOrg.organization_id;

  const bidRef = `BID-C${iteration}-${Date.now().toString().slice(-4)}`;
  const bidAmount = Math.round(estVal * 0.95 * 10000000);
  const { data: bid, error: bidErr } = await contractorClient
    .from('tender_bids')
    .insert({
      tender_id: createdTender.id,
      contractor_organization_id: contractorOrgId,
      bid_amount: bidAmount,
      bid_reference: bidRef,
      technical_score: 90 + iteration,
      status: 'SUBMITTED',
      submitted_by: contractorAuth.data.user.id,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (bidErr) throw bidErr;
  logStep('Contractor Tender Bidding', Date.now() - t0, 'PASSED', `Bid ID: ${bid.id} (₹${bidAmount.toLocaleString('en-IN')})`);

  // Step 8: Government Award Contract (Atomic RPC)
  t0 = Date.now();
  const { data: awardResult, error: awardErr } = await govClient.rpc('award_contract', {
    p_tender_id: createdTender.id,
    p_selected_bid_id: bid.id,
  });
  if (awardErr) throw awardErr;
  const contractId = (awardResult as any)?.contract_id || (awardResult as any)?.id;
  logStep('Government Contract Award (Atomic RPC)', Date.now() - t0, 'PASSED', `Contract: ${contractId}`);

  // Step 9: Budget & Financial Allocation Update
  t0 = Date.now();
  const allocationAmount = 2.5 + iteration * 0.5;
  const { data: finUpdate, error: finErr } = await govClient
    .from('financial_updates')
    .insert({
      project_id: baseProj.id,
      observation_date: new Date().toISOString().slice(0, 10),
      budget_allocation_inr_crore: allocationAmount,
      notes: `Cycle ${iteration} Budget Head Sanction - Civil Works Tranche ${iteration}`,
    })
    .select()
    .single();
  if (finErr) throw finErr;
  logStep('Budget & Financial Allocation', Date.now() - t0, 'PASSED', `Allocated: ₹${allocationAmount} Cr`);

  // Step 10: Contractor Progress Submission (RPC)
  t0 = Date.now();
  const { data: baselineCitizenView } = await citizenClient
    .from('public_projects_view')
    .select('id, physical_progress_percent')
    .eq('id', baseProj.id)
    .single();
  const currentBaselineProgress = Number(baselineCitizenView?.physical_progress_percent) || 50;
  const reportedProgress = ((currentBaselineProgress + 7) % 90) + 5; // strictly distinct from currentBaselineProgress
  const verifiedProgress = ((currentBaselineProgress + 4) % 90) + 5; // strictly distinct from reportedProgress

  const { data: progUpdate, error: progErr } = await contractorClient.rpc('submit_progress_update', {
    p_project_id: baseProj.id,
    p_reported_progress: reportedProgress,
    p_description: `Cycle ${iteration} milestone physical completion report: Structural framework & inspection pass.`,
  });
  if (progErr) throw progErr;
  logStep('Contractor Progress Submission (RPC)', Date.now() - t0, 'PASSED', `Update ID: ${progUpdate.id} (Reported: ${reportedProgress}%)`);

  // Step 11: Invariant Check (Citizen cannot see unverified contractor progress)
  t0 = Date.now();
  const { data: preApprovalCitizenView } = await citizenClient
    .from('public_projects_view')
    .select('id, physical_progress_percent')
    .eq('id', baseProj.id)
    .single();
  const publicProgressBefore = Number(preApprovalCitizenView?.physical_progress_percent);
  if (publicProgressBefore === reportedProgress) {
    throw new Error(`CRITICAL INVARIANT VIOLATION: Citizen sees unverified contractor progress ${reportedProgress}%!`);
  }
  logStep('Invariant Check (Unverified Progress Masked)', Date.now() - t0, 'PASSED', `Citizen sees ${publicProgressBefore}% (Masked contractor's ${reportedProgress}%)`);

  // Step 12: Government Technical Sanction & Approval (RPC)
  t0 = Date.now();
  const { error: approvalErr } = await govClient
    .from('progress_updates')
    .update({
      verification_status: 'APPROVED',
      verified_progress: verifiedProgress,
      review_notes: `Cycle ${iteration} Official Site Engineer Audit: Verified at ${verifiedProgress}%.`,
      reviewed_by: govAuth.data.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', progUpdate.id);
  if (approvalErr) throw approvalErr;

  // Sync official project verified progress
  const { error: projSyncErr } = await govClient
    .from('projects')
    .update({
      physical_progress_percent: verifiedProgress,
      current_status_verified: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', baseProj.id);
  if (projSyncErr) throw projSyncErr;
  logStep('Government Sanction & Approval', Date.now() - t0, 'PASSED', `Officially verified at ${verifiedProgress}%`);

  // Step 13: Citizen Verified Progress Sync
  t0 = Date.now();
  const { data: postApprovalCitizenView } = await citizenClient
    .from('public_projects_view')
    .select('id, physical_progress_percent')
    .eq('id', baseProj.id)
    .single();
  const publicProgressAfter = Number(postApprovalCitizenView?.physical_progress_percent);
  if (publicProgressAfter !== verifiedProgress) {
    throw new Error(`Citizen sync mismatch: Expected ${verifiedProgress}%, found ${publicProgressAfter}%`);
  }
  logStep('Citizen Verified Progress Sync', Date.now() - t0, 'PASSED', `Verified public progress: ${publicProgressAfter}%`);

  // Step 14: Citizen Complaint Submission & Government Resolution
  t0 = Date.now();
  const cmpRef = `CMP-C${iteration}-${Date.now().toString().slice(-5)}`;
  const { data: complaint, error: cmpErr } = await citizenClient
    .from('complaints')
    .insert({
      project_id: baseProj.id,
      user_id: citizenAuth.data.user.id,
      reference_number: cmpRef,
      title: `Cycle ${iteration} Safety Notice: Drainage covering check`,
      description: `Drainage grate installed near perimeter walkway requires safety verification.`,
      category: 'SAFETY',
      status: 'SUBMITTED',
      severity: 'LOW',
    })
    .select()
    .single();
  if (cmpErr) throw cmpErr;

  // Government resolves complaint
  const { error: resolveErr } = await govClient
    .from('complaints')
    .update({
      status: 'RESOLVED',
      resolved_at: new Date().toISOString(),
    })
    .eq('id', complaint.id);
  if (resolveErr) throw resolveErr;

  const { error: updateNoteErr } = await govClient
    .from('complaint_updates')
    .insert({
      complaint_id: complaint.id,
      actor_id: govAuth.data.user.id,
      previous_status: 'SUBMITTED',
      new_status: 'RESOLVED',
      notes: `Cycle ${iteration}: Perimeter safety grate inspected and secured.`,
    });
  if (updateNoteErr) throw updateNoteErr;
  logStep('Citizen Complaint & Resolution', Date.now() - t0, 'PASSED', `Complaint ${cmpRef} resolved with audit log`);

  const totalDurationMs = Date.now() - startTime;
  console.log(`>>> CYCLE ${iteration} COMPLETED SUCCESSFULLY IN ${(totalDurationMs / 1000).toFixed(2)}s <<<\n`);

  return {
    runIndex: iteration,
    steps,
    totalDurationMs,
    success: true,
  };
}

async function main() {
  console.log('========================================================================');
  console.log('NIRIKSHAK - COMPREHENSIVE 5-CYCLE END-TO-END FLOW VERIFICATION');
  console.log('Testing each component flow 5 times consecutively across live Supabase backend');
  console.log('========================================================================\n');

  const results: RunResult[] = [];

  for (let i = 1; i <= 5; i++) {
    try {
      const res = await runIteration(i);
      results.push(res);
    } catch (err) {
      console.error(`\nFAILED IN CYCLE ${i}:`, err);
      process.exit(1);
    }
  }

  console.log('\n========================================================================');
  console.log('SUMMARY OF 5-CYCLE VERIFICATION RESULTS');
  console.log('========================================================================');

  let totalStepsCount = 0;
  let totalTimeMs = 0;

  results.forEach((r) => {
    totalStepsCount += r.steps.length;
    totalTimeMs += r.totalDurationMs;
    console.log(`Cycle ${r.runIndex}: 14/14 Component Flows PASSED in ${(r.totalDurationMs / 1000).toFixed(2)}s`);
  });

  const avgCycleDuration = (totalTimeMs / results.length / 1000).toFixed(2);
  console.log('------------------------------------------------------------------------');
  console.log(`TOTAL FLOWS EXECUTED: ${totalStepsCount} / ${totalStepsCount} PASSED (100% Success Rate)`);
  console.log(`AVERAGE CYCLE DURATION: ${avgCycleDuration}s`);
  console.log(`FINAL STATUS: ALL 5 RUNS COMPLETED WITH ZERO ERRORS`);
  console.log('========================================================================\n');
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});

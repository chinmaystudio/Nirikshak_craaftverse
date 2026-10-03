import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

function getClient(accessToken?: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
  });
}

interface SecurityCheckResult {
  testName: string;
  roleTested: string;
  expectedOutcome: string;
  actualOutcome: string;
  pass: boolean;
}

async function runSecurityTests() {
  console.log('=== NIRIKSHAK AUTOMATED RLS & SECURITY TEST SUITE ===\n');
  const results: SecurityCheckResult[] = [];

  // 1. Authenticate actors with dedicated clients
  const anonClient = getClient();

  const citizenAuthClient = getClient();
  const citizenAuth = await citizenAuthClient.auth.signInWithPassword({
    email: 'citizen.test@nirikshak.local',
    password: 'NirikshakCitizen#2026',
  });
  const citizenClient = getClient(citizenAuth.data.session?.access_token);

  const contractorAuthClient = getClient();
  const contractorAuth = await contractorAuthClient.auth.signInWithPassword({
    email: 'contractor.test@nirikshak.local',
    password: 'NirikshakContractor#2026',
  });
  const contractorClient = getClient(contractorAuth.data.session?.access_token);

  const govAuthClient = getClient();
  const govAuth = await govAuthClient.auth.signInWithPassword({
    email: 'government.test@nirikshak.local',
    password: 'NirikshakGov#2026',
  });
  const govClient = getClient(govAuth.data.session?.access_token);

  // Test 1: Anonymous cannot read ai_jobs
  console.log('Test 1: Anonymous cannot read internal ai_jobs...');
  const { data: anonJobs, error: anonJobErr } = await anonClient.from('ai_jobs').select('*');
  const test1Pass = (anonJobs === null || anonJobs.length === 0) || !!anonJobErr;
  results.push({
    testName: 'Anonymous read ai_jobs blocked',
    roleTested: 'Anonymous',
    expectedOutcome: 'Empty array or error',
    actualOutcome: anonJobErr ? anonJobErr.message : `Returned ${anonJobs?.length ?? 0} rows`,
    pass: test1Pass,
  });
  console.log(test1Pass ? '✓ PASS' : '❌ FAIL');

  // Test 2: Anonymous cannot read audit_logs
  console.log('Test 2: Anonymous cannot read audit_logs...');
  const { data: anonAudit, error: anonAuditErr } = await anonClient.from('audit_logs').select('*');
  const test2Pass = (anonAudit === null || anonAudit.length === 0) || !!anonAuditErr;
  results.push({
    testName: 'Anonymous read audit_logs blocked',
    roleTested: 'Anonymous',
    expectedOutcome: 'Empty array or error',
    actualOutcome: anonAuditErr ? anonAuditErr.message : `Returned ${anonAudit?.length ?? 0} rows`,
    pass: test2Pass,
  });
  console.log(test2Pass ? '✓ PASS' : '❌ FAIL');

  // Test 3: Citizen cannot insert directly into contracts
  console.log('Test 3: Citizen cannot insert contract...');
  const { error: citizenContractErr } = await citizenClient.from('contracts').insert({
    project_id: '462bd960-a17f-4c11-8e7a-ea723bc3e861',
    contract_number: 'ILLEGAL-CONTRACT-001',
    contract_title: 'Unauthorized Contract Injection',
    contract_value: 999999999,
  });
  const test3Pass = !!citizenContractErr;
  results.push({
    testName: 'Citizen contract insert blocked',
    roleTested: 'Citizen',
    expectedOutcome: 'RLS violation error',
    actualOutcome: citizenContractErr ? citizenContractErr.message : 'Inserted successfully (FAIL)',
    pass: test3Pass,
  });
  console.log(test3Pass ? '✓ PASS' : '❌ FAIL');

  // Test 4: Contractor cannot directly alter verified_progress in progress_updates
  console.log('Test 4: Contractor cannot forge verified_progress...');
  const { data: anyProgress } = await govClient.from('progress_updates').select('id').limit(1).single();
  let test4Pass = false;
  let test4Outcome = 'No progress record available';
  if (anyProgress) {
    const { data: updatedRows, error: contractorForgeErr } = await contractorClient
      .from('progress_updates')
      .update({ verified_progress: 100, verification_status: 'APPROVED' })
      .eq('id', anyProgress.id)
      .select();
    
    // In PostgREST, RLS-blocked updates return either an error or 0 affected rows
    if (contractorForgeErr || !updatedRows || updatedRows.length === 0) {
      test4Pass = true;
      test4Outcome = contractorForgeErr ? contractorForgeErr.message : 'Blocked by RLS (0 rows updated)';
    } else {
      test4Pass = false;
      test4Outcome = `Forged update succeeded: modified ${updatedRows.length} rows (FAIL)`;
    }
  }
  results.push({
    testName: 'Contractor verified_progress forge blocked',
    roleTested: 'Contractor',
    expectedOutcome: 'RLS or policy violation error',
    actualOutcome: test4Outcome,
    pass: test4Pass,
  });
  console.log(test4Pass ? '✓ PASS' : '❌ FAIL');

  // Test 5: Contractor cannot execute award_contract RPC
  console.log('Test 5: Contractor cannot execute award_contract RPC...');
  const { error: contractorAwardErr } = await contractorClient.rpc('award_contract', {
    p_tender_id: '3ee1fbfa-5e6c-48dd-b01f-085c15921664',
    p_selected_bid_id: '2139e05d-80cd-4037-adf2-127b26999947',
  });
  const test5Pass = !!contractorAwardErr;
  results.push({
    testName: 'Contractor award_contract RPC blocked',
    roleTested: 'Contractor',
    expectedOutcome: 'Unauthorized error',
    actualOutcome: contractorAwardErr ? contractorAwardErr.message : 'Executed successfully (FAIL)',
    pass: test5Pass,
  });
  console.log(test5Pass ? '✓ PASS' : '❌ FAIL');

  // Test 6: Citizen cannot execute award_contract RPC
  console.log('Test 6: Citizen cannot execute award_contract RPC...');
  const { error: citizenAwardErr } = await citizenClient.rpc('award_contract', {
    p_tender_id: '3ee1fbfa-5e6c-48dd-b01f-085c15921664',
    p_selected_bid_id: '2139e05d-80cd-4037-adf2-127b26999947',
  });
  const test6Pass = !!citizenAwardErr;
  results.push({
    testName: 'Citizen award_contract RPC blocked',
    roleTested: 'Citizen',
    expectedOutcome: 'Unauthorized error',
    actualOutcome: citizenAwardErr ? citizenAwardErr.message : 'Executed successfully (FAIL)',
    pass: test6Pass,
  });
  console.log(test6Pass ? '✓ PASS' : '❌ FAIL');

  // Test 7: Citizen cannot submit progress update via submit_progress_update RPC
  console.log('Test 7: Citizen cannot submit progress update RPC...');
  const { error: citizenProgErr } = await citizenClient.rpc('submit_progress_update', {
    p_project_id: '462bd960-a17f-4c11-8e7a-ea723bc3e861',
    p_reported_progress: 50,
    p_description: 'Citizen forged progress report',
  });
  const test7Pass = !!citizenProgErr;
  results.push({
    testName: 'Citizen submit_progress_update blocked',
    roleTested: 'Citizen',
    expectedOutcome: 'Unauthorized error',
    actualOutcome: citizenProgErr ? citizenProgErr.message : 'Executed successfully (FAIL)',
    pass: test7Pass,
  });
  console.log(test7Pass ? '✓ PASS' : '❌ FAIL');

  // Test 8: Anonymous cannot create complaints
  console.log('Test 8: Anonymous cannot create complaints without auth...');
  const { error: anonCompErr } = await anonClient.from('complaints').insert({
    project_id: '462bd960-a17f-4c11-8e7a-ea723bc3e861',
    title: 'Anon spam complaint',
    description: 'Anonymous spamming attack vector',
    category: 'SAFETY',
  });
  const test8Pass = !!anonCompErr;
  results.push({
    testName: 'Anonymous complaint insertion blocked',
    roleTested: 'Anonymous',
    expectedOutcome: 'RLS violation error',
    actualOutcome: anonCompErr ? anonCompErr.message : 'Inserted anonymously (FAIL)',
    pass: test8Pass,
  });
  console.log(test8Pass ? '✓ PASS' : '❌ FAIL');

  // Test 9: Citizen can read public_projects_view
  console.log('Test 9: Citizen can query public_projects_view...');
  const { data: pubData, error: pubErr } = await citizenClient.from('public_projects_view').select('id').limit(1);
  const test9Pass = !pubErr && pubData !== null;
  results.push({
    testName: 'Citizen reads public_projects_view allowed',
    roleTested: 'Citizen',
    expectedOutcome: 'Success with data',
    actualOutcome: pubErr ? pubErr.message : `Read ${pubData?.length ?? 0} rows`,
    pass: test9Pass,
  });
  console.log(test9Pass ? '✓ PASS' : '❌ FAIL');

  // Test 10: Service role / sensitive environment checks
  console.log('Test 10: Verify frontend build does not leak service-role key...');
  // Frontend bundle scan
  const fs = await import('fs');
  const path = await import('path');
  const distDir = path.resolve('../frontend/dist');
  let leaked = false;
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(path.join(distDir, 'assets'));
    for (const f of files) {
      if (f.endsWith('.js')) {
        const content = fs.readFileSync(path.join(distDir, 'assets', f), 'utf8');
        if (content.includes('service_role') || (process.env.SUPABASE_SERVICE_ROLE_KEY && content.includes(process.env.SUPABASE_SERVICE_ROLE_KEY))) {
          leaked = true;
          break;
        }
      }
    }
  }
  const test10Pass = !leaked;
  results.push({
    testName: 'Service role key absent from frontend bundle',
    roleTested: 'Build Artifact',
    expectedOutcome: 'Key not found in dist chunks',
    actualOutcome: leaked ? 'Service key detected in bundle (CRITICAL)' : 'Zero secret leakage detected',
    pass: test10Pass,
  });
  console.log(test10Pass ? '✓ PASS' : '❌ FAIL');

  console.log('\n=== RLS TEST SUMMARY ===');
  console.table(results);

  const allPassed = results.every((r) => r.pass);
  console.log(`\nResult: ${results.filter((r) => r.pass).length}/${results.length} security checks PASSED.`);
  if (!allPassed) {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error('Security test suite execution failed:', err);
  process.exit(1);
});

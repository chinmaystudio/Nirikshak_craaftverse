import assert from 'assert';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Enforce non-blockchain development configuration
process.env.BLOCKCHAIN_ENABLED = 'false';
process.env.BLOCKCHAIN_MODE = 'development';
process.env.NODE_ENV = 'development';
process.env.PORT = '4005';
process.env.INTERNAL_HEALTH_SECRET = 'development-internal-health-secret-32-chars';
process.env.SESSION_TOKEN_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.MFA_ENCRYPTION_KEY = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';

async function main() {
  console.log('============================================================');
  console.log('NIRIKSHAK NON-BLOCKCHAIN BACKEND INTEGRATION TEST SUITE');
  console.log('============================================================\n');

  const { app } = await import('../src/app.js');
  const { fabricClient } = await import('../src/modules/blockchain/blockchain.client.js');
  const { supabaseAdmin } = await import('../src/core/database/supabase.js');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(4005, resolve));
  const baseUrl = 'http://127.0.0.1:4005';

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✔ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Requirement 10: Blockchain Isolation Check
    // -------------------------------------------------------------
    await test('Blockchain Isolation: Hyperledger Fabric disabled without worker', async () => {
      const connected = await fabricClient.connect();
      assert.strictEqual(connected, false, 'connect() should return false when disabled');
      assert.strictEqual(fabricClient.getState(), 'DISABLED', 'State should be DISABLED');
      assert.strictEqual(fabricClient.isMockAllowed(), false, 'Mock should not be allowed');
    });

    // -------------------------------------------------------------
    // Health & Private Diagnostics
    // -------------------------------------------------------------
    await test('Diagnostics: /internal/health responds with status ok', async () => {
      const res = await fetch(`${baseUrl}/internal/health`, {
        headers: { 'x-internal-secret': process.env.INTERNAL_HEALTH_SECRET! },
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.status, 'ok');
    });

    // -------------------------------------------------------------
    // 1. Authentication & Users
    // -------------------------------------------------------------
    let csrfToken = '';
    let csrfCookie = '';
    await test('Authentication: Obtain CSRF token from /api/auth/csrf', async () => {
      const res = await fetch(`${baseUrl}/api/auth/csrf`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert(body.data?.csrfToken, 'Should return csrfToken');
      csrfToken = body.data.csrfToken;
      const setCookies = res.headers.getSetCookie();
      const match = setCookies.find((c) => c.startsWith('nirikshak_csrf='));
      if (match) csrfCookie = match.split(';')[0];
    });

    await test('Authentication: Unauthenticated request rejected with 401', async () => {
      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.strictEqual(body.error?.code, 'UNAUTHORIZED');
    });

    // Provision test officer user in Supabase Auth & link to PMC org
    const testEmail = `officer.test.${Date.now()}@nirikshak.gov.in`;
    const testPassword = 'Password123!Secure';
    const orgId = '11111111-1111-1111-1111-111111111111'; // Pune Municipal Corporation

    let testUserId = '';
    await test('Authentication & Tenancy: Provision test Government Officer user', async () => {
      const { data: user, error: uErr } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: { full_name: 'Pune Project Officer' },
      });
      assert(!uErr && user?.user?.id, `User creation failed: ${uErr?.message}`);
      testUserId = user.user.id;

      const { error: mErr } = await supabaseAdmin.from('organization_members').insert({
        organization_id: orgId,
        user_id: testUserId,
        role: 'project_officer',
        status: 'active',
      });
      assert(!mErr, `Membership creation failed: ${mErr?.message}`);
    });

    let sessionCookie = '';
    let authHeaders: Record<string, string> = {};

    await test('Authentication: Login via POST /api/auth/login and establish session', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          Cookie: csrfCookie,
          Origin: 'http://localhost:5173',
        },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });
      assert.strictEqual(res.status, 200, `Login failed: status ${res.status}`);
      const body = await res.json();
      assert(body.data?.user?.id, 'Login should return user info');
      assert.strictEqual(body.data.user.role, 'project_officer');

      const setCookies = res.headers.getSetCookie();
      const rawSession = setCookies.find((c) => c.startsWith('nirikshak_session='));
      const rawCsrf = setCookies.find((c) => c.startsWith('nirikshak_csrf='));
      sessionCookie = rawSession ? rawSession.split(';')[0] : '';
      const loginCsrf = rawCsrf ? rawCsrf.split(';')[0] : csrfCookie;
      if (body.data?.csrfToken) csrfToken = body.data.csrfToken;

      // Mark session as MFA verified for testing elevated endpoints
      await supabaseAdmin.from('gateway_sessions').update({ mfa_verified: true }).eq('user_id', testUserId);

      authHeaders = {
        'Content-Type': 'application/json',
        Cookie: `${sessionCookie}; ${loginCsrf}`,
        'X-CSRF-Token': csrfToken,
        Origin: 'http://localhost:5173',
      };
    });

    await test('Authentication: Verify session via GET /api/auth/session', async () => {
      const res = await fetch(`${baseUrl}/api/auth/session`, { headers: authHeaders });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.data?.user?.email, testEmail);
      assert.strictEqual(body.data?.user?.role, 'project_officer');
    });

    // -------------------------------------------------------------
    // 2. Organizations & Tenancy
    // -------------------------------------------------------------
    await test('Tenancy: Organization context bound to Government organization', async () => {
      const res = await fetch(`${baseUrl}/api/auth/session`, { headers: authHeaders });
      const body = await res.json();
      assert.strictEqual(body.data?.user?.organizationId, orgId);
      assert(body.data?.user?.organizationName, 'Should have organization name');
    });

    // -------------------------------------------------------------
    // 3. Projects: Project Creation & Retrieval
    // -------------------------------------------------------------
    let testProjectId = '';
    const uniqueProjectCode = `NIR-PUNE-${Date.now().toString().slice(-6)}`;
    await test('Projects: Create new public infrastructure project', async () => {
      const projectPayload = {
        nirikshak_project_id: uniqueProjectCode,
        project_name: 'Pune Metro Line 4 Extension',
        sector: 'Urban Transport',
        project_authority: 'Pune Municipal Corporation',
        state: 'Maharashtra',
        city: 'Pune',
        location_text: 'Shivajinagar to Hinjawadi Phase 3',
        total_cost_inr_crore: 825.5,
        planned_start_date: '2026-06-01',
        original_completion_date: '2029-05-31',
        is_public: true,
      };

      const res = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(projectPayload),
      });

      assert([200, 201].includes(res.status), `Create project failed with status ${res.status}`);
      const body = await res.json();
      const proj = body.data?.project || body.data;
      assert(proj?.id, 'Created project should have an id');
      testProjectId = proj.id;
    });

    await test('Projects & Tenancy: Query project catalog and verify created project', async () => {
      const res = await fetch(`${baseUrl}/api/projects?limit=10`, { headers: authHeaders });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      const list = body.data?.projects || body.data;
      assert(Array.isArray(list), 'Should return projects array');
      assert(list.length > 0, 'Catalog should contain projects');
    });

    await test('Projects: Query single project by id', async () => {
      const res = await fetch(`${baseUrl}/api/projects/${testProjectId}`, { headers: authHeaders });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      const proj = body.data?.project || body.data;
      assert.strictEqual(proj.id, testProjectId);
    });

    // -------------------------------------------------------------
    // 4. Procurement & Tenders
    // -------------------------------------------------------------
    await test('Procurement: Publish tender for project', async () => {
      const tenderPayload = {
        project_id: testProjectId,
        title: 'Civil Works Package 01 - Viaduct & Stations',
        description: 'Design and construction of elevated viaduct and 8 stations',
        estimated_value_inr_crore: 350.0,
        mode: 'e-Tender',
      };

      const res = await fetch(`${baseUrl}/api/tenders`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(tenderPayload),
      });

      assert([200, 201].includes(res.status), `Publish tender status: ${res.status}`);
      const body = await res.json();
      assert(body.data !== undefined, 'Tender response should contain data');
    });

    // -------------------------------------------------------------
    // 5. Contracts
    // -------------------------------------------------------------
    await test('Contracts: Query contracts scoped to project', async () => {
      const res = await fetch(`${baseUrl}/api/contracts/project/${testProjectId}`, { headers: authHeaders });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      const contracts = body.data?.contracts || body.data;
      assert(Array.isArray(contracts), 'Contracts should be an array');
    });

    // -------------------------------------------------------------
    // 6. Milestones & Progress
    // -------------------------------------------------------------
    await test('Milestones: Create milestone for project', async () => {
      const milestonePayload = {
        project_id: testProjectId,
        milestone_code: 'MS-01',
        title: 'Piling & Substructure Completion',
        sequence_number: 1,
        weight_percentage: 25,
        planned_completion_date: '2027-01-31',
      };

      const res = await fetch(`${baseUrl}/api/milestones`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(milestonePayload),
      });

      assert([200, 201].includes(res.status), `Create milestone status: ${res.status}`);
    });

    await test('Milestones: Query project milestones list', async () => {
      const res = await fetch(`${baseUrl}/api/milestones/project/${testProjectId}`, { headers: authHeaders });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      const list = body.data?.milestones || body.data;
      assert(Array.isArray(list), 'Milestones list should be an array');
      assert(list.length >= 1, 'Should contain created milestone');
    });

    await test('Progress: Review progress endpoint execution', async () => {
      const res = await fetch(`${baseUrl}/api/progress/review`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          progress_update_id: '00000000-0000-0000-0000-000000000001',
          decision: 'APPROVED',
          review_notes: 'Initial progress verified by Pune Project Officer.',
        }),
      });
      // 400 (not found validation error), 404, or 200 confirms route and auth handling
      assert([200, 400, 404].includes(res.status), `Unexpected status ${res.status}`);
    });

    // -------------------------------------------------------------
    // 7. Inspections
    // -------------------------------------------------------------
    await test('Inspections: Schedule inspection for project', async () => {
      const inspectionPayload = {
        project_id: testProjectId,
        inspection_type: 'Structural Integrity',
        scheduled_date: '2026-11-20',
        summary: 'Baseline structural alignment and piling foundation verification',
      };

      const res = await fetch(`${baseUrl}/api/inspections`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(inspectionPayload),
      });

      assert([200, 201].includes(res.status), `Schedule inspection status: ${res.status}`);
    });

    await test('Inspections: Query scheduled inspections for project', async () => {
      const res = await fetch(`${baseUrl}/api/inspections/project/${testProjectId}`, { headers: authHeaders });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      const inspections = body.data?.inspections || body.data;
      assert(Array.isArray(inspections), 'Inspections should be an array');
      assert(inspections.length >= 1, 'Should contain scheduled inspection');
    });

    // -------------------------------------------------------------
    // 8. Finance & Payments
    // -------------------------------------------------------------
    await test('Finance: Query project finance summary', async () => {
      const res = await fetch(`${baseUrl}/api/finance/project/${testProjectId}/summary`, { headers: authHeaders });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert(body.data !== undefined, 'Finance summary should return data');
    });

    await test('Finance: Query project payment claims', async () => {
      const res = await fetch(`${baseUrl}/api/finance/project/${testProjectId}/claims`, { headers: authHeaders });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      const claims = body.data?.claims || body.data;
      assert(Array.isArray(claims), 'Claims should be an array');
    });

    // -------------------------------------------------------------
    // 9. Documents
    // -------------------------------------------------------------
    await test('Documents: Query project documents', async () => {
      const res = await fetch(`${baseUrl}/api/documents/project/${testProjectId}`, { headers: authHeaders });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      const docs = body.data?.documents || body.data;
      assert(Array.isArray(docs), 'Documents should be an array');
    });

    // -------------------------------------------------------------
    // 10. Notifications
    // -------------------------------------------------------------
    await test('Notifications: Query user notifications and unread count', async () => {
      const resList = await fetch(`${baseUrl}/api/notifications`, { headers: authHeaders });
      assert.strictEqual(resList.status, 200);
      const bodyList = await resList.json();
      const list = bodyList.data?.notifications || bodyList.data;
      assert(Array.isArray(list), 'Notifications should be an array');

      const resCount = await fetch(`${baseUrl}/api/notifications/unread-count`, { headers: authHeaders });
      assert.strictEqual(resCount.status, 200);
      const bodyCount = await resCount.json();
      const countVal = bodyCount.data?.unread_count ?? bodyCount.data?.unreadCount ?? bodyCount.data;
      assert(typeof countVal === 'number', `Expected number but got ${typeof countVal}`);
    });

    // -------------------------------------------------------------
    // 11. AI Routes
    // -------------------------------------------------------------
    await test('AI Routes: Trigger /api/ai/analyze safely without blockchain dependency', async () => {
      const res = await fetch(`${baseUrl}/api/ai/analyze/${testProjectId}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({}),
      });

      // In dev mode when python AI backend service is not running locally, returns 502/503 gracefully, or 200 if active
      assert([200, 502, 503].includes(res.status), `Unexpected status ${res.status}`);
      const body = await res.json();
      assert(body !== null, 'Response should be valid JSON');
    });

    // Cleanup created test project & user session
    await supabaseAdmin.from('projects').delete().eq('id', testProjectId);
    await supabaseAdmin.from('gateway_sessions').delete().eq('user_id', testUserId);
    await supabaseAdmin.auth.admin.deleteUser(testUserId);
  } finally {
    server.close();
  }

  console.log('\n============================================================');
  console.log(`NON-BLOCKCHAIN INTEGRATION RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

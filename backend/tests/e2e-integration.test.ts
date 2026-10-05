process.env.PORT = '4002';
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://mock-test.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'mock-anon-key-for-test-suite';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key-for-test-suite';
process.env.AI_SERVICE_URL = 'http://127.0.0.1:8000';
process.env.AI_SERVICE_SHARED_SECRET = ''; // Match default dev secret
process.env.AI_SERVICE_TIMEOUT_MS = '30000';

import assert from 'assert';

function reportPass(name: string) {
  console.log(`  [PASS] ${name}`);
}

function reportFail(name: string, error: any) {
  console.error(`  [FAIL] ${name}`);
  console.error(`    ${error.message}`);
}

async function runE2eTests() {
  console.log('\n============================================================');
  console.log('NIRIKSHAK END-TO-END EXPRESS <-> PYTHON AI INTEGRATION TEST');
  console.log('============================================================\n');

  const { aiClient } = await import('../src/modules/ai/ai.client.js');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      reportPass(name);
      passed++;
    } catch (err: any) {
      reportFail(name, err);
      failed++;
    }
  }

  // 1. Health check via Express aiClient
  await test('Express AI Client: GET /health communicates with Python AI microservice', async () => {
    const health = await aiClient.healthCheck();
    assert.strictEqual(health.status, 'ok', 'Status should be ok');
    assert.strictEqual(health.historical_model, 'READY', 'Historical ML should be READY');
    assert.strictEqual(health.online_model, 'READY', 'Online drift model should be READY');
    assert.strictEqual(health.rl_policy, 'READY', 'LinUCB bandit policy should be READY');
    console.log('    Microservice Status:', JSON.stringify(health));
  });

  // 2. Full project analysis via Express aiClient
  let analysisId = '';
  let recommendedAction = '';
  await test('Express AI Client: POST /analyze runs ML + Drift + LinUCB + OpenRouter pipeline', async () => {
    const mockSnapshot = {
      project: {
        provenance: 'DATABASE_FACT',
        project_id: 'proj-e2e-001',
        nirikshak_project_id: 'NIR-PUN-2026-E2E',
        project_name: 'Pune Metro Line 4 Elevated Corridor',
        sector: 'Transport',
        subsector: 'Metro Rail',
        authority: 'Maha Metro Rail Corporation',
        location: 'Pune, Maharashtra',
        total_cost_inr_crore: 2850.0,
        award_date: '2024-03-15',
        planned_start_date: '2024-04-01',
        planned_completion_date: '2027-03-31',
        normalized_status: 'IN_EXECUTION',
      },
      contractor_reported: {
        provenance: 'CONTRACTOR_REPORTED',
        contractor_reported_progress_pct: 34.5,
        reported_at: '2026-03-01T10:00:00Z',
        completed_work: 'Pier foundation and girder staging on Reach 2 completed.',
        challenges: 'Traffic diversion permissions pending at Swargate junction.',
        resource_shortage_ratio: 0.15,
        evidence_count: 8,
      },
      government_verified: {
        provenance: 'GOVERNMENT_VERIFIED',
        government_verified_progress_pct: 32.0,
        verified_at: '2026-03-05T14:30:00Z',
        verified_by_role: 'Executive Engineer',
        planned_progress_pct: 42.0,
        schedule_variance_days: 45,
        inspection_defects: 2,
      },
      finance: {
        provenance: 'DATABASE_FACT',
        sanctioned_amount: 2850.0,
        amount_spent: 980.5,
        financial_progress: 34.4,
        cost_variance_pct: 6.8,
      },
      complaints: {
        provenance: 'DATABASE_FACT',
        open_complaints: 4,
        high_severity_complaints: 1,
      },
      inspections: {
        provenance: 'DATABASE_FACT',
        inspections_count: 5,
        defects_count: 2,
      },
      metadata: {
        provenance: 'DATABASE_FACT',
        created_at: new Date().toISOString(),
      },
    };

    const result = await aiClient.analyzeProject(mockSnapshot);
    assert(result.analysis_id, 'Result must contain UUID analysis_id');
    analysisId = result.analysis_id;
    recommendedAction = result.recommended_actions[0]?.action || '';

    assert(result.historical_analysis, 'Must contain historical ML analysis');
    assert(result.historical_analysis.review_priority_score >= 0, 'Must have valid review priority score');
    assert(result.historical_analysis.review_band, 'Must have review band');
    assert(result.recommended_actions.length > 0, 'Must have LinUCB recommended actions');
    assert(result.decision_guardrail.includes('advisory'), 'Must contain advisory guardrail');

    console.log('    Analysis ID:', result.analysis_id);
    console.log('    Review Priority:', result.historical_analysis.review_priority_score);
    console.log('    Review Band:', result.historical_analysis.review_band);
    console.log('    Top Recommendation:', result.recommended_actions[0]?.action);
    console.log('    LLM Status:', result.llm.status);
  });

  // 3. Feedback is stored, but only a verified outcome may update the RL policy.
  await test('Express AI Client: POST /feedback stores feedback without policy learning', async () => {
    assert(analysisId, 'Analysis ID must be available from previous test');
    assert(recommendedAction, 'A recommended action must be available');
    const feedbackResult = await aiClient.submitFeedback({
      analysis_id: analysisId,
      action: recommendedAction,
      government_feedback: 'accepted',
      note: 'Site inspection successfully scheduled by Executive Engineer.',
    });

    assert.strictEqual(feedbackResult.stored, true, 'Feedback storage must succeed');
    assert.strictEqual(feedbackResult.policy_updated, false, 'Feedback alone must not train the policy');
    assert.strictEqual(feedbackResult.action, recommendedAction);
    console.log('    Feedback Stored:', feedbackResult.stored, '| Policy Updated:', feedbackResult.policy_updated);
  });

  // 4. Online drift learning on verified snapshot
  await test('Express AI Client: POST /learn/snapshot updates online MiniBatch model on verified data', async () => {
    const verifiedSnapshot = {
      government_verified_progress_pct: 37.5,
      contractor_reported_progress_pct: 38.0,
      planned_progress_pct: 43.0,
      schedule_variance_days: 35,
      cost_variance_pct: 5.2,
      open_complaints: 2,
      high_severity_complaints: 0,
      inspection_defects: 1,
      resource_shortage_ratio: 0.08,
      pending_approval_days: 4,
      payment_delay_days: 0,
      evidence_count: 8,
    };

    const learnResult = await aiClient.learnVerifiedSnapshot(verifiedSnapshot);
    assert.strictEqual(learnResult.learned, true, 'Learning must succeed on verified snapshot');
    console.log('    Online Learned:', learnResult.learned);
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runE2eTests().catch((err) => {
  console.error('Fatal error running E2E integration test:', err);
  process.exit(1);
});

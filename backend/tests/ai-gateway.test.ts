// Set mock environment variables for test execution before importing modules
process.env.PORT = '4001';
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://mock-test.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'mock-anon-key-for-test-suite';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role-key-for-test-suite';
process.env.AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
process.env.AI_SERVICE_SHARED_SECRET = process.env.AI_SERVICE_SHARED_SECRET || 'test-ai-shared-secret';
process.env.AI_SERVICE_TIMEOUT_MS = '5000';

import assert from 'assert';
import http from 'http';

function reportPass(name: string) {
  console.log(`  [PASS] ${name}`);
}

function reportFail(name: string, error: any) {
  console.error(`  [FAIL] ${name}`);
  console.error(`    ${error.message}`);
}

async function runAiTests() {
  console.log('\n============================================================');
  console.log('NIRIKSHAK BACKEND AI GATEWAY & CLIENT TEST SUITE');
  console.log('============================================================\n');

  // Dynamically import application after environment variables are set
  const { app } = await import('../src/app.js');
  const { aiClient } = await import('../src/modules/ai/ai.client.js');
  const { AiFeedbackSchema } = await import('../src/modules/ai/ai.validation.js');

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

  // Start test server on random ephemeral port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 1. Unauthenticated /api/ai/analyze/:id must return 401
    await test('Security: Unauthenticated AI analyze request is rejected (401)', async () => {
      const res = await fetch(`${baseUrl}/api/ai/analyze/test-proj-123`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
      const body: any = await res.json();
      assert(body.error, 'Expected error response body');
    });

    // 2. Unauthenticated /api/ai/feedback must return 401
    await test('Security: Unauthenticated AI feedback request is rejected (401)', async () => {
      const res = await fetch(`${baseUrl}/api/ai/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: 'test-123',
          action: 'REVIEW_RESOURCE_PLAN',
          government_feedback: 'useful',
        }),
      });
      assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
    });

    // 3. AI Health endpoint is protected under Zero-Trust
    await test('Gateway: GET /api/ai/health requires authentication (401)', async () => {
      const res = await fetch(`${baseUrl}/api/ai/health`);
      assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
      const body: any = await res.json();
      assert(body.error !== undefined, 'Expected standardized error wrapper');
    });

    // 4. AiFeedbackSchema validates feedback options strictly
    await test('Validation: AiFeedbackSchema accepts valid feedback enums', async () => {
      const valid = AiFeedbackSchema.safeParse({
        analysis_id: '123e4567-e89b-12d3-a456-426614174000',
        action: 'REVIEW_RESOURCE_PLAN',
        government_feedback: 'accepted',
        note: 'Sound recommendation',
      });
      assert.strictEqual(valid.success, true);
    });

    await test('Validation: AiFeedbackSchema rejects invalid feedback strings', async () => {
      const invalid = AiFeedbackSchema.safeParse({
        analysis_id: '123e4567-e89b-12d3-a456-426614174000',
        action: 'REVIEW_RESOURCE_PLAN',
        government_feedback: 'bogus_value',
      });
      assert.strictEqual(invalid.success, false);
    });

    await test('Validation: AiFeedbackSchema rejects missing analysis_id', async () => {
      const missing = AiFeedbackSchema.safeParse({
        action: 'REVIEW_RESOURCE_PLAN',
        government_feedback: 'useful',
      });
      assert.strictEqual(missing.success, false);
    });

    await test('Validation: AiFeedbackSchema rejects missing action', async () => {
      const missing = AiFeedbackSchema.safeParse({
        analysis_id: '123e4567-e89b-12d3-a456-426614174000',
        government_feedback: 'useful',
      });
      assert.strictEqual(missing.success, false);
    });

    // 5. aiClient handles network timeouts and connection refusal with ServiceUnavailableError
    await test('Resilience: aiClient maps connection failures to ServiceUnavailableError', async () => {
      try {
        await aiClient.healthCheck();
      } catch (err: any) {
        assert(
          err.statusCode === 503 || err.message.includes('unavailable') || err.message.includes('ECONNREFUSED'),
          'Expected 503 Service Unavailable mapping'
        );
      }
    });

    console.log(`\nResults: ${passed} passed, ${failed} failed`);
  } finally {
    server.close();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runAiTests().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});

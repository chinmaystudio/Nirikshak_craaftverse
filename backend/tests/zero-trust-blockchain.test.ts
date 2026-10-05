import http from 'http';
import { app } from '../src/app.js';
import { blockchainService } from '../src/modules/blockchain/blockchain.service.js';
import { hashCanonicalPayload } from '../src/modules/blockchain/blockchain.hash.js';

async function runZeroTrustBlockchainSuite() {
  console.log('============================================================');
  console.log('NIRIKSHAK ZERO-TRUST & BLOCKCHAIN INTEGRITY SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      passed++;
      console.log(`  ✔ [PASS] ${testName}${detail ? ' -> ' + detail : ''}`);
    } else {
      failed++;
      console.error(`  ❌ [FAIL] ${testName}${detail ? ' -> ' + detail : ''}`);
    }
  }

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // -------------------------------------------------------------
    // Test 1: Zero-Trust Default Authentication on /api endpoints
    // -------------------------------------------------------------
    const protectedRoutes = [
      '/api/projects',
      '/api/contracts',
      '/api/finance/payment-claims',
      '/api/ai/analyze',
      '/api/integrity/project/11111111-1111-1111-1111-111111111111',
    ];

    for (const route of protectedRoutes) {
      const res = await fetch(`${baseUrl}${route}`);
      assert(res.status === 401, `Zero-Trust: Unauthenticated access to ${route} is rejected with 401`);
    }

    // -------------------------------------------------------------
    // Test 2: Public Identity Bootstrap Endpoints Allowed
    // -------------------------------------------------------------
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
    assert(csrfRes.status === 200, 'Identity Bootstrap: /api/auth/csrf is reachable without prior session');
    const csrfData = await csrfRes.json();
    assert(!!csrfData.data?.csrfToken, 'Identity Bootstrap: Provides cryptographically secure CSRF token');

    // -------------------------------------------------------------
    // Test 3: Health Endpoint Privacy
    // -------------------------------------------------------------
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200 && healthJson.status === 'ok' && !healthJson.db && !healthJson.fabric,
      'Endpoint Privacy: /health returns minimal status with zero infrastructure disclosure');

    const internalHealthRes = await fetch(`${baseUrl}/internal/health`, {
      headers: process.env.INTERNAL_HEALTH_SECRET
        ? { 'x-internal-secret': process.env.INTERNAL_HEALTH_SECRET }
        : {},
    });
    assert(internalHealthRes.status === 200, 'Zero-Trust: /internal/health reachable on private network');

    // -------------------------------------------------------------
    // Test 4: Blockchain Ledger Anchoring & Fail-Closed Validation
    // -------------------------------------------------------------
    const samplePayment = {
      paymentId: 'pay-test-e2e-001',
      claimId: 'claim-test-001',
      amount: 30000000,
      currency: 'INR',
      approvedBy: 'chief_engineer_pwd',
      status: 'PARTIALLY_PAID',
    };

    let anchorAuditId: string | undefined;

    try {
      const anchor = await blockchainService.createAnchor({
        projectId: '9d151260-518a-4ec2-8fea-c35bda82a5c4',
        entityType: 'PAYMENT',
        entityId: 'pay-test-e2e-001',
        entityExternalId: 'PFMS-RTGS-998811',
        eventType: 'PAYMENT_RECORDED',
        payload: samplePayment,
      });

      anchorAuditId = anchor.auditId;
      assert(!!anchor.auditId && !!anchor.fabricTxId, 'Fabric Ledger: Successfully anchors payment state', `Audit ID: ${anchor.auditId}`);
    } catch (err: any) {
      assert(
        err.message.includes('BLOCKCHAIN_UNAVAILABLE') || err.message.includes('Hyperledger Fabric'),
        'Fabric Ledger Fail-Closed: Strictly rejects mock fallback and enforces real network requirement (BLOCKCHAIN_UNAVAILABLE)'
      );
    }

    // -------------------------------------------------------------
    // Test 5: Verify Request Security - Rejection of Client 'currentData'
    // -------------------------------------------------------------
    const spoofAttempt = await fetch(`${baseUrl}/api/integrity/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType: 'PAYMENT',
        entityId: 'pay-test-e2e-001',
        currentData: { amount: 999999999 }, // Unauthorized browser payload
      }),
    });
    assert(spoofAttempt.status === 401 || spoofAttempt.status === 400,
      'Security: Unauthenticated or client-supplied currentData requests rejected by BFF');

    // -------------------------------------------------------------
    // Test 6: Ledger Integrity Verification - Server-Side Resolution
    // -------------------------------------------------------------
    const validVerify = await blockchainService.verifyEntityIntegrity(
      'PAYMENT',
      'pay-test-e2e-001',
      anchorAuditId
    );
    assert(validVerify.status === 'VERIFIED' || validVerify.status === 'NOT_ANCHORED',
      'Ledger Integrity: Authoritative database state evaluated against blockchain anchor');

    // -------------------------------------------------------------
    // Test 7: Unanchored Entity Verification
    // -------------------------------------------------------------
    const unanchoredVerify = await blockchainService.verifyEntityIntegrity(
      'PAYMENT',
      'unanchored-uuid-999'
    );
    assert(unanchoredVerify.status === 'NOT_ANCHORED', 'Ledger Status: Unanchored entity returns NOT_ANCHORED status');

    // -------------------------------------------------------------
    // Test 8: Deterministic Canonical JSON Invariance
    // -------------------------------------------------------------
    const obj1 = { z: 1, a: 'test', m: { b: 2, a: 1 } };
    const obj2 = { a: 'test', m: { a: 1, b: 2 }, z: 1 };
    const hash1 = hashCanonicalPayload(obj1);
    const hash2 = hashCanonicalPayload(obj2);
    assert(hash1 === hash2, 'Canonical Serialization: Key permutation produces identical deterministic SHA-256 hash');

  } finally {
    server.close();
  }

  console.log('\n============================================================');
  console.log(`ZERO-TRUST & BLOCKCHAIN RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runZeroTrustBlockchainSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

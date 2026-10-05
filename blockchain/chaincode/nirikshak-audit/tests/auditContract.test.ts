import { NirikshakAuditContract } from '../src/auditContract';
import { AuditRecord } from '../src/auditRecord';

// Mock Context and Stub implementation for deterministic unit testing
class MockIterator {
  private items: Array<{ key: string; value: Buffer }>;
  private index = 0;

  constructor(items: Array<{ key: string; value: Buffer }>) {
    this.items = items;
  }

  public async next(): Promise<{ value?: { key: string; value: Buffer }; done: boolean }> {
    if (this.index >= this.items.length) {
      return { done: true };
    }
    const item = this.items[this.index++];
    return { value: item, done: false };
  }

  public async close(): Promise<void> {}
}

class MockStub {
  public state: Map<string, Buffer> = new Map();
  public events: Map<string, Buffer> = new Map();
  public txId = 'test-tx-e2e-001';
  public timestampSeconds = Math.floor(Date.now() / 1000);

  public async getState(key: string): Promise<Buffer> {
    return this.state.get(key) || Buffer.from('');
  }

  public async putState(key: string, value: Buffer): Promise<void> {
    this.state.set(key, value);
  }

  public async getStateByRange(startKey: string, endKey: string): Promise<any> {
    const matched: Array<{ key: string; value: Buffer }> = [];
    for (const [k, v] of this.state.entries()) {
      if (k >= startKey && k <= endKey) {
        matched.push({ key: k, value: v });
      }
    }
    return new MockIterator(matched);
  }

  public setEvent(name: string, payload: Buffer): void {
    this.events.set(name, payload);
  }

  public getTxID(): string {
    return this.txId;
  }

  public getTxTimestamp(): any {
    return { seconds: { low: this.timestampSeconds } };
  }
}

class MockClientIdentity {
  public mspId = 'GovernmentOrgMSP';

  public getMSPID(): string {
    return this.mspId;
  }
}

class MockContext {
  public stub: MockStub = new MockStub();
  public clientIdentity: MockClientIdentity = new MockClientIdentity();
}

async function runTests() {
  console.log('============================================================');
  console.log('NIRIKSHAK HYPERLEDGER FABRIC CHAINCODE UNIT TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      passed++;
      console.log(`  [PASS] ${testName}${detail ? ' -> ' + detail : ''}`);
    } else {
      failed++;
      console.error(`  [FAIL] ${testName}${detail ? ' -> ' + detail : ''}`);
    }
  }

  const contract = new NirikshakAuditContract();

  // Test 1: CreateAnchor Valid
  const ctx1 = new MockContext() as any;
  const sampleHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const record1: AuditRecord = {
    auditId: 'AUD-PAYMENT-001',
    schemaVersion: 1,
    projectId: 'PRJ-PUNE-01',
    entityType: 'PAYMENT',
    entityId: 'pay-uuid-001',
    eventType: 'PAYMENT_RECORDED',
    payloadHash: sampleHash,
    hashAlgorithm: 'SHA-256',
    actorOrganizationId: 'gov-org-pwd',
    actorRole: 'chief_engineer',
    databaseVersion: 1,
    timestamp: new Date().toISOString(),
  };

  const createRes1 = await contract.CreateAnchor(ctx1, JSON.stringify(record1));
  const parsedRes1 = JSON.parse(createRes1);
  assert(parsedRes1.auditId === 'AUD-PAYMENT-001', 'CreateAnchor: Successfully persists anchor on ledger', `TxID: ${parsedRes1.fabricTxId}`);

  // Test 2: Idempotent CreateAnchor
  const createResIdempotent = await contract.CreateAnchor(ctx1, JSON.stringify(record1));
  const parsedIdempotent = JSON.parse(createResIdempotent);
  assert(parsedIdempotent.auditId === 'AUD-PAYMENT-001', 'CreateAnchor Idempotency: Returns existing anchor for identical payload');

  // Test 3: Anchor Conflict
  let conflictCaught = false;
  try {
    const conflictingRecord = { ...record1, payloadHash: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' };
    await contract.CreateAnchor(ctx1, JSON.stringify(conflictingRecord));
  } catch (err: any) {
    conflictCaught = err.message.includes('ANCHOR_CONFLICT');
  }
  assert(conflictCaught, 'Anchor Conflict Rejection: Rejects duplicate auditId with conflicting hash');

  // Test 4: ReadAnchor
  const readRes = await contract.ReadAnchor(ctx1, 'AUD-PAYMENT-001');
  const parsedRead = JSON.parse(readRes);
  assert(parsedRead.payloadHash === sampleHash, 'ReadAnchor: Retrieves verified audit record by primary key');

  // Test 5: VerifyAnchor - Valid Hash
  const verifyValidRes = await contract.VerifyAnchor(ctx1, 'AUD-PAYMENT-001', sampleHash);
  const parsedVerifyValid = JSON.parse(verifyValidRes);
  assert(parsedVerifyValid.status === 'VERIFIED', 'VerifyAnchor (Valid): Returns VERIFIED for matching payload hash');

  // Test 6: VerifyAnchor - Tampered Hash (Integrity Mismatch)
  const tamperedHash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const verifyTamperRes = await contract.VerifyAnchor(ctx1, 'AUD-PAYMENT-001', tamperedHash);
  const parsedVerifyTamper = JSON.parse(verifyTamperRes);
  assert(parsedVerifyTamper.status === 'INTEGRITY_MISMATCH', 'VerifyAnchor (Tampered): Accurately detects INTEGRITY_MISMATCH');

  // Test 7: VerifyAnchor - Non-existent
  const verifyMissingRes = await contract.VerifyAnchor(ctx1, 'AUD-NON-EXISTENT', sampleHash);
  const parsedVerifyMissing = JSON.parse(verifyMissingRes);
  assert(parsedVerifyMissing.status === 'NOT_ANCHORED', 'VerifyAnchor (Missing): Returns NOT_ANCHORED for uncommitted auditId');

  // Test 8: GetTransactionReference
  const txRefRes = await contract.GetTransactionReference(ctx1, 'AUD-PAYMENT-001');
  const parsedTxRef = JSON.parse(txRefRes);
  assert(parsedTxRef.status === 'CONFIRMED' && parsedTxRef.fabricTxId === 'test-tx-e2e-001', 'GetTransactionReference: Returns confirmed transaction details');

  // Test 9: GetEntityHistory & GetProjectAuditTrail
  const record2: AuditRecord = {
    auditId: 'AUD-PAYMENT-002',
    schemaVersion: 1,
    projectId: 'PRJ-PUNE-01',
    entityType: 'PAYMENT',
    entityId: 'pay-uuid-001',
    eventType: 'PAYMENT_APPROVED',
    payloadHash: sampleHash,
    hashAlgorithm: 'SHA-256',
    actorOrganizationId: 'gov-org-pwd',
    actorRole: 'chief_engineer',
    databaseVersion: 2,
    timestamp: new Date().toISOString(),
    previousEntityAnchorId: 'AUD-PAYMENT-001',
  };
  await contract.CreateAnchor(ctx1, JSON.stringify(record2));

  const entityHistory = await contract.GetEntityHistory(ctx1, 'PAYMENT', 'pay-uuid-001');
  const parsedEntityHistory = JSON.parse(entityHistory);
  assert(parsedEntityHistory.length === 2, 'GetEntityHistory: Returns chronological evolution trail of anchored entity', `Trail count: ${parsedEntityHistory.length}`);

  const projectTrail = await contract.GetProjectAuditTrail(ctx1, 'PRJ-PUNE-01');
  const parsedProjectTrail = JSON.parse(projectTrail);
  assert(parsedProjectTrail.length === 2, 'GetProjectAuditTrail: Returns all anchors associated with project', `Project anchors: ${parsedProjectTrail.length}`);

  // Test 10: Unauthorized MSP Rejection
  const ctxUnauthorized = new MockContext() as any;
  ctxUnauthorized.clientIdentity.mspId = 'HackerOrgMSP';
  let mspRejected = false;
  try {
    await contract.CreateAnchor(ctxUnauthorized, JSON.stringify(record1));
  } catch (err: any) {
    mspRejected = err.message.includes('UNAUTHORIZED_MSP');
  }
  assert(mspRejected, 'Security: Rejects transaction submissions from unauthorized MSP ID');

  // Test 11: PII Policy Violation Rejection
  const ctxPii = new MockContext() as any;
  let piiRejected = false;
  try {
    const piiRecord = {
      ...record1,
      auditId: 'AUD-PII-TEST',
      password: 'plain-text-password-123',
    };
    await contract.CreateAnchor(ctxPii, JSON.stringify(piiRecord));
  } catch (err: any) {
    piiRejected = err.message.includes('PII_POLICY_VIOLATION');
  }
  assert(piiRejected, 'Security: Rejects anchor submissions containing forbidden PII fields');

  // Test 12: Validation Error on Malformed Hash
  let hashRejected = false;
  try {
    const invalidHashRecord = {
      ...record1,
      auditId: 'AUD-BAD-HASH',
      payloadHash: 'not-a-sha256-hash',
    };
    await contract.CreateAnchor(ctx1, JSON.stringify(invalidHashRecord));
  } catch (err: any) {
    hashRejected = err.message.includes('VALIDATION_ERROR');
  }
  // Test 13: OrdererMSP Rejection
  const ctxOrderer = new MockContext() as any;
  ctxOrderer.clientIdentity.mspId = 'OrdererMSP';
  let ordererRejected = false;
  try {
    await contract.CreateAnchor(ctxOrderer, JSON.stringify(record1));
  } catch (err: any) {
    ordererRejected = err.message.includes('UNAUTHORIZED_MSP');
  }
  assert(ordererRejected, 'Security: Prohibits OrdererMSP from application anchor writes');

  // Test 14: Submitter Event Authorization Matrix Rejection
  const ctxContractor = new MockContext() as any;
  ctxContractor.clientIdentity.mspId = 'ContractorOrgMSP';
  let eventAuthRejected = false;
  try {
    // Contractor trying to record government-exclusive event PAYMENT_RECORDED
    await contract.CreateAnchor(ctxContractor, JSON.stringify(record1));
  } catch (err: any) {
    eventAuthRejected = err.message.includes('UNAUTHORIZED_EVENT');
  }
  assert(eventAuthRejected, 'Security: Enforces event authorization matrix per MSP identity');

  // Test 15: Schema Violation Rejection on Unrecognized Extra Fields
  let extraFieldRejected = false;
  try {
    const extraFieldRecord = {
      ...record1,
      auditId: 'AUD-EXTRA-FIELD-TEST',
      arbitraryInjectedData: 'untrusted-payload',
    };
    await contract.CreateAnchor(ctx1, JSON.stringify(extraFieldRecord));
  } catch (err: any) {
    extraFieldRejected = err.message.includes('SCHEMA_VIOLATION');
  }
  assert(extraFieldRejected, 'Validation: Rejects payloads with arbitrary unrecognized schema attributes');

  console.log('\n============================================================');
  console.log(`CHAINCODE RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

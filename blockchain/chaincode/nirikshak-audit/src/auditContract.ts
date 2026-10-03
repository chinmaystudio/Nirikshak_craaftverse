import { AuditRecord, VerificationResult } from './auditRecord';

let ContextClass: any;
let ContractClass: any;
let InfoDecorator: any = () => () => {};
let ReturnsDecorator: any = () => () => {};
let TransactionDecorator: any = () => () => {};

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fca = require('fabric-contract-api');
  ContextClass = fca.Context;
  ContractClass = fca.Contract;
  InfoDecorator = fca.Info;
  ReturnsDecorator = fca.Returns;
  TransactionDecorator = fca.Transaction;
} catch {
  class FallbackContract {
    constructor(public name?: string) {}
  }
  ContractClass = FallbackContract;
  ContextClass = class {};
}

export type Context = any;
export const Info = InfoDecorator;
export const Returns = ReturnsDecorator;
export const Transaction = TransactionDecorator;

const ALLOWED_MSPS = new Set([
  'GovernmentOrgMSP',
  'ContractorOrgMSP',
  'AuditorOrgMSP',
  'OrdererMSP',
]);

const FORBIDDEN_FIELDS = [
  'password',
  'jwt',
  'token',
  'secret',
  'aadhaar',
  'pan',
  'bank_account',
  'prompt',
  'api_key',
];

@Info({
  title: 'NirikshakAuditContract',
  description: 'NIRIKSHAK Craftverse Hyperledger Fabric Immutable Audit Proof Chaincode',
})
export class NirikshakAuditContract extends ContractClass {
  constructor() {
    super('NirikshakAuditContract');
  }

  private validateSubmitterMsp(ctx: Context): void {
    try {
      if (ctx.clientIdentity && typeof ctx.clientIdentity.getMSPID === 'function') {
        const clientMsp = ctx.clientIdentity.getMSPID();
        if (clientMsp && !ALLOWED_MSPS.has(clientMsp)) {
          throw new Error(`UNAUTHORIZED_MSP: Submitter MSP '${clientMsp}' is not authorized to interact with Nirikshak ledger.`);
        }
      }
    } catch (err: any) {
      if (err.message && err.message.startsWith('UNAUTHORIZED_MSP')) {
        throw err;
      }
    }
  }

  private validatePayloadHygiene(record: Partial<AuditRecord>): void {
    const rawString = JSON.stringify(record).toLowerCase();
    for (const forbidden of FORBIDDEN_FIELDS) {
      if (rawString.includes(`"${forbidden}"`)) {
        throw new Error(`PII_POLICY_VIOLATION: Payload contains forbidden confidential field '${forbidden}'. Blockchain only accepts canonical hashes and public metadata.`);
      }
    }
  }

  @Transaction()
  public async CreateAnchor(ctx: Context, anchorJson: string): Promise<string> {
    this.validateSubmitterMsp(ctx);

    let record: AuditRecord;
    try {
      record = JSON.parse(anchorJson);
    } catch {
      throw new Error('INVALID_JSON: Unable to parse anchorJson payload.');
    }

    if (!record.auditId || !record.payloadHash || !record.entityType || !record.eventType) {
      throw new Error('VALIDATION_ERROR: Missing mandatory anchor fields (auditId, payloadHash, entityType, eventType).');
    }

    if (!record.payloadHash.match(/^[a-f0-9]{64}$/i)) {
      throw new Error('VALIDATION_ERROR: payloadHash must be a valid 64-character SHA-256 hexadecimal string.');
    }

    this.validatePayloadHygiene(record);

    const primaryKey = `ANCHOR_${record.auditId}`;
    const existingBytes = await ctx.stub.getState(primaryKey);

    if (existingBytes && existingBytes.length > 0) {
      const existing: AuditRecord = JSON.parse(existingBytes.toString());
      if (existing.payloadHash.toLowerCase() === record.payloadHash.toLowerCase()) {
        // Idempotent retry: return existing record
        return JSON.stringify(existing);
      }
      throw new Error(`ANCHOR_CONFLICT: Audit anchor with id '${record.auditId}' already exists with differing payload hash.`);
    }

    record.fabricTxId = ctx.stub.getTxID();
    record.blockTimestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();
    record.schemaVersion = record.schemaVersion || 1;
    record.hashAlgorithm = record.hashAlgorithm || 'SHA-256';

    const serialized = Buffer.from(JSON.stringify(record));
    await ctx.stub.putState(primaryKey, serialized);

    // Write secondary indexes
    if (record.projectId) {
      const projectKey = `PROJ_${record.projectId}_${record.auditId}`;
      await ctx.stub.putState(projectKey, Buffer.from(record.auditId));
    }

    if (record.entityType && record.entityId) {
      const entityKey = `ENT_${record.entityType}_${record.entityId}_${record.auditId}`;
      await ctx.stub.putState(entityKey, Buffer.from(record.auditId));
    }

    // Emit event
    ctx.stub.setEvent('AnchorCreated', Buffer.from(JSON.stringify({
      auditId: record.auditId,
      entityType: record.entityType,
      entityId: record.entityId,
      eventType: record.eventType,
      payloadHash: record.payloadHash,
      txId: record.fabricTxId,
      timestamp: record.blockTimestamp,
    })));

    return JSON.stringify(record);
  }

  @Transaction(false)
  @Returns('string')
  public async ReadAnchor(ctx: Context, auditId: string): Promise<string> {
    this.validateSubmitterMsp(ctx);

    const primaryKey = `ANCHOR_${auditId}`;
    const bytes = await ctx.stub.getState(primaryKey);

    if (!bytes || bytes.length === 0) {
      throw new Error(`ANCHOR_NOT_FOUND: No anchor exists on ledger with auditId '${auditId}'.`);
    }

    return bytes.toString();
  }

  @Transaction(false)
  @Returns('string')
  public async VerifyAnchor(ctx: Context, auditId: string, expectedHash: string): Promise<string> {
    this.validateSubmitterMsp(ctx);

    const primaryKey = `ANCHOR_${auditId}`;
    const bytes = await ctx.stub.getState(primaryKey);

    if (!bytes || bytes.length === 0) {
      const result: VerificationResult = {
        auditId,
        status: 'NOT_ANCHORED',
        expectedHash,
      };
      return JSON.stringify(result);
    }

    const record: AuditRecord = JSON.parse(bytes.toString());
    const isMatch = record.payloadHash.toLowerCase() === expectedHash.toLowerCase();

    const result: VerificationResult = {
      auditId,
      status: isMatch ? 'VERIFIED' : 'INTEGRITY_MISMATCH',
      expectedHash,
      ledgerHash: record.payloadHash,
      timestamp: record.blockTimestamp || record.timestamp,
      transactionId: record.fabricTxId,
      entityType: record.entityType,
      entityId: record.entityId,
    };

    return JSON.stringify(result);
  }

  @Transaction(false)
  @Returns('string')
  public async GetEntityHistory(ctx: Context, entityType: string, entityId: string): Promise<string> {
    this.validateSubmitterMsp(ctx);

    const prefix = `ENT_${entityType}_${entityId}_`;
    const iterator = await ctx.stub.getStateByRange(prefix, `${prefix}\uFFFF`);

    const results: AuditRecord[] = [];
    let res = await iterator.next();

    while (!res.done) {
      if (res.value && res.value.value) {
        const auditId = res.value.value.toString();
        const anchorBytes = await ctx.stub.getState(`ANCHOR_${auditId}`);
        if (anchorBytes && anchorBytes.length > 0) {
          results.push(JSON.parse(anchorBytes.toString()));
        }
      }
      res = await iterator.next();
    }
    await iterator.close();

    return JSON.stringify(results);
  }

  @Transaction(false)
  @Returns('string')
  public async GetProjectAuditTrail(ctx: Context, projectId: string): Promise<string> {
    this.validateSubmitterMsp(ctx);

    const prefix = `PROJ_${projectId}_`;
    const iterator = await ctx.stub.getStateByRange(prefix, `${prefix}\uFFFF`);

    const results: AuditRecord[] = [];
    let res = await iterator.next();

    while (!res.done) {
      if (res.value && res.value.value) {
        const auditId = res.value.value.toString();
        const anchorBytes = await ctx.stub.getState(`ANCHOR_${auditId}`);
        if (anchorBytes && anchorBytes.length > 0) {
          results.push(JSON.parse(anchorBytes.toString()));
        }
      }
      res = await iterator.next();
    }
    await iterator.close();

    return JSON.stringify(results);
  }

  @Transaction(false)
  @Returns('string')
  public async GetTransactionReference(ctx: Context, auditId: string): Promise<string> {
    this.validateSubmitterMsp(ctx);

    const anchorStr = await this.ReadAnchor(ctx, auditId);
    const record: AuditRecord = JSON.parse(anchorStr);

    return JSON.stringify({
      auditId: record.auditId,
      fabricTxId: record.fabricTxId,
      blockTimestamp: record.blockTimestamp,
      payloadHash: record.payloadHash,
      hashAlgorithm: record.hashAlgorithm,
      status: 'CONFIRMED',
    });
  }
}

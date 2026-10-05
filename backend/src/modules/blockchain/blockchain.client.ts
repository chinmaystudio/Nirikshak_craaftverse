import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as grpc from '@grpc/grpc-js';
import { connect, Contract, Gateway, Identity, Signer, signers } from '@hyperledger/fabric-gateway';
import { AuditRecord, VerificationResult, AnchorSubmissionResult } from './blockchain.types.js';

export type BlockchainState = 'DISABLED' | 'CONNECTING' | 'READY' | 'UNAVAILABLE' | 'DEGRADED';
export type BlockchainMode = 'test' | 'development' | 'production';

export interface FabricConfig {
  channelName: string;
  chaincodeName: string;
  gatewayEndpoint?: string;
  gatewayHostAlias?: string;
  mspId?: string;
  clientCertPath?: string;
  clientKeyPath?: string;
  tlsCertPath?: string;
  enabled?: boolean;
  mode?: BlockchainMode;
}

export class FabricClient {
  private gateway: Gateway | null = null;
  private contract: Contract | null = null;
  private config: FabricConfig;
  private state: BlockchainState = 'DISABLED';
  private mode: BlockchainMode;

  // In-memory ledger strictly isolated for test/mock modes
  private inMemoryLedger: Map<string, AuditRecord> = new Map();
  private projectIndex: Map<string, Set<string>> = new Map();
  private entityIndex: Map<string, Set<string>> = new Map();

  constructor(config?: Partial<FabricConfig>) {
    const rawMode = (process.env.BLOCKCHAIN_MODE || (process.env.NODE_ENV === 'production' ? 'production' : process.env.NODE_ENV === 'test' ? 'test' : 'development')) as BlockchainMode;
    this.mode = config?.mode || rawMode;

    this.config = {
      channelName: process.env.FABRIC_CHANNEL_NAME || config?.channelName || 'nirikshakchannel',
      chaincodeName: process.env.FABRIC_CHAINCODE_NAME || config?.chaincodeName || 'nirikshak-audit',
      gatewayEndpoint: process.env.FABRIC_GATEWAY_ENDPOINT || config?.gatewayEndpoint || 'localhost:7051',
      gatewayHostAlias: process.env.FABRIC_GATEWAY_HOST_ALIAS || config?.gatewayHostAlias || 'peer0.government.example.com',
      mspId: process.env.FABRIC_MSP_ID || config?.mspId || 'GovernmentOrgMSP',
      clientCertPath: process.env.FABRIC_CLIENT_CERT_PATH || config?.clientCertPath,
      clientKeyPath: process.env.FABRIC_CLIENT_KEY_PATH || config?.clientKeyPath,
      tlsCertPath: process.env.FABRIC_TLS_CERT_PATH || config?.tlsCertPath,
      enabled: process.env.BLOCKCHAIN_ENABLED !== 'false',
    };
  }

  public getState(): BlockchainState {
    return this.state;
  }

  public getMode(): BlockchainMode {
    return this.mode;
  }

  public isMockAllowed(): boolean {
    if (this.mode === 'production') return false;
    if (this.mode === 'test' && (process.env.NODE_ENV === 'test' || process.env.BLOCKCHAIN_TEST_MODE === 'true')) {
      return true;
    }
    if (this.mode === 'development' && process.env.BLOCKCHAIN_TEST_MODE === 'true') {
      return true;
    }
    return false;
  }

  public async connect(): Promise<boolean> {
    if (!this.config.enabled) {
      this.state = 'DISABLED';
      return false;
    }

    this.state = 'CONNECTING';

    try {
      if (
        this.config.clientCertPath &&
        this.config.clientKeyPath &&
        this.config.tlsCertPath &&
        fs.existsSync(this.config.clientCertPath) &&
        fs.existsSync(this.config.clientKeyPath) &&
        fs.existsSync(this.config.tlsCertPath)
      ) {
        const tlsCredentials = grpc.credentials.createSsl(
          fs.readFileSync(this.config.tlsCertPath)
        );

        const client = new grpc.Client(this.config.gatewayEndpoint!, tlsCredentials, {
          'grpc.ssl_target_name_override': this.config.gatewayHostAlias,
        });

        const credentials = fs.readFileSync(this.config.clientCertPath);
        const identity: Identity = {
          mspId: this.config.mspId!,
          credentials,
        };

        const privateKeyPem = fs.readFileSync(this.config.clientKeyPath);
        const privateKey = crypto.createPrivateKey(privateKeyPem);
        const signer: Signer = signers.newPrivateKeySigner(privateKey);

        this.gateway = connect({
          client,
          identity,
          signer,
          evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
          endorseOptions: () => ({ deadline: Date.now() + 15000 }),
          submitOptions: () => ({ deadline: Date.now() + 10000 }),
          commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
        });

        const network = this.gateway.getNetwork(this.config.channelName);
        this.contract = network.getContract(this.config.chaincodeName);
        this.state = 'READY';
        return true;
      }
    } catch (err: any) {
      this.contract = null;
      if (this.gateway) {
        try { this.gateway.close(); } catch {}
        this.gateway = null;
      }

      if (this.mode === 'production') {
        this.state = 'UNAVAILABLE';
        throw new Error(`BLOCKCHAIN_UNAVAILABLE: Production Hyperledger Fabric gateway connection failed: ${err.message}`);
      }

      console.warn(`[FabricClient] Real Fabric gateway connection not available (${err.message}).`);
    }

    if (this.isMockAllowed()) {
      this.state = 'READY';
      return true;
    }

    this.state = 'UNAVAILABLE';
    if (this.mode === 'production') {
      throw new Error('BLOCKCHAIN_UNAVAILABLE: Real Hyperledger Fabric credentials or connectivity required in production mode.');
    }
    return false;
  }

  public async createAnchor(record: AuditRecord): Promise<AnchorSubmissionResult> {
    if (this.contract) {
      try {
        const resultBytes = await this.contract.submitTransaction('CreateAnchor', JSON.stringify(record));
        const parsed = JSON.parse(Buffer.from(resultBytes).toString());
        return {
          auditId: parsed.auditId,
          transactionId: parsed.fabricTxId,
          blockTimestamp: parsed.blockTimestamp || new Date().toISOString(),
          status: 'CONFIRMED',
        };
      } catch (err: any) {
        if (this.mode === 'production') {
          throw new Error(`BLOCKCHAIN_SUBMISSION_FAILED: Real ledger endorsement/commit failed: ${err.message}`);
        }
        console.warn(`[FabricClient] Gateway submit error in dev/test: ${err.message}`);
      }
    }

    // In production, fallback is strictly prohibited
    if (!this.isMockAllowed()) {
      throw new Error('BLOCKCHAIN_UNAVAILABLE: Real Hyperledger Fabric ledger connection is required. In-memory ledger fallback is strictly prohibited in production.');
    }

    // Isolated In-Memory Ledger for Unit/Integration Mock Tests
    const existing = this.inMemoryLedger.get(record.auditId);
    if (existing) {
      if (existing.payloadHash.toLowerCase() === record.payloadHash.toLowerCase()) {
        return {
          auditId: existing.auditId,
          transactionId: existing.fabricTxId || `mock-tx-${existing.auditId}`,
          blockTimestamp: existing.blockTimestamp || existing.timestamp,
          status: 'CONFIRMED',
        };
      }
      throw new Error(`ANCHOR_CONFLICT: Audit anchor with id '${record.auditId}' already exists with differing payload hash.`);
    }

    const txId = `mock-test-tx-${crypto.randomBytes(16).toString('hex')}`;
    const blockTimestamp = new Date().toISOString();

    const storedRecord: AuditRecord = {
      ...record,
      fabricTxId: txId,
      blockTimestamp,
    };

    this.inMemoryLedger.set(record.auditId, storedRecord);

    if (record.projectId) {
      if (!this.projectIndex.has(record.projectId)) {
        this.projectIndex.set(record.projectId, new Set());
      }
      this.projectIndex.get(record.projectId)!.add(record.auditId);
    }

    if (record.entityType && record.entityId) {
      const entityKey = `${record.entityType}:${record.entityId}`;
      if (!this.entityIndex.has(entityKey)) {
        this.entityIndex.set(entityKey, new Set());
      }
      this.entityIndex.get(entityKey)!.add(record.auditId);
    }

    return {
      auditId: record.auditId,
      transactionId: txId,
      blockTimestamp,
      status: 'CONFIRMED',
    };
  }

  public async readAnchor(auditId: string): Promise<AuditRecord | null> {
    if (this.contract) {
      try {
        const resultBytes = await this.contract.evaluateTransaction('ReadAnchor', auditId);
        return JSON.parse(Buffer.from(resultBytes).toString());
      } catch (err: any) {
        if (err.message && err.message.includes('ANCHOR_NOT_FOUND')) {
          return null;
        }
        if (this.mode === 'production') {
          throw new Error(`BLOCKCHAIN_EVALUATE_FAILED: ${err.message}`);
        }
      }
    }

    if (!this.isMockAllowed()) {
      throw new Error('BLOCKCHAIN_UNAVAILABLE: Real Fabric gateway connection required.');
    }

    return this.inMemoryLedger.get(auditId) || null;
  }

  public async verifyAnchor(auditId: string, expectedHash: string): Promise<VerificationResult> {
    if (this.contract) {
      try {
        const resultBytes = await this.contract.evaluateTransaction('VerifyAnchor', auditId, expectedHash);
        return JSON.parse(Buffer.from(resultBytes).toString());
      } catch (err: any) {
        if (this.mode === 'production') {
          throw new Error(`BLOCKCHAIN_EVALUATE_FAILED: ${err.message}`);
        }
        console.warn(`[FabricClient] Gateway evaluate error: ${err.message}`);
      }
    }

    if (!this.isMockAllowed()) {
      throw new Error('BLOCKCHAIN_UNAVAILABLE: Real Fabric gateway connection required.');
    }

    const record = this.inMemoryLedger.get(auditId);
    if (!record) {
      return {
        auditId,
        status: 'NOT_ANCHORED',
        expectedHash,
        details: 'Anchor ID not found on Hyperledger Fabric ledger.',
      };
    }

    const isMatch = record.payloadHash.toLowerCase() === expectedHash.toLowerCase();

    return {
      auditId,
      status: isMatch ? 'VERIFIED' : 'INTEGRITY_MISMATCH',
      expectedHash,
      ledgerHash: record.payloadHash,
      timestamp: record.blockTimestamp || record.timestamp,
      transactionId: record.fabricTxId,
      entityType: record.entityType,
      entityId: record.entityId,
      details: isMatch
        ? 'Cryptographic SHA-256 state matches Hyperledger Fabric anchor.'
        : 'CRITICAL: Authoritative database state differs from immutable ledger anchor!',
    };
  }

  public async getProjectAuditTrail(projectId: string): Promise<AuditRecord[]> {
    if (this.contract) {
      try {
        const resultBytes = await this.contract.evaluateTransaction('GetProjectAuditTrail', projectId);
        return JSON.parse(Buffer.from(resultBytes).toString());
      } catch (err: any) {
        if (this.mode === 'production') {
          throw new Error(`BLOCKCHAIN_EVALUATE_FAILED: ${err.message}`);
        }
      }
    }

    if (!this.isMockAllowed()) {
      throw new Error('BLOCKCHAIN_UNAVAILABLE: Real Fabric gateway connection required.');
    }

    const auditIds = this.projectIndex.get(projectId);
    if (!auditIds) return [];

    const results: AuditRecord[] = [];
    for (const id of auditIds) {
      const rec = this.inMemoryLedger.get(id);
      if (rec) results.push(rec);
    }
    return results;
  }

  public async getEntityHistory(entityType: string, entityId: string): Promise<AuditRecord[]> {
    if (this.contract) {
      try {
        const resultBytes = await this.contract.evaluateTransaction('GetEntityHistory', entityType, entityId);
        return JSON.parse(Buffer.from(resultBytes).toString());
      } catch (err: any) {
        if (this.mode === 'production') {
          throw new Error(`BLOCKCHAIN_EVALUATE_FAILED: ${err.message}`);
        }
      }
    }

    if (!this.isMockAllowed()) {
      throw new Error('BLOCKCHAIN_UNAVAILABLE: Real Fabric gateway connection required.');
    }

    const entityKey = `${entityType}:${entityId}`;
    const auditIds = this.entityIndex.get(entityKey);
    if (!auditIds) return [];

    const results: AuditRecord[] = [];
    for (const id of auditIds) {
      const rec = this.inMemoryLedger.get(id);
      if (rec) results.push(rec);
    }
    return results;
  }

  public close(): void {
    if (this.gateway) {
      try {
        this.gateway.close();
      } catch {}
      this.gateway = null;
      this.contract = null;
      this.state = 'DISABLED';
    }
  }
}

export const fabricClient = new FabricClient();

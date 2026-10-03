export interface AuditRecord {
  auditId: string;
  schemaVersion: number;
  projectId: string;
  entityType: string;
  entityId: string;
  eventType: string;
  payloadHash: string;
  hashAlgorithm: string;
  actorOrganizationId: string;
  actorRole: string;
  databaseVersion: string | number;
  timestamp: string;
  previousEntityAnchorId?: string | null;
  fabricTxId?: string;
  blockTimestamp?: string;
}

export interface VerificationResult {
  auditId: string;
  status: 'VERIFIED' | 'INTEGRITY_MISMATCH' | 'NOT_ANCHORED';
  expectedHash: string;
  ledgerHash?: string;
  timestamp?: string;
  transactionId?: string;
  entityType?: string;
  entityId?: string;
}

export type AnchorStatus = 'PENDING' | 'PROCESSING' | 'CONFIRMED' | 'FAILED' | 'DEAD_LETTER';

export type EntityType = 
  | 'PROJECT'
  | 'CONTRACT'
  | 'MILESTONE'
  | 'PROGRESS_UPDATE'
  | 'INSPECTION'
  | 'INSPECTION_FINDING'
  | 'PAYMENT_CLAIM'
  | 'PAYMENT'
  | 'LITIGATION'
  | 'SETTLEMENT'
  | 'AI_ANALYSIS'
  | 'DOCUMENT';

export type EventType = 
  | 'PROJECT_CREATED'
  | 'PROJECT_APPROVED'
  | 'TENDER_PUBLISHED'
  | 'BID_SUBMITTED'
  | 'BID_WITHDRAWN'
  | 'BID_SELECTED'
  | 'CONTRACT_AWARDED'
  | 'PROGRESS_SUBMITTED'
  | 'PROGRESS_APPROVED'
  | 'PROGRESS_REJECTED'
  | 'INSPECTION_COMPLETED'
  | 'INSPECTION_FINDING_CREATED'
  | 'PAYMENT_CLAIM_SUBMITTED'
  | 'PAYMENT_CLAIM_APPROVED'
  | 'PAYMENT_RECORDED'
  | 'LITIGATION_CREATED'
  | 'LITIGATION_EVENT_RECORDED'
  | 'SETTLEMENT_APPROVED'
  | 'SETTLEMENT_EXECUTED'
  | 'PROJECT_COMPLETED'
  | 'AI_ANALYSIS_COMPLETED'
  | 'AI_ACTION_ACCEPTED'
  | 'AI_OUTCOME_RECORDED';

export interface AuditRecord {
  auditId: string;
  schemaVersion: number;
  projectId: string;
  entityType: EntityType | string;
  entityId: string;
  entityExternalId?: string;
  eventType: EventType | string;
  payloadHash: string;
  hashAlgorithm: string;
  actorOrganizationId?: string;
  actorRole?: string;
  databaseVersion: string | number;
  timestamp: string;
  previousEntityAnchorId?: string | null;
  fabricTxId?: string;
  blockTimestamp?: string;
}

export interface VerificationResult {
  auditId: string;
  status: 'VERIFIED' | 'INTEGRITY_MISMATCH' | 'PENDING' | 'NOT_ANCHORED';
  expectedHash: string;
  ledgerHash?: string;
  timestamp?: string;
  transactionId?: string;
  entityType?: string;
  entityId?: string;
  details?: string;
}

export interface AnchorSubmissionResult {
  auditId: string;
  transactionId: string;
  blockTimestamp: string;
  status: 'CONFIRMED';
}

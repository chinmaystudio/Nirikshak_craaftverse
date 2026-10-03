import crypto from 'crypto';
import { canonicalizeAuditPayload } from './blockchain.canonical.js';

export function sha256Hex(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function hashCanonicalPayload(payload: any): string {
  const canonical = canonicalizeAuditPayload(payload);
  return sha256Hex(Buffer.from(canonical, 'utf8'));
}

export function hashDocumentBuffer(buffer: Buffer): string {
  return sha256Hex(buffer);
}

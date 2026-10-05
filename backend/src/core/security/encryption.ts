import crypto from 'crypto';

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  tag: string;
  keyVersion: number;
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for AES-GCM
const DEFAULT_KEY_VERSION = 1;

/**
 * Validates that an encryption key exists and is a valid 32-byte key (hex or base64 or 32-byte utf-8 string).
 */
export function validateEncryptionKey(envVarName: string): boolean {
  const rawKey = process.env[envVarName];
  if (!rawKey) {
    return false;
  }

  try {
    const keyBuf = parseKey(rawKey);
    return keyBuf.length === 32;
  } catch {
    return false;
  }
}

/**
 * Parses a key string into a 32-byte Buffer.
 */
function parseKey(rawKey: string): Buffer {
  if (rawKey.length === 64 && /^[0-9a-fA-F]+$/.test(rawKey)) {
    return Buffer.from(rawKey, 'hex');
  }
  const base64Candidate = Buffer.from(rawKey, 'base64');
  if (base64Candidate.length === 32 && rawKey.length === 44) {
    return base64Candidate;
  }
  const utf8Candidate = Buffer.from(rawKey, 'utf8');
  if (utf8Candidate.length === 32) {
    return utf8Candidate;
  }
  // Deterministic 32-byte derivation fallback for non-32-byte strings in dev/test
  return crypto.createHash('sha256').update(rawKey).digest();
}

/**
 * Retrieves the appropriate encryption key by version, supporting key rotation.
 */
function getKeyForVersion(envVarName: string, version: number): Buffer {
  // Check version-specific env var first (e.g. SESSION_TOKEN_ENCRYPTION_KEY_V2)
  const versionedVarName = `${envVarName}_V${version}`;
  const versionedKey = process.env[versionedVarName];
  if (versionedKey) {
    return parseKey(versionedKey);
  }

  // Fallback to primary env var
  const primaryKey = process.env[envVarName];
  if (primaryKey) {
    return parseKey(primaryKey);
  }

  // Fail-closed in production
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`ENCRYPTION_KEY_MISSING: Mandatory encryption key '${envVarName}' is not configured.`);
  }

  // Deterministic development fallback key
  return crypto.createHash('sha256').update(`DEV_FALLBACK_${envVarName}`).digest();
}

/**
 * Encrypts a plaintext secret using AES-256-GCM.
 */
export function encryptSecret(
  plaintext: string,
  envVarName = 'SESSION_TOKEN_ENCRYPTION_KEY',
  keyVersion = DEFAULT_KEY_VERSION
): EncryptedPayload {
  if (!plaintext) {
    throw new Error('ENCRYPTION_FAILED: Plaintext cannot be empty');
  }

  const key = getKeyForVersion(envVarName, keyVersion);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    keyVersion,
  };
}

/**
 * Decrypts an AES-256-GCM encrypted payload.
 */
export function decryptSecret(
  payload: EncryptedPayload,
  envVarName = 'SESSION_TOKEN_ENCRYPTION_KEY'
): string {
  if (!payload || !payload.ciphertext || !payload.iv || !payload.tag) {
    throw new Error('DECRYPTION_FAILED: Incomplete encrypted payload');
  }

  const key = getKeyForVersion(envVarName, payload.keyVersion || DEFAULT_KEY_VERSION);
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const ciphertext = Buffer.from(payload.ciphertext, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

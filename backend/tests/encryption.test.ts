import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { validateEncryptionKey, encryptSecret, decryptSecret } from '../src/core/security/encryption.js';

const name = 'TEST_SESSION_KEY';
const originalNodeEnv = process.env.NODE_ENV;
process.env.NODE_ENV = 'production';

try {
  const bytes = crypto.randomBytes(32);
  process.env[name] = bytes.toString('hex');
  assert.equal(validateEncryptionKey(name), true, '64-character hex key should be accepted');
  const payload = encryptSecret('opaque credential', name);
  assert.equal(decryptSecret(payload, name), 'opaque credential');

  process.env[name] = bytes.toString('base64');
  assert.equal(validateEncryptionKey(name), true, 'canonical 32-byte base64 key should be accepted');

  for (const invalid of ['password', 'a'.repeat(32), 'not-base64-'.repeat(4), bytes.toString('base64').slice(0, -2) + '??']) {
    process.env[name] = invalid;
    assert.equal(validateEncryptionKey(name), false, `weak or malformed key should be rejected: ${invalid}`);
  }
  console.log('Encryption key validation: all cases passed');
} finally {
  delete process.env[name];
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
}

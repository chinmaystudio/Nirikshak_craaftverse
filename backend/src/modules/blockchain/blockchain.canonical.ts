/**
 * NIRIKSHAK Canonical Deterministic JSON Serializer (Version 1)
 * Guarantees that equivalent objects always produce identical byte representations
 * regardless of key ordering, spacing, or serialization variations.
 */

function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  const sortedKeys = Object.keys(obj).sort();
  const result: Record<string, any> = {};

  for (const key of sortedKeys) {
    const value = obj[key];
    if (value !== undefined) {
      result[key] = sortObjectKeys(value);
    }
  }

  return result;
}

export function canonicalizeAuditPayload(payload: any): string {
  if (payload === null || payload === undefined) {
    return '{}';
  }

  const normalized = sortObjectKeys(payload);
  return JSON.stringify(normalized);
}

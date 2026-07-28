import { describe, expect, test } from 'vitest';
import {
  getLegacySeedPassword,
  hashPassword,
  verifyPassword,
} from '../../apps/api/src/lib/password.js';

describe('password helpers', () => {
  test('hashes and verifies a matching password', async () => {
    const hash = await hashPassword('secret123');

    expect(hash).not.toBe('secret123');
    await expect(verifyPassword('secret123', hash)).resolves.toBe(true);
  });

  test('rejects a different password', async () => {
    const hash = await hashPassword('secret123');

    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  test('rejects an invalid stored hash', async () => {
    await expect(verifyPassword('secret123', 'not-a-valid-hash')).resolves.toBe(false);
  });

  test('returns bootstrap passwords only for legacy seed accounts', () => {
    expect(getLegacySeedPassword('admin@labprima.local')).toBe('admin123');
    expect(getLegacySeedPassword('karyawan@labprima.local')).toBe('karyawan123');
    expect(getLegacySeedPassword('other@labprima.local')).toBeNull();
  });
});

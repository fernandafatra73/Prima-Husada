import { pbkdf2, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const pbkdf2Async = promisify(pbkdf2);
const HASH_VERSION = 'pbkdf2';
const DIGEST = 'sha512';
const ITERATIONS = 210_000;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const legacySeedPasswords = new Map<string, string>([
  ['admin@labprima.local', 'admin123'],
  ['karyawan@labprima.local', 'karyawan123'],
]);

export function getLegacySeedPassword(email: string): string | null {
  return legacySeedPasswords.get(email.trim().toLowerCase()) ?? null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await pbkdf2Async(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);

  return [
    HASH_VERSION,
    DIGEST,
    String(ITERATIONS),
    salt.toString('base64url'),
    key.toString('base64url'),
  ].join('$');
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split('$');
  if (parts.length !== 5) return false;

  const [version, digest, iterationsValue, saltValue, keyValue] = parts;
  if (version !== HASH_VERSION || digest !== DIGEST) return false;

  const iterations = Number(iterationsValue);
  if (!Number.isInteger(iterations) || iterations <= 0) return false;

  try {
    const salt = Buffer.from(saltValue, 'base64url');
    const storedKey = Buffer.from(keyValue, 'base64url');
    if (storedKey.length === 0) return false;

    const candidateKey = await pbkdf2Async(
      password,
      salt,
      iterations,
      storedKey.length,
      digest,
    );

    return (
      candidateKey.length === storedKey.length &&
      timingSafeEqual(candidateKey, storedKey)
    );
  } catch {
    return false;
  }
}

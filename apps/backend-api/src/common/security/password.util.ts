import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const hashLength = 64;

export function hashSecret(value: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(value, salt, hashLength).toString('hex');

  return `${salt}:${hash}`;
}

export function verifySecret(value: string, storedHash: string) {
  const [salt, expectedHash] = storedHash.split(':');

  if (!salt || !expectedHash) {
    return false;
  }

  const actualHash = scryptSync(value, salt, hashLength);
  const expectedBuffer = Buffer.from(expectedHash, 'hex');

  if (actualHash.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualHash, expectedBuffer);
}

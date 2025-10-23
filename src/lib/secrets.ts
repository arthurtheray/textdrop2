import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export async function createSecret(secret: string) {
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(secret, salt);
  const lookup = fingerprintSecret(secret);
  return { hash, lookup };
}

export function fingerprintSecret(secret: string) {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

export async function verifySecret(secret: string, hash: string) {
  return bcrypt.compare(secret, hash);
}

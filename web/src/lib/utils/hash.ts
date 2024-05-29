import { createHash } from 'crypto';

export function sha256(data: Buffer | string): string {
  const hash = createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

export function hex(data: Buffer | string): string {
  return Buffer.from(data).toString('hex');
}

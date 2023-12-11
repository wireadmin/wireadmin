import jwt from 'jsonwebtoken';
import 'dotenv/config';
import Hex from 'crypto-js/enc-hex';
import { randomUUID } from 'node:crypto';
import SHA256 from 'crypto-js/sha256';
import { client } from '$lib/redis';

export const AUTH_SECRET = process.env.AUTH_SECRET || Hex.stringify(SHA256(randomUUID()));

export async function generateToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const oneHour = 60 * 60;
  const token = jwt.sign(
    {
      ok: true,
      iat: now,
      exp: now + oneHour,
    },
    AUTH_SECRET,
  );
  await client.setex(token, oneHour, '1');
  return token;
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const decode = jwt.verify(token, AUTH_SECRET);
    if (!decode) return false;
    const exists = await client.exists(token);
    return exists === 1;
  } catch (e) {
    return false;
  }
}

export async function revokeToken(token: string): Promise<void> {
  await client.del(token);
}

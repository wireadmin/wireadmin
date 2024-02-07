import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { sha256 } from '$lib/hash';
import { client } from '$lib/storage';
import 'dotenv/config';

export const AUTH_SECRET = process.env.AUTH_SECRET || sha256(randomUUID());

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
  client.setex(token, '1', oneHour);
  return token;
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const decode = jwt.verify(token, AUTH_SECRET);
    if (!decode) return false;

    const exists = client.exists(token);
    return exists;
  } catch (e) {
    return false;
  }
}

export async function revokeToken(token: string): Promise<void> {
  client.del(token);
}

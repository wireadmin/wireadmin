import jwt from 'jsonwebtoken';
import 'dotenv/config';
import Hex from 'crypto-js/enc-hex';
import { randomUUID } from 'node:crypto';
import SHA256 from 'crypto-js/sha256';

export const AUTH_SECRET = process.env.AUTH_SECRET || Hex.stringify(SHA256(randomUUID()));

export async function generateToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      ok: true,
      iat: now,
      exp: now + 60 * 60,
    },
    AUTH_SECRET,
  );
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const decode = jwt.verify(token, AUTH_SECRET);
    return !!decode;
  } catch (e) {
    return false;
  }
}

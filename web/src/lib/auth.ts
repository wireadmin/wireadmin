import jwt from 'jsonwebtoken';
import { client } from '$lib/storage';
import { env } from '$lib/env';

export async function generateToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const oneHour = 60 * 60;
  const token = jwt.sign(
    {
      ok: true,
      iat: now,
      exp: now + oneHour,
    },
    env.AUTH_SECRET,
  );
  client.setex(token, '1', oneHour);
  return token;
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const decode = jwt.verify(token, env.AUTH_SECRET);
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

import jwt from 'jsonwebtoken';

import { WG_AUTH_PATH } from '$lib/constants';
import { env } from '$lib/env';
import { storage } from '$lib/storage';
import { sha256 } from '$lib/utils/hash';

interface GenerateTokenParams {
  expiresIn: number;
}

export async function generateToken(params: GenerateTokenParams): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const token = jwt.sign(
    {
      ok: true,
      iat: now,
      exp: now + params.expiresIn,
    },
    env.AUTH_SECRET
  );
  await storage.lpushex(WG_AUTH_PATH, sha256(token), params.expiresIn);
  return token;
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    if (!token || !(await storage.lexists(WG_AUTH_PATH, sha256(token)))) return false;

    return !!jwt.verify(token, env.AUTH_SECRET);
  } catch (e) {
    return false;
  }
}

export async function revokeToken(token: string): Promise<void> {
  if (!token) return;
  const index = await storage
    .lgetall(WG_AUTH_PATH)
    .then((l) => l.findIndex((t) => t === sha256(token)));
  await storage.ldel(WG_AUTH_PATH, index);
}

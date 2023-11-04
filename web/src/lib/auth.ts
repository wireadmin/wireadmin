import jwt from 'jsonwebtoken';
import { AUTH_SECRET } from '$env/static/private';

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

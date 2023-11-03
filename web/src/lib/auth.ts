import jwt from 'jsonwebtoken';
import { AUTH_SECRET } from '$env/static/private';

export async function generateToken(): Promise<string> {
  return jwt.sign('OK', AUTH_SECRET, { expiresIn: '1d' });
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const decode = jwt.verify(token, AUTH_SECRET);
    return !!(decode && decode === 'OK');
  } catch (e) {
    return false;
  }
}

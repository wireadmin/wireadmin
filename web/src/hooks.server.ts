import type { Handle } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth';
import 'dotenv/config';

export const handle: Handle = async ({ event, resolve }) => {
  const { HASHED_PASSWORD } = process.env;

  if (!!HASHED_PASSWORD && !AUTH_EXCEPTION.includes(event.url.pathname)) {
    const token = event.cookies.get('authorization');
    const token_valid = await verifyToken(token ?? '');

    const redirect = new Response(null, { status: 302, headers: { location: '/login' } });
    const is_login_page = event.url.pathname === '/login';

    if (!token_valid && !is_login_page) {
      return redirect;
    }

    if (token_valid && is_login_page) {
      return new Response(null, { status: 302, headers: { location: '/' } });
    }
  }

  return resolve(event);
};

const AUTH_EXCEPTION = ['/api/health'];

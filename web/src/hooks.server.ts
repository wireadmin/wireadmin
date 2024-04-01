import { type Handle, redirect } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth';
import { AUTH_COOKIE } from '$lib/constants';
import 'dotenv/config';

export const handle: Handle = async ({ event, resolve }) => {
  if (!AUTH_EXCEPTION.includes(event.url.pathname)) {
    const token = event.cookies.get(AUTH_COOKIE);
    const token_valid = await verifyToken(token ?? '');

    const is_login_page = event.url.pathname === '/login';
    if (!token_valid && !is_login_page) {
      // return redirect;
      throw redirect(303, '/login');
    }

    if (token_valid && is_login_page) {
      throw redirect(303, '/');
    }
  }

  return resolve(event);
};

const AUTH_EXCEPTION = ['/api/health'];

import 'dotenv/config';

import { redirect, type Handle } from '@sveltejs/kit';

import { verifyToken } from '$lib/auth';
import { AUTH_COOKIE } from '$lib/constants';
import logger from '$lib/logger';

export const handle: Handle = async ({ event, resolve }) => {
  logger.debug(`-> ${event.request.method} ${event.url.pathname}`);

  const token = event.cookies.get(AUTH_COOKIE);
  const token_valid = await verifyToken(token ?? '');

  const is_login_page = event.url.pathname === '/login';
  if (!token_valid && !is_login_page) {
    throw redirect(303, '/login');
  }

  if (token_valid && is_login_page) {
    throw redirect(303, '/');
  }

  return resolve(event);
};

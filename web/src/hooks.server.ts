import type { Handle } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth';
import { HASHED_PASSWORD } from '$env/static/private';

export const handle: Handle = async ({ event, resolve }) => {

  if (!!HASHED_PASSWORD && !AUTH_EXCEPTION.includes(event.url.pathname)) {
    const token = event.cookies.get('authorization');
    const redirect = new Response(null, { status: 302, headers: { location: '/login' } });

    if (!token) {
      console.log('handle', event.url.pathname, 'no token');
      return redirect;
    }

    const token_valid = await verifyToken(token);
    if (!token_valid) {
      console.log('handle', event.url.pathname, 'invalid token');
      return redirect;
    }
  }

  if (event.url.pathname === '/login') {
    console.log('handle', 'already logged in');
    return new Response(null, { status: 302, headers: { location: '/' } });
  }

  const resp = await resolve(event);

  console.log('handle', event.url.pathname, resp.status);

  return resp;
};


const AUTH_EXCEPTION = ['/api/health', '/login'];

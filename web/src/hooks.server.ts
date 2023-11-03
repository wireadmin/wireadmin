import type { Handle } from '@sveltejs/kit';
import { verifyToken } from '$lib/auth';

export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith('/custom')) {
    const resp = new Response('custom response');
    resp.headers.set('content-type', 'text/plain');
    return resp;
  }

  const auth_exception = ['/api/health', '/login'];

  if (!auth_exception.includes(event.url.pathname)) {
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

  const resp = await resolve(event);

  console.log('handle', event.url.pathname, resp.status);

  return resp;
};

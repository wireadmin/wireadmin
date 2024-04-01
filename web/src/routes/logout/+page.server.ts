import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { revokeToken } from '$lib/auth';
import { AUTH_COOKIE } from '$lib/constants';

export const load: PageServerLoad = async ({ cookies }) => {
  const authToken = cookies.get(AUTH_COOKIE);
  if (!!authToken) {
    await revokeToken(authToken).catch(() => {});
  }
  cookies.delete(AUTH_COOKIE, {
    path: '/',
  });
  throw redirect(302, '/login');
};

import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { revokeToken } from '$lib/auth';

export const load: PageServerLoad = async ({ cookies }) => {
  if (!!cookies.get('authorization')) {
    const token = cookies.get('authorization')!;
    await revokeToken(token).catch(() => {});
  }
  cookies.delete('authorization', {
    path: '/',
  });
  throw redirect(302, '/login');
};

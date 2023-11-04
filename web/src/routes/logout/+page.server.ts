import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = ({ cookies }) => {
  cookies.delete('authorization');
  throw redirect(302, '/login');
};

import type {  Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    return { message: 'Success!' };
  },
};

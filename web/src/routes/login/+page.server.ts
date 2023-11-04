import { type Actions, fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms/server';
import { formSchema } from './schema';
import { HASHED_PASSWORD } from '$env/static/private';
import { generateToken } from '$lib/auth';

export const load: PageServerLoad = () => {
  return {
    form: superValidate(formSchema),
  };
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const password = data.get('password') ?? '';

    if (HASHED_PASSWORD.toLowerCase() !== Buffer.from(password.toString()).toString('hex').toLowerCase()) {
      console.warn('auth failed');
      return fail(401, { message: 'Unauthorized' });
    }

    const token = await generateToken();
    cookies.set('authorization', token);

    console.info('logged in.');
    return { message: 'Success!' };
  },
};

import { fail } from '@sveltejs/kit';
import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { setError, superValidate } from 'sveltekit-superforms/server';
import { formSchema } from './schema';
import { HASHED_PASSWORD } from '$env/static/private';
import { generateToken } from '$lib/auth';

export const load: PageServerLoad = () => {
  return {
    form: superValidate(formSchema),
  };
};

export const actions: Actions = {
  default: async (event) => {
    const form = await superValidate(event, formSchema);

    if (!form.valid) {
      return fail(400, { ok: false, message: 'Bad Request', form });
    }

    const { password } = form.data;

    if (HASHED_PASSWORD.toLowerCase() !== Buffer.from(password.toString()).toString('hex').toLowerCase()) {
      return setError(form, 'password', 'Incorrect password.');
    }

    const token = await generateToken();
    event.cookies.set('authorization', token);

    return { ok: true };
  },
};

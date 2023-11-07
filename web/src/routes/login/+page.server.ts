import type { Actions } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { setError, superValidate } from 'sveltekit-superforms/server';
import { formSchema } from './schema';
import { generateToken } from '$lib/auth';
import 'dotenv/config';

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

    const { HASHED_PASSWORD } = process.env;
    if (HASHED_PASSWORD) {
      const { password } = form.data;

      const hashed = HASHED_PASSWORD.toLowerCase();
      const receivedHashed = Buffer.from(password.toString()).toString('hex').toLowerCase();

      if (hashed !== receivedHashed) {
        console.log('[+] TEST ONLY', password, hashed, receivedHashed);
        return setError(form, 'password', 'Incorrect password.');
      }
    }

    if (!HASHED_PASSWORD) {
      console.warn('No password is set!');
    }

    const token = await generateToken();
    event.cookies.set('authorization', token);

    return { ok: true };
  },
};

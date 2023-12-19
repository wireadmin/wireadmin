import type { Actions } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { setError, superValidate } from 'sveltekit-superforms/server';
import { formSchema } from './schema';
import { generateToken } from '$lib/auth';
import 'dotenv/config';
import logger from '$lib/logger';

export const load: PageServerLoad = () => {
  return {
    form: superValidate(formSchema),
  };
};

export const actions: Actions = {
  default: async (event) => {
    const { cookies } = event;
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
        return setError(form, 'password', 'Incorrect password.');
      }
    }

    if (!HASHED_PASSWORD) {
      logger.warn('No password is set!');
    }

    const token = await generateToken();

    const { ORIGIN } = process.env;

    const secure = ORIGIN?.startsWith('https://') ?? false;
    cookies.set('authorization', token, {
      secure,
      httpOnly: true,
      path: '/',
    });

    return { form, ok: true };
  },
};

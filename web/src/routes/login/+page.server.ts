import type { Actions } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { setError, superValidate } from 'sveltekit-superforms';
import { formSchema } from './schema';
import { generateToken } from '$lib/auth';
import logger from '$lib/logger';
import { zod } from 'sveltekit-superforms/adapters';
import { env } from '$lib/env';
import { AUTH_COOKIE } from '$lib/constants';

export const load: PageServerLoad = async () => {
  return {
    form: await superValidate(zod(formSchema)),
  };
};

export const actions: Actions = {
  default: async (event) => {
    const { cookies } = event;
    const form = await superValidate(event, zod(formSchema));

    if (!form.valid) {
      return fail(400, { ok: false, message: 'Bad Request', form });
    }

    const { HASHED_PASSWORD } = env;
    if (HASHED_PASSWORD && HASHED_PASSWORD !== '') {
      const { password } = form.data;

      const hashed = HASHED_PASSWORD.toLowerCase();
      const receivedHashed = Buffer.from(password.toString()).toString('hex').toLowerCase();

      if (hashed !== receivedHashed) {
        return setError(form, 'password', 'Incorrect password.');
      }
    } else {
      logger.warn('No password is set!');
    }

    const token = await generateToken();

    const secure = env.ORIGIN?.startsWith('https://') ?? false;
    cookies.set(AUTH_COOKIE, token, {
      secure,
      httpOnly: true,
      path: '/',
    });

    return { form, ok: true };
  },
};

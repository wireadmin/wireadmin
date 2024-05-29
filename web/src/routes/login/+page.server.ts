import { error, fail, type Actions } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { generateToken } from '$lib/auth';
import { AUTH_COOKIE } from '$lib/constants';
import { env } from '$lib/env';
import logger, { errorBox } from '$lib/logger';
import { sha256 } from '$lib/utils/hash';

import type { PageServerLoad } from './$types';
import { formSchema } from './schema';

export const load: PageServerLoad = async () => {
  return {
    form: await superValidate(zod(formSchema)),
  };
};

export const actions: Actions = {
  default: async (event) => {
    try {
      const { cookies } = event;
      const form = await superValidate(event, zod(formSchema));

      if (!form.valid) {
        logger.warn('Action: Login: failed to validate form.');
        return fail(400, { ok: false, message: 'Bad Request', form });
      }

      const { ADMIN_PASSWORD } = env;
      const { password } = form.data;

      if (sha256(ADMIN_PASSWORD).toLowerCase() !== sha256(password).toLowerCase()) {
        logger.debug('Action: Login: failed to validate password.');
        return setError(form, 'password', 'Incorrect password.');
      }

      logger.debug(`Action: Login: success. generating token.`);
      const hour = 60 * 60;
      const token = await generateToken({ expiresIn: hour });

      cookies.set(AUTH_COOKIE, token, {
        maxAge: hour,
        httpOnly: true,
        path: '/',
      });

      return { form, ok: true };
    } catch (e) {
      errorBox(e);
      throw error(500, 'Unhandled Exception');
    }
  },
};

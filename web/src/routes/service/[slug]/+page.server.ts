import { error, type Actions } from '@sveltejs/kit';

import logger, { errorBox } from '$lib/logger';
import { clearLogs, getService, logs, restart, type ServiceName } from '$lib/services';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const service = getService(params.slug);

  if (!service) {
    logger.error(`Service not found. Service: ${params.slug}`);
    throw error(404, { message: 'Not found' });
  }

  return {
    slug: params.slug,
    title: service.name,
  };
};

export const actions: Actions = {
  clearLogs: async ({ params }) => {
    const { slug } = params as { slug: ServiceName };
    try {
      await clearLogs(slug);
      return {};
    } catch (e) {
      errorBox(e);
      throw error(500, 'Unhandled Exception');
    }
  },
  logs: async ({ params }) => {
    const { slug } = params as { slug: ServiceName };
    try {
      return { logs: await logs(slug) };
    } catch (e) {
      errorBox(e);
      throw error(500, 'Unhandled Exception');
    }
  },
  restart: async ({ params }) => {
    const { slug } = params as { slug: ServiceName };
    try {
      const success = restart(slug);

      return { success };
    } catch (e) {
      errorBox(e);
      throw error(500, 'Unhandled Exception');
    }
  },
};

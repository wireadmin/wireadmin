import { type Actions, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import logger from '$lib/logger';
import { execa } from 'execa';
import { promises } from 'node:fs';
import { restart, type ServiceName, SERVICES } from '$lib/services';

export const load: PageServerLoad = async ({ params }) => {
  const { serviceName } = params as { serviceName: ServiceName | undefined };

  if (!serviceName || !SERVICES[serviceName]) {
    logger.error('Service not found. service:', serviceName);
    throw error(404, 'Not Found');
  }

  const { name } = SERVICES[serviceName];

  return {
    slug: params.serviceName,
    title: name,
  };
};

export const actions: Actions = {
  clearLogs: async ({ params }) => {
    const { serviceName } = params;

    try {
      await promises.writeFile(`/var/vlogs/${serviceName}`, '');
      return {};
    } catch (e) {
      logger.error(e);
      throw error(500, 'Unhandled Exception');
    }
  },
  logs: async ({ params }) => {
    const { serviceName } = params as { serviceName: ServiceName | undefined };

    if (!serviceName || !SERVICES[serviceName]) {
      logger.error('Service not found. service:', serviceName);
      throw error(404, 'Not Found');
    }

    const service = SERVICES[serviceName];

    try {
      const { stdout } = await execa(service.command.logs, { shell: true });
      return { logs: stdout };
    } catch (e) {
      logger.error(e);
      throw error(500, 'Unhandled Exception');
    }
  },
  restart: async ({ params }) => {
    const { serviceName } = params as { serviceName: ServiceName | undefined };

    if (!serviceName || !SERVICES[serviceName]) {
      logger.error('Service not found. service:', serviceName);
      throw error(404, 'Not Found');
    }

    try {
      const success = restart(serviceName!);

      return { success };
    } catch (e) {
      logger.error(e);
      throw error(500, 'Unhandled Exception');
    }
  },
};

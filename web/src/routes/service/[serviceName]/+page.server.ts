import { type Actions, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import logger from '$lib/logger';
import { execa } from 'execa';
import { promises } from 'node:fs';

const services: Record<string, Service> = {
  tor: {
    name: 'Tor',
    command: {
      restart: 'screen -L -Logfile /var/vlogs/tor -dmS "tor" tor -f /etc/tor/torrc',
      logs: 'logs tor',
    },
  },
  redis: {
    name: 'Redis',
    command: {
      restart:
        'screen -L -Logfile /var/vlogs/redis -dmS "redis" bash -c "redis-server --port 6479 --daemonize no --dir /data --appendonly yes"',
      logs: 'logs redis',
    },
  },
};

interface Service {
  name: string;
  command: {
    restart: string;
    logs: string;
  };
}

export const load: PageServerLoad = async ({ params }) => {
  if (!params.serviceName || !services[params.serviceName]) {
    throw error(404, 'Not Found');
  }

  return {
    slug: params.serviceName,
    title: services[params.serviceName].name,
  };
};

export const actions: Actions = {
  clearLogs: async ({ request, params }) => {
    const { serviceName } = params;

    try {
      await promises.writeFile(`/var/vlogs/${serviceName}`, '');
      return {};
    } catch (e) {
      logger.error(e);
      throw error(500, 'Unhandled Exception');
    }
  },
  logs: async ({ request, params }) => {
    const { serviceName } = params;

    try {
      const { stdout } = await execa(services[serviceName!].command.logs, { shell: true });
      return { logs: stdout };
    } catch (e) {
      logger.error(e);
      throw error(500, 'Unhandled Exception');
    }
  },
  restart: async ({ request, params }) => {
    const { serviceName } = params;

    try {
      await execa(services[serviceName!].command.restart, { shell: true });
      return {};
    } catch (e) {
      logger.error(e);
      throw error(500, 'Unhandled Exception');
    }
  },
};

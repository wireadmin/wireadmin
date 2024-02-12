import { type Actions, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import logger from '$lib/logger';
import { execa } from 'execa';
import { promises } from 'node:fs';

const services: Record<string, Service> = {
  tor: {
    name: 'Tor',
    command: {
      start: 'screen -L -Logfile /var/vlogs/tor -dmS "tor" tor -f /etc/tor/torrc',
      stop: 'pkill tor',
      logs: 'logs tor',
    },
  },
};

interface Service {
  name: string;
  command: {
    start: string;
    stop: string;
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

function restartService(serviceName: string) {
  // Stop
  const { exitCode: stopExitCode } = execa(services[serviceName].command.stop, { shell: true });

  // Start
  const { exitCode: startExitCode } = execa(services[serviceName].command.start, { shell: true });

  logger.info({
    message: `Restarted ${serviceName} service`,
    stopExitCode,
    startExitCode,
  });

  return {
    stopExitCode,
    startExitCode,
  };
}

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
      const { stopExitCode, startExitCode } = restartService(serviceName!);
      return { stopExitCode, startExitCode };
    } catch (e) {
      logger.error(e);
      throw error(500, 'Unhandled Exception');
    }
  },
};

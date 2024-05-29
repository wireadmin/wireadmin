import { promises } from 'node:fs';
import { error, type Actions } from '@sveltejs/kit';
import { execa } from 'execa';

import logger from '@lib/logger';
import { clearLogs, logs, restart, SERVICES, type ServiceName } from '@lib/services';

export const actions: Actions = {
  clearLogs: async ({ params }) => {
    try {
      await clearLogs('tor');
      return {};
    } catch (e) {
      logger.error(e);
      throw error(500, 'Unhandled Exception');
    }
  },
  logs: async ({ params }) => {
    try {
      return { logs: await logs('tor') };
    } catch (e) {
      logger.error(e);
      throw error(500, 'Unhandled Exception');
    }
  },
  restart: async ({ params }) => {
    try {
      const success = restart('tor');

      return { success };
    } catch (e) {
      logger.error(e);
      throw error(500, 'Unhandled Exception');
    }
  },
};

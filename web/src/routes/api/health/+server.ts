import type { RequestHandler } from '@sveltejs/kit';
import { getServers, WGServer } from '$lib/wireguard';
import logger from '$lib/logger';

export const GET: RequestHandler = async () => {
  try {
    for (const { id } of await getServers()) {
      const wg = new WGServer(id);
      const server = await wg.get();
      const hasInterface = await wg.isUp();

      // If the server is up and the interface doesn't exist, start it
      if (server.status === 'up' && !hasInterface) {
        await wg.start();
      }

      if (server.status === 'down' && hasInterface) {
        await wg.stop();
      }
    }
  } catch (e) {
    logger.error('APIFailed: HealthCheck:', e);
    return new Response('FAILED', { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }

  return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
};

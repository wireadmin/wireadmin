import type { RequestHandler } from '@sveltejs/kit';
import { getConfigHash, getServers, WGServer } from '$lib/wireguard';
import logger from '$lib/logger';

export const GET: RequestHandler = async () => {
  try {
    const servers = await getServers();

    for (const s of servers) {
      const wg = new WGServer(s.id);

      // Start server
      if (s.status === 'up') {
        await wg.start();
      }
    }
  } catch (e) {
    logger.error('APIFailed: HealthCheck:', e);
    return new Response('FAILED', { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }

  return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
};

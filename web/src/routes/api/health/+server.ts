import type { RequestHandler } from '@sveltejs/kit';
import { getConfigHash, getServers, WGServer } from '$lib/wireguard';
import logger from '$lib/logger';

export const GET: RequestHandler = async () => {
  try {
    const servers = await getServers();

    for (const s of servers) {
      const HASH = getConfigHash(s.confId);
      if (s.confId && HASH && s.confHash === HASH) {
        // Skip, due to no changes on the config
        continue;
      }

      // Start server
      if (s.status === 'up') {
        await WGServer.start(s.id);
      }
    }
  } catch (e) {
    logger.error('APIFailed: HealthCheck:', e);
    return new Response('FAILED', { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }

  return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
};

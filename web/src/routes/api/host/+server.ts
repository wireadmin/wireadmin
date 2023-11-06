import type { RequestHandler } from '@sveltejs/kit';
import { WG_HOST } from '$env/static/private';
import Shell from '$lib/shell';

export const GET: RequestHandler = async () => {

  let HOSTNAME = WG_HOST;

  // if the host is not set, then we are using the server's public IP
  if (!HOSTNAME) {
    const resp = await Shell.exec('curl -s ifconfig.me', true);
    HOSTNAME = resp.trim();
  }

  // check if WG_HOST is still not set
  if (!HOSTNAME) {
    console.error('WG_HOST is not set');
    return new Response('NOT_SET', { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }

  return new Response(HOSTNAME, { status: 200, headers: { 'Content-Type': 'text/plain' } });
};

import { type Actions, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { findServer, WGServer } from '$lib/wireguard';
import { NameSchema } from '$lib/wireguard/schema';

export const load: PageServerLoad = async ({ params }) => {
  const { serverId } = params;
  const server = await findServer(serverId);

  if (server) {
    return { server };
  }

  throw error(404, 'Not found');
};

export const actions: Actions = {
  rename: async ({ request, params }) => {
    const { serverId } = params;

    const server = await findServer(serverId ?? '');
    if (!server) {
      console.error('Server not found');
      return error(404, 'Not found');
    }


    const form = await request.formData();
    const peerId = (form.get('id') ?? '').toString();
    const peer = server.peers.find((p) => p.id === peerId);
    if (!peer) {
      console.error('Peer not found');
      return error(404, 'Not found');
    }

    const name = (form.get('name') ?? '').toString();
    if (!NameSchema.safeParse(name).success) {
      console.error('Peer name is invalid');
      return error(400, 'Bad Request');
    }

    await WGServer.updatePeer(server.id, peer.publicKey, { name });

    return { ok: true };
  },
};

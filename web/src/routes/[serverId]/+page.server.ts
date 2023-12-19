import { type Actions, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { findServer, generateWgKey, WGServer } from '$lib/wireguard';
import { NameSchema } from '$lib/wireguard/schema';
import { setError, superValidate } from 'sveltekit-superforms/server';
import { CreatePeerSchema } from './schema';
import logger from '$lib/logger';

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
      logger.error('Server not found');
      throw error(404, 'Not found');
    }

    const form = await request.formData();
    const peerId = (form.get('id') ?? '').toString();
    const peer = server.peers.find((p) => p.id === peerId);
    if (!peer) {
      logger.error('Peer not found');
      throw error(404, 'Not found');
    }

    const name = (form.get('name') ?? '').toString();
    if (!NameSchema.safeParse(name).success) {
      logger.error('Peer name is invalid');
      throw error(400, 'Bad Request');
    }

    try {
      await WGServer.updatePeer(server.id, peer.publicKey, { name });

      return { ok: true };
    } catch (e) {
      logger.error('Exception:', e);
      throw error(500, 'Unhandled Exception');
    }
  },
  remove: async ({ request, params }) => {
    const { serverId } = params;

    const server = await findServer(serverId ?? '');
    if (!server) {
      console.error('Server not found');
      throw error(404, 'Not found');
    }

    try {
      const form = await request.formData();
      const peerId = (form.get('id') ?? '').toString();
      const peer = server.peers.find((p) => p.id === peerId);
      if (peer) {
        await WGServer.removePeer(server.id, peer.publicKey);
      }

      return { ok: true };
    } catch (e) {
      console.error('Exception:', e);
      throw error(500, 'Unhandled Exception');
    }
  },
  'remove-server': async ({ params }) => {
    const { serverId } = params;

    try {
      const server = await findServer(serverId ?? '');
      if (server) {
        await WGServer.remove(server.id);
      }

      return { ok: true };
    } catch (e) {
      console.error('Exception:', e);
      throw error(500, 'Unhandled Exception');
    }
  },
  'change-server-state': async ({ request, params }) => {
    const { serverId } = params;

    const server = await findServer(serverId ?? '');
    if (!server) {
      console.error('Server not found');
      throw error(404, 'Not found');
    }

    const form = await request.formData();
    const status = (form.get('state') ?? '').toString();

    try {
      if (server.status !== status) {
        switch (status) {
          case 'start':
            await WGServer.start(server.id);
            break;

          case 'stop':
            await WGServer.stop(server.id);
            break;

          case 'remove':
            await WGServer.remove(server.id);
            break;

          case 'restart':
            await WGServer.stop(server.id);
            await WGServer.start(server.id);
            break;
        }
      }

      return { ok: true };
    } catch (e) {
      console.error('Exception:', e);
      throw error(500, 'Unhandled Exception');
    }
  },
  create: async (event) => {
    const form = await superValidate(event, CreatePeerSchema);
    if (!form.valid) {
      return setError(form, 'Bad Request');
    }

    const { serverId } = event.params;
    const { name } = form.data;

    try {
      const server = await findServer(serverId ?? '');
      if (!server) {
        console.error('Server not found');
        return setError(form, 'Server not found');
      }

      const freeAddress = await WGServer.getFreePeerIp(server.id);
      if (!freeAddress) {
        console.error(`ERR: ServerId: ${serverId};`, 'No free addresses;');
        return setError(form, 'No free addresses');
      }

      const peerKeys = await generateWgKey();

      const addedPeer = await WGServer.addPeer(server.id, {
        id: crypto.randomUUID(),
        name,
        allowedIps: freeAddress,
        publicKey: peerKeys.publicKey,
        privateKey: peerKeys.privateKey,
        preSharedKey: peerKeys.preSharedKey,
        persistentKeepalive: 0,
      });

      if (!addedPeer) {
        console.error(`ERR: ServerId: ${serverId};`, 'Failed to add peer;');
        return setError(form, 'Failed to add peer');
      }

      return { ok: true };
    } catch (e) {
      console.error('Exception:', e);
      return setError(form, 'Unhandled Exception');
    }
  },
};

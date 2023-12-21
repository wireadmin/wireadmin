import { type Actions, error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { findServer, generateWgKey, WGServer } from '$lib/wireguard';
import { NameSchema } from '$lib/wireguard/schema';
import { setError, superValidate } from 'sveltekit-superforms/server';
import { CreatePeerSchema } from './schema';
import logger from '$lib/logger';

export const load: PageServerLoad = async ({ params }) => {
  const { serverId } = params;
  const exists = await WGServer.exists(serverId ?? '');

  if (exists) {
    const wg = new WGServer(serverId);
    const server = await wg.get();

    if (server.status === 'up') {
      const hasInterface = await wg.hasInterface();
      if (!hasInterface) {
        await wg.start();
      }
    }

    const usage = await wg.getUsage();

    return {
      server,
      usage,
    };
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
      const wg = new WGServer(server.id);
      await wg.peers.update(peer.publicKey, { name });

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
        const wg = new WGServer(server.id);
        await wg.peers.remove(peer.publicKey);
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
        const wg = new WGServer(server.id);
        await wg.remove();
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
      logger.error('Action: ChangeState: Server not found');
      throw redirect(303, '/');
    }

    const form = await request.formData();
    const status = (form.get('state') ?? '').toString();

    const wg = new WGServer(server.id);

    try {
      if (server.status !== status) {
        switch (status) {
          case 'start':
            await wg.start();
            break;

          case 'stop':
            await wg.stop();
            break;

          case 'remove':
            await wg.remove();
            break;

          case 'restart':
            await wg.stop();
            await wg.start();
            break;
        }
      }

      return { ok: true };
    } catch (e) {
      logger.error('Exception: ChangeState:', e);
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

      const wg = new WGServer(server.id);
      const addedPeer = await wg.peers.add({
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

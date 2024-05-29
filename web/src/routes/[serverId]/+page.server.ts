import { error, redirect, type Actions } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import logger, { errorBox } from '$lib/logger';
import { WG_STORE } from '$lib/storage';
import { generateWgKey, WGServer } from '$lib/wireguard';
import { NameSchema } from '$lib/wireguard/schema';

import type { PageServerLoad } from './$types';
import { createPeerSchema } from './schema';

export const load: PageServerLoad = async ({ params }) => {
  const { serverId } = params;

  const exists = await WGServer.exists(serverId ?? '');
  if (!exists) {
    logger.warn(`Server not found. Redirecting to home page. ServerId: ${serverId}`);
    error(404, { message: 'Not found' });
  }

  const wg = new WGServer(serverId);
  const server = await wg.get();

  if (server.status === 'up') {
    const hasInterface = await wg.isUp();
    if (!hasInterface) {
      logger.debug(`Interface not found. Starting WireGuard. ServerId: ${serverId}`);
      await wg.start();
    }
  }

  const usage = await wg.getUsage();

  return {
    server,
    usage,
    form: await superValidate(zod(createPeerSchema)),
  };
};

export const actions: Actions = {
  rename: async ({ request, params }) => {
    const { serverId } = params;
    const server = await WG_STORE.get(serverId ?? '');
    if (!server) {
      logger.error(`Actions: Rename: Server not found. ServerId: ${serverId}`);
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
      errorBox(e);
      throw error(500, 'Unhandled Exception');
    }
  },
  remove: async ({ request, params }) => {
    const { serverId } = params;

    const server = await WG_STORE.get(serverId ?? '');
    if (!server) {
      logger.error(`Actions: Remove: Server not found. ServerId: ${serverId}`);
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
      errorBox(e);
      throw error(500, 'Unhandled Exception');
    }
  },
  'remove-server': async ({ params }) => {
    const { serverId } = params;

    try {
      const server = await WG_STORE.get(serverId ?? '');
      if (server) {
        const wg = new WGServer(server.id);
        await wg.remove();
      }
    } catch (e) {
      errorBox(e);
      throw error(500, 'Unhandled Exception');
    }

    return redirect(303, '/');
  },
  'change-server-state': async ({ request, params }) => {
    const { serverId } = params;

    const server = await WG_STORE.get(serverId ?? '');
    if (!server) {
      logger.warn(`Action: ChangeState: Server not found. ServerId: ${serverId}`);
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
    } catch (e) {
      logger.error({
        message: `Exception: ChangeState. ServerId: ${serverId}`,
        exception: e,
      });
      throw error(500, 'Unhandled Exception');
    }

    return { ok: true };
  },
  create: async (event) => {
    const form = await superValidate(event, zod(createPeerSchema));
    if (!form.valid) {
      logger.warn('Action: Create: failed to validate form.');
      return setError(form, 'Bad Request');
    }

    const { serverId } = event.params;
    const { name } = form.data;

    try {
      const server = await WG_STORE.get(serverId ?? '');
      if (!server) {
        logger.error(`Action: Create: Server not found. ServerId: ${serverId}`);
        return setError(form, 'Server not found');
      }

      const freeAddress = await WGServer.getFreePeerIp(server.id);
      if (!freeAddress) {
        logger.error('No free addresses.');
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
        logger.error(`Action: Create: Failed to add peer. ServerId: ${serverId}`);
        return setError(form, 'Failed to add peer');
      }

      return { form };
    } catch (e) {
      errorBox(e);
      return setError(form, 'Unhandled Exception');
    }
  },
};

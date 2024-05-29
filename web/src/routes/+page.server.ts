import { error, fail, type Actions } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import logger, { errorBox } from '$lib/logger';
import { WG_STORE } from '$lib/storage';
import { generateWgServer, isIPReserved, isPortReserved, WGServer } from '$lib/wireguard';
import { NameSchema } from '$lib/wireguard/schema';

import type { PageServerLoad } from './$types';
import { createServerSchema } from './schema';

export const load: PageServerLoad = async () => {
  return {
    servers: await WG_STORE.listServers(),
    form: await superValidate(zod(createServerSchema)),
  };
};

export const actions: Actions = {
  rename: async ({ request, params }) => {
    const form = await request.formData();
    const serverId = (form.get('id') ?? '').toString();
    const name = (form.get('name') ?? '').toString();

    const server = await WG_STORE.get(serverId);
    if (!server) {
      logger.error(`WebUI: Actions: RenameServer: Server not found. Id: ${serverId}`);
      throw error(404, 'Not found');
    }

    if (!NameSchema.safeParse(name).success) {
      logger.error('Actions: RenameServer: Server name is invalid');
      throw error(400, 'Bad Request');
    }

    const wg = new WGServer(server.id);
    await wg.update({ name });

    return { ok: true };
  },
  create: async (event) => {
    const form = await superValidate(event, zod(createServerSchema));
    if (!form.valid) {
      return fail(400, {
        form,
      });
    }

    const { name, address, tor = false, port, dns, mtu = '1350' } = form.data;

    try {
      if (await isIPReserved(address)) {
        return setError(form, 'address', `IP ${address} is already reserved!`);
      }

      if (await isPortReserved(Number(port))) {
        return setError(form, 'port', `Port ${port} is already reserved!`);
      }

      const serverId = await generateWgServer({
        name,
        address,
        port: Number(port),
        tor,
        mtu: Number(mtu),
        dns,
      });

      return {
        form,
        serverId,
      };
    } catch (e) {
      errorBox(e);
      return setError(form, 'Unhandled Exception');
    }
  },
};

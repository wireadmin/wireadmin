import { type Actions, error, fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
  findServer,
  generateWgServer,
  getServers,
  isIPReserved,
  isPortReserved,
  WGServer,
} from '$lib/wireguard';
import { setError, superValidate } from 'sveltekit-superforms';
import { createServerSchema } from './schema';
import { NameSchema } from '$lib/wireguard/schema';
import logger from '$lib/logger';
import { zod } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async () => {
  return {
    servers: getServers(),
    form: await superValidate(zod(createServerSchema)),
  };
};

export const actions: Actions = {
  rename: async ({ request, params }) => {
    const form = await request.formData();
    const serverId = (form.get('id') ?? '').toString();
    const name = (form.get('name') ?? '').toString();

    const server = await findServer(serverId ?? '');
    if (!server) {
      logger.error('Actions: RenameServer: Server not found');
      return error(404, 'Not found');
    }

    if (!NameSchema.safeParse(name).success) {
      logger.error('Actions: RenameServer: Server name is invalid');
      return error(400, 'Bad Request');
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
      logger.error(e);
      return setError(form, 'Unhandled Exception');
    }
  },
};

import { type Actions, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
  findServer,
  generateWgServer,
  getServers,
  isIPReserved,
  isPortReserved,
  WGServer,
} from '$lib/wireguard';
import { setError, superValidate } from 'sveltekit-superforms/server';
import { CreateServerSchema } from './schema';
import { NameSchema } from '$lib/wireguard/schema';

export const load: PageServerLoad = async () => {
  return {
    servers: (await getServers()).map((s) => s),
    form: superValidate(CreateServerSchema),
  };
};

export const actions: Actions = {
  rename: async ({ request, params }) => {
    const form = await request.formData();
    const serverId = (form.get('id') ?? '').toString();
    const name = (form.get('name') ?? '').toString();

    const server = await findServer(serverId ?? '');
    if (!server) {
      console.error('Server not found');
      return error(404, 'Not found');
    }

    if (!NameSchema.safeParse(name).success) {
      console.error('Peer name is invalid');
      return error(400, 'Bad Request');
    }

    await WGServer.update(server.id, { name });

    return { ok: true };
  },
  create: async (event) => {
    const form = await superValidate(event, CreateServerSchema);
    if (!form.valid) {
      return setError(form, 'Bad Request');
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
        ok: true,
        serverId,
      };
    } catch (e: any) {
      console.error('Exception:', e);
      return setError(form, 'Unhandled Exception');
    }
  },
};

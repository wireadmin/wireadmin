import { type Actions, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { findServer, getServers, WGServer } from '$lib/wireguard';
import { superValidate } from 'sveltekit-superforms/server';
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
};

import { json, type RequestHandler } from '@sveltejs/kit';

import { errorBox } from '$lib/logger';
import { getService } from '$lib/services';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const service = getService(params.service);
    if (!service) {
      return json({ healthy: false });
    }
    const healthy = await service.health();

    return json({ healthy });
  } catch (e) {
    errorBox(e);
    return json({ healthy: false });
  }
};

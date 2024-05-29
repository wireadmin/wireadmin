import { z } from 'zod';

import { NameSchema } from '$lib/wireguard/schema';

export const createPeerSchema = z.object({
  name: NameSchema,
});

export type CreatePeerSchemaType = typeof createPeerSchema;

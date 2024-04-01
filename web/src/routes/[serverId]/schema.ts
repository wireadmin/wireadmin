import { NameSchema } from '$lib/wireguard/schema';
import { z } from 'zod';

export const createPeerSchema = z.object({
  name: NameSchema,
});

export type CreatePeerSchemaType = typeof createPeerSchema;

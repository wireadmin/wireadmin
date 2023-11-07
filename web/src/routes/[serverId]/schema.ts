import { NameSchema } from '$lib/wireguard/schema';
import { z } from 'zod';

export const CreatePeerSchema = z.object({
  name: NameSchema,
});

export type CreatePeerSchemaType = typeof CreatePeerSchema;

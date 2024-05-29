import { z } from 'zod';

import {
  AddressSchema,
  DnsSchema,
  MtuSchema,
  NameSchema,
  PortSchema,
  TorSchema,
} from '$lib/wireguard/schema';

export const createServerSchema = z.object({
  name: NameSchema,
  address: AddressSchema,
  port: PortSchema,
  tor: TorSchema,
  dns: DnsSchema,
  mtu: MtuSchema,
});

export type CreateServerSchemaType = typeof createServerSchema;

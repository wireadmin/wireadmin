import { z } from 'zod';
import { AddressSchema, DnsSchema, MtuSchema, NameSchema, PortSchema, TypeSchema } from '$lib/wireguard/schema';

export const CreateServerSchema = z.object({
  name: NameSchema,
  address: AddressSchema,
  port: PortSchema,
  type: TypeSchema,
  dns: DnsSchema,
  mtu: MtuSchema,
});

export type CreateServerSchemaType = typeof CreateServerSchema;
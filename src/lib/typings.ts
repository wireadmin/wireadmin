import { z } from "zod";
import type React from "react";
import { IPV4_REGEX } from "@lib/constants";
import { NextApiRequest as TNextApiRequest } from "next/dist/shared/lib/utils";
import { NameSchema } from "@lib/schemas/WireGuard";

export const WgKeySchema = z.object({
  privateKey: z.string(),
  publicKey: z.string(),
  preSharedKey: z.string(),
})

export type WgKey = z.infer<typeof WgKeySchema>

const WgPeerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().regex(/^[A-Za-z\d\s]{3,32}$/),
  preSharedKey: z.string(),
  endpoint: z.string(),
  address: z.string().regex(IPV4_REGEX),
  latestHandshakeAt: z.string().nullable(),
  transferRx: z.number().nullable(),
  transferTx: z.number().nullable(),
  persistentKeepalive: z.number().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  enabled: z.boolean(),
})
   .merge(WgKeySchema)

export type WgPeer = z.infer<typeof WgPeerSchema>

export const PeerSchema = z.object({
  id: z.string().uuid(),
  name: NameSchema,
  preSharedKey: z.string().nullable(),
  allowedIps: z.string().regex(IPV4_REGEX),
  persistentKeepalive: z.number().nullable(),
})
   .merge(WgKeySchema)

export type Peer = z.infer<typeof PeerSchema>

export const WgServerSchema = z.object({
  id: z.string().uuid(),
  confId: z.number(),
  type: z.enum([ 'direct', 'bridge', 'tor' ]),
  name: NameSchema,
  address: z.string().regex(IPV4_REGEX),
  listen: z.number(),
  preUp: z.string().nullable(),
  postUp: z.string().nullable(),
  preDown: z.string().nullable(),
  postDown: z.string().nullable(),
  dns: z.string().regex(IPV4_REGEX).nullable(),
  peers: z.array(PeerSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  status: z.enum([ 'up', 'down' ]),
})
   .merge(WgKeySchema.omit({ preSharedKey: true }))

export type WgServer = z.infer<typeof WgServerSchema>

export type ReactHTMLProps<T extends HTMLElement> = React.DetailedHTMLProps<React.HTMLAttributes<T>, T>

export type APIErrorResponse = {
  ok: false
  details: string
}

export type APISuccessResponse<D> = {
  ok: true
  result: D
}

export type APIResponse<D, N extends boolean = false> = N extends true ? D : APIErrorResponse | APISuccessResponse<D>

export type NextApiRequest<
   P = Record<string, string | string[] | undefined>,
   Q = Record<string, string | string[] | undefined>
> = Omit<TNextApiRequest, 'query'> & {
  query: Partial<Q> & P
}

export type LeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];

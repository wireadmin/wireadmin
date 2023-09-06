import { z } from "zod";

const WgPeerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().regex(/^[A-Za-z\d\s]{3,32}$/),
  publicKey: z.string(),
  privateKey: z.string(),
  preSharedKey: z.string(),
  endpoint: z.string(),
  address: z.string(),
  latestHandshakeAt: z.string().nullable(),
  transferRx: z.number().nullable(),
  transferTx: z.number().nullable(),
  persistentKeepalive: z.number().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  enabled: z.boolean(),
})

export type WgPeer = z.infer<typeof WgPeerSchema>

// gPmJda6TojTSaJZmsEJjDINKLX+WwMZJch/GNv75R2A=

export interface WgKey {
  privateKey: string
  publicKey: string
}

export interface WgPeerConfig {
  publicKey: string
  preSharedKey: string
  endpoint: string
  allowedIps: string[]
  persistentKeepalive: number | null
}

export interface WgServer {
  id: string
  name: string
  address: string
  listen: number
}

export interface WgServerConfig {
  privateKey: string
  address: string
  listen: number
  preUp: string | null
  postUp: string | null
  preDown: string | null
  postDown: string | null
  dns: string | null
  mtu: number
}

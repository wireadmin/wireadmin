import type { NextApiRequest, NextApiResponse } from "next";
import safeServe from "@lib/safe-serve";
import { findServer, WGServer } from "@lib/wireguard";
import { z } from "zod";
import { ClientId, NameSchema, ServerId } from "@lib/schemas/WireGuard";
import { WgServer } from "@lib/typings";
import { zodErrorToResponse } from "@lib/zod";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return safeServe(res, async () => {

    const parsed = RequestSchema.safeParse(req.query)
    if (!parsed.success) {
      return zodErrorToResponse(res, parsed.error)
    }

    const { serverId, clientId } = req.query as z.infer<typeof RequestSchema>
    const server = await findServer(serverId)
    if (!server) {
      return res
         .status(404)
         .json({ ok: false, message: 'Not Found' })
    }

    const peer = server.peers.find((p) => p.id === clientId)
    if (!peer) {
      return res
         .status(404)
         .json({ ok: false, message: 'Not Found' })
    }

    if (req.method === 'GET') {
      return res
         .status(200)
         .json({ ok: true, result: peer })
    }

    if (req.method === 'PUT') {
      return await update(server, peer, req, res)
    }

    if (req.method === 'DELETE') {
      return await remove(server, peer, req, res)
    }

    return res
       .status(400)
       .json({ ok: false, details: 'Method not allowed' })

  })
}

const RequestSchema = z.object({
  serverId: ServerId,
  clientId: ClientId
})

type Peer = WgServer['peers'][0]

async function update(server: WgServer, peer: Peer, req: NextApiRequest, res: NextApiResponse) {
  return safeServe(res, async () => {

    const parsed = PutRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      return zodErrorToResponse(res, parsed.error)
    }

    const { name } = req.body as z.infer<typeof PutRequestSchema>

    if (name) {
      await WGServer.update(server.id, { name })
    }

    return res
       .status(200)
       .json({ ok: true })

  })
}

const PutRequestSchema = z.object({
  name: NameSchema.optional()
})

async function remove(server: WgServer, peer: Peer, req: NextApiRequest, res: NextApiResponse) {
  return safeServe(res, async () => {
    await WGServer.removePeer(server.id, peer.publicKey)
    return res
       .status(200)
       .json({ ok: true })
  })
}

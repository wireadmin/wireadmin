import type { NextApiRequest, NextApiResponse } from "next";
import safeServe from "@lib/safe-serve";
import { findServer, generateWgKey, WGServer } from "@lib/wireguard";
import { z } from "zod";
import { NameSchema, ServerId } from "@lib/schemas/WireGuard";
import { zodErrorToResponse } from "@lib/zod";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return safeServe(res, async () => {

    if (req.method !== 'POST') {
      return res
         .status(400)
         .json({ ok: false, details: 'Method not allowed' })
    }

    const parsed = RequestQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return zodErrorToResponse(res, parsed.error)
    }

    const bodyParsed = RequestBodySchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return zodErrorToResponse(res, bodyParsed.error)
    }

    const { name } = req.body as z.infer<typeof RequestBodySchema>
    const { serverId } = req.query as z.infer<typeof RequestQuerySchema>

    const server = await findServer(serverId)
    if (!server) {
      return res
         .status(404)
         .json({ ok: false, message: 'Not Found' })
    }

    const freeAddress = await WGServer.getFreePeerIp(server.id)
    if (!freeAddress) {
      return res
         .status(400)
         .json({ ok: false, details: 'No free addresses' })
    }

    const peerKeys = await generateWgKey()

    const addedPeer = await WGServer.addPeer(server.id, {
      id: crypto.randomUUID(),
      name,
      allowedIps: freeAddress,
      publicKey: peerKeys.publicKey,
      privateKey: peerKeys.privateKey,
      preSharedKey: peerKeys.preSharedKey,
      persistentKeepalive: 25,
    })
    if (!addedPeer) {
      return res
         .status(500)
         .json({ ok: false, details: 'Failed to add peer' })
    }

    return res
       .status(200)
       .json({ ok: true })

  })
}

const RequestQuerySchema = z.object({
  serverId: ServerId,
})

const RequestBodySchema = z.object({
  name: NameSchema,
})

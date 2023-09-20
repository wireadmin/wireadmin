import type { NextApiRequest, NextApiResponse } from 'next'
import safeServe from "@lib/safe-serve";
import { findServer, WGServer } from "@lib/wireguard";
import { z } from "zod";
import { ServerId } from "@lib/schemas/WireGuard";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return safeServe(res, async () => {

    if (req.method !== 'GET') {
      return res
         .status(400)
         .json({ ok: false, details: 'Method not allowed' })
    }

    const { serverId } = req.query as z.infer<typeof RequestSchema>
    const server = await findServer(serverId)

    if (!server) {
      return res
         .status(404)
         .json({ ok: false, message: 'Not Found' })
    }

    const updated = await WGServer.stop(serverId)
    if (!updated) {
      return res
         .status(500)
         .json({ ok: false, details: 'Server Internal Error' })
    }

    return res
       .status(200)
       .json({ ok: true })

  })
}

const RequestSchema = z.object({
  serverId: ServerId
})


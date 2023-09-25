import { NextApiRequest, NextApiResponse } from "next";
import safeServe from "@lib/safe-serve";
import { zodErrorToResponse } from "@lib/zod";
import { z } from "zod";
import { findServer } from "@lib/wireguard";
import { AddressSchema, ServerId } from "@lib/schemas/WireGuard";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return safeServe(res, async () => {

    if (req.method !== 'GET') {
      return res
         .status(400)
         .json({ ok: false, details: 'Method not allowed' })
    }

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


  })
}

const RequestSchema = z.object({
  serverId: ServerId,
  clientId: AddressSchema
})
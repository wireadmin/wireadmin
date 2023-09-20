import type { NextApiRequest, NextApiResponse } from 'next'
import safeServe from "@lib/safe-serve";
import { z } from "zod";
import { AddressSchema, DnsSchema, MtuSchema, NameSchema, PortSchema, TypeSchema } from "@lib/schemas/WireGuard";
import { generateWgServer } from "@lib/wireguard";
import { zodErrorToResponse } from "@lib/zod";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return safeServe(res, async () => {

    if (req.method !== 'POST') {
      return res
         .status(400)
         .json({ ok: false, details: 'Method not allowed' })
    }

    const parsed = RequestSchema.safeParse(req.body)
    if (!parsed.success) {
      return zodErrorToResponse(res, parsed.error)
    }

    const { name, address, type, port, dns = null, mtu = 1420 } = req.body

    const serverId = await generateWgServer({
      name,
      address,
      port,
      type,
      mtu,
      dns
    })

    return res
       .status(200)
       .json({ ok: true, result: serverId })

  })
}

const RequestSchema = z.object({
  name: NameSchema,
  address: AddressSchema,
  port: PortSchema,
  type: TypeSchema,
  dns: DnsSchema,
  mtu: MtuSchema
})

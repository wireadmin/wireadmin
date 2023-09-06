import type { NextApiRequest, NextApiResponse } from 'next'
import safeServe from "@/lib/safe-serve";
import { z } from "zod";
import { IPV4_REGEX } from "@/lib/constants";
import { client, WG_SEVER_PATH } from "@/lib/redis";
import { isBetween } from "@/lib/utils";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return safeServe(res, async () => {

    if (req.method !== 'POST') {
      return res
         .status(400)
         .json({ ok: false, details: 'Method not allowed' })
    }

    if (!RequestSchema.safeParse(req.body).success) {
      return res
         .status(400)
         .json({ ok: false, details: 'Bad Request' })
    }

    const { name, address, listen, dns = null, mtu = 1420 } = req.body

    const serversCount = (await client.lrange(WG_SEVER_PATH, 0, -1)).length

    const server = {
      id: serversCount + 1,
      name,
      address,
      listen,
      mtu,
      dns
    }

    await client.lpush(WG_SEVER_PATH, JSON.stringify(server))

    return res
       .status(200)
       .json({ ok: true })

  })
}

const RequestSchema = z.object({
  name: z.string().regex(/^[A-Za-z\d\s]{3,32}$/),
  address: z.string().regex(IPV4_REGEX),
  listen: z.string().refine((d) => isBetween(d, 1, 65535)),
  dns: z.string().regex(IPV4_REGEX).optional(),
  mtu: z.string().refine((d) => isBetween(d, 1, 1500)).optional()
})

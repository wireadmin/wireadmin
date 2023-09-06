import type { NextApiRequest, NextApiResponse } from 'next'
import safeServe from "@/lib/safe-serve";
import { client, WG_SEVER_PATH } from "@/lib/redis";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return safeServe(res, async () => {

    if (req.method !== 'GET') {
      return res
         .status(400)
         .json({ ok: false, details: 'Method not allowed' })
    }

    const servers = await client.lrange(WG_SEVER_PATH, 0, -1)

    return res
       .status(200)
       .json({ ok: true, result: servers.map((s)=> JSON.parse(s)) })

  })
}


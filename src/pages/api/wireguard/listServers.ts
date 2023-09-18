import type { NextApiRequest, NextApiResponse } from 'next'
import safeServe from "@lib/safe-serve";
import { getServers } from "@lib/wireguard";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return safeServe(res, async () => {

    if (req.method !== 'GET') {
      return res
         .status(400)
         .json({ ok: false, details: 'Method not allowed' })
    }

    return res
       .status(200)
       .json({
         ok: true,
         result: (await getServers()).map((s) => s)
       })

  })
}


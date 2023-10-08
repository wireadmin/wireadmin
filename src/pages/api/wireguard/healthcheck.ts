import type { NextApiRequest, NextApiResponse } from 'next'
import safeServe from "@lib/safe-serve";
import { getConfigHash, getServers, WGServer } from "@lib/wireguard";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return safeServe(res, async () => {

    const servers = await getServers()

    for (const s of servers) {

      const HASH = await getConfigHash(s.confId);
      if (s.confId && HASH && s.confHash === HASH) {
        // Skip, due to no changes on the config
        continue;
      }

      // Start server
      if (s.status === 'up') {
        await WGServer.start(s.id);
      }
    }

    return res
       .status(200)
       .end('OK')

  })
}

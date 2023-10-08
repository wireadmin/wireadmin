import type { NextApiRequest, NextApiResponse } from 'next'
import safeServe from "@lib/safe-serve";
import { getConfigHash, getServers, WGServer, writeConfigFile } from "@lib/wireguard";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return safeServe(res, async () => {

    const servers = await getServers()

    for (const s of servers) {

      const HASH = await getConfigHash(s.id);
      if (s.confId && s.confHash === HASH) {
        // Skip, due to no changes on the config
        continue;
      }

      await writeConfigFile(s);
      await WGServer.start(s.id)
    }

    return res
       .status(200)
       .end('OK')

  })
}

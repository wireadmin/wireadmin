import type { NextApiRequest, NextApiResponse } from 'next'
import safeServe from "@lib/safe-serve";
import { genServerConf, getServers, WGServer } from "@lib/wireguard";
import fs from "fs";
import path from "path";
import { WG_PATH } from "@lib/constants";

/**
 * This API Endpoint is for recreating WireGuard's configs from the database.
 *
 * @param req
 * @param res
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return safeServe(res, async () => {

    const servers = await getServers()

    for (const s of servers) {
      const CONFIG_PATH = path.join(WG_PATH, `wg${s.confId}.conf`)
      fs.writeFileSync(CONFIG_PATH, await genServerConf(s), { mode: 0o600 })
      await WGServer.start(s.id)
    }

    return res
       .status(200)
       .end('OK')

  })
}
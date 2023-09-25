import type { NextApiRequest, NextApiResponse } from 'next'
import safeServe from "@lib/safe-serve";
import { getServers } from "@lib/wireguard";
import { getServerConf } from "@lib/wireguard-utils";
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

    servers.forEach((s) => {
      const CONFIG_PATH = path.join(WG_PATH, `wg${s.confId}.conf`)
      fs.writeFileSync(CONFIG_PATH, getServerConf(s), { mode: 0o600 })
    })

    return res
       .status(200)
       .end('OK')

  })
}

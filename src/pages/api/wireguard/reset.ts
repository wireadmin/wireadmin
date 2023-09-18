import type { NextApiRequest, NextApiResponse } from 'next'
import safeServe from "@lib/safe-serve";
import { client, WG_SEVER_PATH } from "@lib/redis";
import fs from "fs";
import Shell from "@lib/shell";
import path from "path";
import { WG_PATH } from "@lib/constants";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return safeServe(res, async () => {

    if (req.method !== 'GET') {
      return res
         .status(400)
         .json({ ok: false, details: 'Method not allowed' })
    }

    // delete all servers
    await client.del(WG_SEVER_PATH)

    // delete every file in /etc/wireguard
    fs.readdirSync(WG_PATH).forEach((file) => {
      const reg = new RegExp(/^wg(\d+)\.conf$/)
      const m = file.match(reg)
      if (m) {
        const confId = parseInt(m[1])
        Shell.exec(`wg-quick down wg${confId}`).catch()
        fs.unlinkSync(path.join(WG_PATH, file))
      }
    })

    return res
       .status(200)
       .json({ ok: true })

  })
}


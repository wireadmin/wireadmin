import type { NextApiRequest, NextApiResponse } from 'next'
import safeServe from "@lib/safe-serve";
import Shell from "@lib/shell";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return safeServe(res, async () => {

    let { WG_HOST } = process.env

    // if the host is not set, then we are using the server's public IP
    if (!WG_HOST) {
      const resp = await Shell.exec('curl -s ifconfig.me', true)
      WG_HOST = resp.trim()
    }

    // check if WG_HOST is still not set
    if (!WG_HOST) {
      console.error('WG_HOST is not set')
      return res
         .status(500)
         .setHeader('Content-Type', 'text/plain')
         .end('NOT_SET')
    }

    return res
       .status(200)
       .setHeader('Content-Type', 'text/plain')
       .end(WG_HOST)

  })
}

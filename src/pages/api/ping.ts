import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from "@/lib/redis";
import safeServe from "@/lib/safe-serve";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return safeServe(res, async () => {

    // create a list for storing the last 10 pings
    await client.lpush("pings", Date.now().toString())
    await client.ltrim("pings", 0, 9)

    const pings = await client.lrange("pings", 0, -1)
    return res
       .status(200)
       .json({ message: 'Pong!', pings })

  })
}

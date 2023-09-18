import type { NextApiRequest, NextApiResponse } from "next";
import safeServe from "@lib/safe-serve";
import { findServer } from "@lib/wireguard";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return safeServe(res, async () => {

    if (req.method === 'GET') {
      return get(req, res)
    }

    if (req.method === 'PUT') {
      return update(req, res)
    }

    if (req.method === 'DELETE') {
      return remove(req, res)
    }

    return res
       .status(400)
       .json({ ok: false, details: 'Method not allowed' })

  })
}

async function get(req: NextApiRequest, res: NextApiResponse) {

  const server = findServer()

  return res
     .status(500)
     .json({ ok: false, details: 'Not yet implemented!' })
}

async function update(req: NextApiRequest, res: NextApiResponse) {
  return res
     .status(500)
     .json({ ok: false, details: 'Not yet implemented!' })
}

async function remove(req: NextApiRequest, res: NextApiResponse) {
  return res
     .status(500)
     .json({ ok: false, details: 'Not yet implemented!' })
}


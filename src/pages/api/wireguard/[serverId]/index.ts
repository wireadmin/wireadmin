import type { NextApiRequest, NextApiResponse } from "next";
import safeServe from "@lib/safe-serve";
import { findServer, WGServer } from "@lib/wireguard";
import { z } from "zod";
import { NameSchema, ServerId } from "@lib/schemas/WireGuard";
import { WgServer } from "@lib/typings";
import { zodEnumError, zodErrorToResponse } from "@lib/zod";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return safeServe(res, async () => {

    const parsed = RequestSchema.safeParse(req.query)
    if (!parsed.success) {
      return zodErrorToResponse(res, parsed.error)
    }

    const { serverId } = req.query as z.infer<typeof RequestSchema>
    const server = await findServer(serverId)
    if (!server) {
      return res
         .status(404)
         .json({ ok: false, message: 'Not Found' })
    }

    if (req.method === 'GET') {
      return res
         .status(200)
         .json({ ok: true, result: server })
    }

    if (req.method === 'PUT') {
      return await update(server, req, res)
    }

    if (req.method === 'DELETE') {
      return await remove(server, req, res)
    }

    return res
       .status(400)
       .json({ ok: false, details: 'Method not allowed' })

  })
}

const RequestSchema = z.object({
  serverId: ServerId
})


async function update(server: WgServer, req: NextApiRequest, res: NextApiResponse) {
  return safeServe(res, async () => {

    const parsed = PutRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      return zodErrorToResponse(res, parsed.error)
    }

    const { status } = req.body as z.infer<typeof PutRequestSchema>

    switch (status) {
      case 'start':
        await WGServer.start(server.id)
        break;
      case 'stop':
        await WGServer.stop(server.id)
        break;
      case 'restart':
        await WGServer.stop(server.id)
        await WGServer.start(server.id)
        break;
    }

    return res
       .status(200)
       .json({ ok: true })

  })
}

const PutRequestSchema = z.object({
  name: NameSchema.optional(),
  status: z
     .enum(
        [ 'start', 'stop', 'restart' ],
        { errorMap: () => zodEnumError('Invalid status') }
     )
     .optional(),
})

async function remove(server: WgServer, req: NextApiRequest, res: NextApiResponse) {
  return safeServe(res, async () => {
    await WGServer.remove(server.id)
    return res
       .status(200)
       .json({ ok: true })
  })
}


import { APIResponse, Peer, PeerSchema, WgServer, WgServerSchema } from "@lib/typings";
import { zodErrorMessage } from "@lib/zod";

export const UPDATE_SERVER = async (url: string, { arg }: { arg: Partial<WgServer> }) => {
  const parsed = WgServerSchema.partial().safeParse(arg)
  if (!parsed.success) {
    console.error('invalid server schema', zodErrorMessage(parsed.error))
    return false
  }

  const resp = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg)
  })

  const data = await resp.json() as APIResponse<any>
  if (!data.ok) throw new Error('Server responded with error status')

  return true
}

export const UPDATE_CLIENT = async (url: string, { arg }: { arg: Partial<Peer> }) => {
  const parsed = PeerSchema
     .partial()
     .safeParse(arg)
  if (!parsed.success) {
    console.error('invalid peer schema', zodErrorMessage(parsed.error))
    return false
  }

  const resp = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg)
  })

  const data = await resp.json() as APIResponse<any>
  if (!data.ok) throw new Error('Server responded with error status')

  return true
}

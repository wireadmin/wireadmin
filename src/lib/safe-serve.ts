import { NextApiResponse } from "next";

export default async function safeServe(res: NextApiResponse, fn: () => void): Promise<void> {
  return new Promise(() => {
    try {
      fn()
    } catch (e) {
      console.error('[SafeServe]: ', e)
      return res
         .status(500)
         .json({ ok: false, details: 'Server Internal Error' })
    }
  })
}

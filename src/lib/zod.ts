import { NextApiResponse } from "next";
import { ZodError } from "zod";

export function zodErrorToResponse(res: NextApiResponse, z: ZodError) {
  return res
     .status(400)
     .json({
       ok: false,
       message: 'Bad Request',
       details: zodErrorMessage(z)
     })
}

export function zodEnumError(message: string) {
  return { message }
}

export function zodErrorMessage(ze: ZodError): string[] {
  return ze.errors.map((e) => e.message)
}

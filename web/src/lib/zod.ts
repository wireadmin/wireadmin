import type { ZodError } from 'zod';

export function zodEnumError(message: string) {
  return { message };
}

export function zodErrorMessage(ze: ZodError): string[] {
  return ze.errors.map((e) => e.message);
}

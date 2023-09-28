import { NameSchema } from "@lib/schemas/WireGuard";
import { zodErrorMessage } from "@lib/zod";
import type { Rule } from "rc-field-form/lib/interface";

export const RLS_NAME_INPUT: Rule[] = [
  {
    required: true,
    message: 'Name is required'
  },
  {
    validator: (_, value) => {
      if (!value) return Promise.resolve()
      const res = NameSchema.safeParse(value)
      if (res.success) return Promise.resolve()
      return Promise.reject(zodErrorMessage(res.error)[0])
    }
  }
]
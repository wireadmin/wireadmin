import { z } from 'zod';

export const formSchema = z.object({
  password: z.string().min(1, { message: 'Password is required' }),
});
export type FormSchema = typeof formSchema;

import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { hash, sha256 } from '@litehex/node-checksum';

import 'dotenv/config';

export const env = createEnv({
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  server: {
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    STORAGE_PATH: z.string().default('/data/storage.pack'),
    AUTH_SECRET: z.string().default(sha256(randomUUID())),
    HASHED_PASSWORD: z.string().default(hash('hex', 'insecure-password')),
    ORIGIN: z.string().optional(),
  },
});

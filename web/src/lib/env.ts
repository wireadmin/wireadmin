import 'dotenv/config';

import { randomUUID } from 'node:crypto';
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

import { sha256 } from '$lib/utils/hash';

export const env = createEnv({
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  server: {
    STORAGE_PATH: z.string().default('/data/storage.pack'),
    AUTH_SECRET: z.string().default(sha256(randomUUID())),
    ADMIN_PASSWORD: z.string().default('insecure-password'),
    // -----
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    ORIGIN: z.string().optional(),
    PORT: z.string().optional(),
    HOST: z.string().optional(),
    // -----
    LOG_LEVEL: z.string().default('trace'),
    LOG_FILE_PATH: z.string().default('/var/log/wireadmin/web.log'),
    LOG_COLORS: z.string().default('true'),
  },
});

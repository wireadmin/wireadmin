import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  runtimeEnv: process.env,
  server: {
    STORAGE_PATH: z.string().default('/data/storage.pack'),
  },
});

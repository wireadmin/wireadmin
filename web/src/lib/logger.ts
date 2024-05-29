import { createWriteStream, promises } from 'node:fs';
import { dirname } from 'node:path';
import { trySafe } from 'p-safe';
import pino, { type Logger, type LoggerOptions } from 'pino';
import pretty from 'pino-pretty';

import { env } from '$lib/env';
import { fsAccess } from '$lib/utils/fs-extra';

const options: LoggerOptions = {
  level: env.LOG_LEVEL,
  customLevels: {
    trace: 10,
    info: 30,
    debug: 35,
    warn: 40,
    error: 50,
    fatal: 60,
  },
  useOnlyCustomLevels: true,
};

const jsonLevels = JSON.stringify(options.customLevels);
const levelsInString = jsonLevels.replaceAll('"', '').slice(0, -1).slice(1);

const prettyStream = pretty({
  colorize: env.LOG_COLORS === 'true',
  customLevels: levelsInString,
});

let logger: Logger = pino(options, pino.multistream([prettyStream]));

export function errorBox<T = Error>(e: T) {
  console.error('');
  console.error('---------------- ERROR ----------------');
  logger.error(e);
  console.error('---------------- ERROR ----------------');
  console.error('');
}

const { error } = await trySafe(async () => {
  const logDir = dirname(env.LOG_FILE_PATH);
  if (!fsAccess(logDir)) {
    await promises.mkdir(logDir, { recursive: true });
  }

  if (!fsAccess(env.LOG_FILE_PATH)) {
    await promises.writeFile(env.LOG_FILE_PATH, '', { encoding: 'utf-8' });
  }
  logger = pino(
    options,
    pino.multistream([
      prettyStream,
      createWriteStream(env.LOG_FILE_PATH, {
        flags: 'a',
      }),
    ])
  );
});

if (error) {
  logger.warn('Log file is not accessible');
}

export default logger;

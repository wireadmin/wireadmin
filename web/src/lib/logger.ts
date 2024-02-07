import pino, { type Logger, type LoggerOptions } from 'pino';
import pretty from 'pino-pretty';
import { createWriteStream } from 'node:fs';
import { resolve } from 'node:path';
import { fsAccess, fsTouch } from '$lib/fs-extra';

const LOG_LEVEL = process.env.LOG_LEVEL || 'trace';
const LOG_FILE_PATH = process.env.LOG_FILE_PATH || '/var/vlogs/web';
const LOG_COLORS = process.env.LOG_COLORS || 'true';

const options: LoggerOptions = {
  level: LOG_LEVEL,
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
  colorize: LOG_COLORS === 'true',
  customLevels: levelsInString,
});

let logger: Logger = pino(options, pino.multistream([prettyStream]));

if (fsAccess(LOG_FILE_PATH)) {
  fsTouch(LOG_FILE_PATH).then(() => {
    logger = pino(
      options,
      pino.multistream([
        prettyStream,
        createWriteStream(resolve(LOG_FILE_PATH), {
          flags: 'a',
        }),
      ]),
    );
  });
} else {
  logger.warn('Log file is not accessible');
}

export default logger;

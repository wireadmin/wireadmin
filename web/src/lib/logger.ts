import pino, { type Logger } from 'pino';
import pretty from 'pino-pretty';
import { createWriteStream } from 'node:fs';
import { resolve } from 'node:path';
import { fsAccess, fsTouch } from '$lib/fs-extra';

const LOG_LEVEL = process.env.LOG_LEVEL || 'trace';
const LOG_FILE_PATH = process.env.LOG_FILE_PATH || '/var/vlogs/web';
const LOG_COLORS = process.env.LOG_COLORS || 'true';

const prettyStream = pretty({
  colorize: LOG_COLORS === 'true',
});

let logger: Logger = pino(
  {
    level: LOG_LEVEL,
  },
  pino.multistream([prettyStream]),
);

fsTouch(LOG_FILE_PATH)
  .then(() => fsAccess(LOG_FILE_PATH))
  .then((ok) => {
    if (!ok) {
      logger.warn('Log file is not accessible');
      return;
    }
    logger = pino(
      {
        level: LOG_LEVEL,
      },
      pino.multistream([
        prettyStream,
        createWriteStream(resolve(LOG_FILE_PATH), {
          flags: 'a',
        }),
      ]),
    );
  })
  .catch(console.error);

export default logger;

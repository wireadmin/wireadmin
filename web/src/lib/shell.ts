import { exec } from 'child_process';
import logger from '$lib/logger';

export default class Shell {
  public static async exec(command: string, safe: boolean = false, ...args: string[]): Promise<string> {
    if (process.platform !== 'linux') {
      throw new Error('This program is not meant to run non UNIX systems');
    }

    return new Promise(async (resolve, reject) => {
      const cmd = `${command}${args.length > 0 ? ` ${args.join(' ')}` : ''}`;
      exec(cmd, { shell: 'bash' }, (err, stdout, stderr) => {
        if (err) {
          const message = `Command Failed: ${JSON.stringify(
            {
              cmd,
              code: err.code,
              killed: err.killed,
              stderr,
            },
            null,
            2,
          )}`;

          if (safe) {
            logger.warn(message);
            return resolve(stderr);
          }

          logger.error(message);
          return reject(err);
        }

        return resolve(String(stdout).trim());
      });
    });
  }
}

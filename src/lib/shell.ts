import childProcess from "child_process";

export default class Shell {

  public static async exec(command: string, safe: boolean = false, ...args: string[]): Promise<string> {
    if (process.platform !== 'linux') {
      throw new Error('This program is not meant to run non UNIX systems');
    }
    return new Promise(async (resolve, reject) => {
      const cmd = `${command}${args.length > 0 ? ` ${args.join(' ')}` : ''}`;
      childProcess.exec(
         cmd,
         { shell: 'bash' },
         (err, stdout, stderr) => {
           if (err) {
             console.error(
                `${safe ? 'Ignored::' : 'CRITICAL::'} Shell Command Failed:`,
                JSON.stringify({ cmd, code: err.code, killed: err.killed, stderr })
             );
             return safe ? resolve(stderr) : reject(err);
           }
           return resolve(String(stdout).trim());
         }
      );
    });
  }

};

import childProcess from "child_process";

export default class Shell {

  public static async exec(command: string, ...args: string[]): Promise<string> {
    if (process.platform !== 'linux') {
      throw new Error('This program is not meant to run on UNIX systems');
    }
    return new Promise((resolve, reject) => {
      const cmd = `${command}${args.length > 0 ? ` ${args.join(' ')}` : ''}`;
      childProcess.exec(cmd, { shell: 'bash', }, (err, stdout) => {
        if (err) return reject(err);
        return resolve(String(stdout).trim());
      });
    });
  }

};

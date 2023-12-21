import { execaCommand } from 'execa';
import logger from '$lib/logger';

export default class Network {
  public static async dropInterface(inet: string) {
    await execaCommand(`ip link delete dev ${inet}`);
  }

  public static async defaultInterface(): Promise<string> {
    const { stdout: o } = await execaCommand(`ip route list default | awk '{print $5}'`);
    return o.trim();
  }

  public static async interfaceExists(inet: string): Promise<boolean> {
    try {
      const { stdout: o } = await execaCommand(`ip link show | grep ${inet}`);
      console.log(o);
      return o.trim() !== '';
    } catch (e) {
      logger.debug('Interface does not exist:', inet);
      return false;
    }
  }

  public static async inUsePorts(): Promise<number[]> {
    const ports = [];
    const { stdout: output } = await execaCommand(
      `netstat -tulpn | grep LISTEN | awk '{print $4}' | awk -F ':' '{print $NF}'`,
    );
    for (const line of output.split('\n')) {
      const clean = Number(line.trim());
      if (!isNaN(clean)) ports.push(clean);
    }

    return ports;
  }
}

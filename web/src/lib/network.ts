import { execa } from 'execa';
import logger from '$lib/logger';
import { ip } from 'node-netkit';

export default class Network {
  public static async dropInterface(inet: string) {
    await execa(`ip link delete dev ${inet}`, { shell: true });
  }

  public static async defaultInterface(): Promise<string> {
    const route = await ip.route.defaultRoute();
    if (!route) throw new Error('No default route found');
    return route.dev;
  }

  public static async interfaceExists(inet: string): Promise<boolean> {
    try {
      const { stdout: o } = await execa(`ip link show | grep ${inet}`, { shell: true });
      return o.trim() !== '';
    } catch (e) {
      logger.debug('Interface does not exist:', inet);
      return false;
    }
  }

  public static async inUsePorts(): Promise<number[]> {
    const ports = [];
    const { stdout: output } = await execa(
      `netstat -tulpn | grep LISTEN | awk '{print $4}' | awk -F ':' '{print $NF}'`,
      { shell: true },
    );
    for (const line of output.split('\n')) {
      const clean = Number(line.trim());
      if (!isNaN(clean) && clean !== 0) ports.push(clean);
    }

    return ports;
  }
}

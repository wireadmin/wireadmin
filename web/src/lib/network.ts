import { execa } from 'execa';

export default class Network {
  public static async interfaceExists(inet: string): Promise<boolean> {
    try {
      const { stdout: o } = await execa(`ip link show | grep ${inet}`, { shell: true });
      return o.trim() !== '';
    } catch (e) {
      return false;
    }
  }

  public static async inUsePorts(): Promise<number[]> {
    const ports = [];
    const { stdout: output } = await execa(
      `netstat -tulpn | grep LISTEN | awk '{print $4}' | awk -F ':' '{print $NF}'`,
      { shell: true }
    );
    for (const line of output.split('\n')) {
      const clean = Number(line.trim());
      if (!isNaN(clean) && clean !== 0) ports.push(clean);
    }

    return ports;
  }
}

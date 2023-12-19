import Shell from '$lib/shell';

export default class Network {
  public static async createInterface(inet: string, address: string): Promise<boolean> {
    // First, check if the interface already exists.
    const interfaces = await Shell.exec(`ip link show | grep ${inet}`, true);
    if (interfaces.includes(`${inet}`)) {
      console.error(`failed to create interface, ${inet} already exists!`);
      return false;
    }

    const o2 = await Shell.exec(`ip address add dev ${inet} ${address}`);
    // check if it has any error
    if (o2 !== '') {
      console.error(`failed to assign ip to interface, ${o2}`);
      console.log(`removing interface ${inet} due to errors`);
      await Shell.exec(`ip link delete dev ${inet}`, true);
      return false;
    }

    return true;
  }

  public static async dropInterface(inet: string) {
    await Shell.exec(`ip link delete dev ${inet}`, true);
  }

  public static async defaultInterface(): Promise<string> {
    return await Shell.exec(`ip route list default | awk '{print $5}'`);
  }

  public static async checkInterfaceExists(inet: string): Promise<boolean> {
    return await Shell.exec(`ip link show | grep ${inet}`, true).then((o) => o.trim() !== '');
  }

  public static async getInUsePorts(): Promise<number[]> {
    const ports = [];
    const output = await Shell.exec(
      `netstat -tulpn | grep LISTEN | awk '{print $4}' | awk -F ':' '{print $NF}'`,
      true,
    );
    for (const line of output.split('\n')) {
      const clean = Number(line.trim());
      if (!isNaN(clean)) ports.push(clean);
    }

    return ports;
  }
}

import { link } from 'node-netkit/ip';

export default class Network {
  public static async interfaceExists(inet: string): Promise<boolean> {
    const links = await link.list();
    return links.some((l) => l.name === inet);
  }
}

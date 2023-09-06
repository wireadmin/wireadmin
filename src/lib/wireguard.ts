import { promises as fs } from "fs";
import path from "path";
import QRCode from "qrcode";
import { WG_PATH } from "@/lib/constants";
import Shell from "@/lib/shell";

export class WireGuardServer {

  serverId: number

  constructor(serverId: number) {
    this.serverId = serverId
  }


  async getConfig() {
    if (!this.__configPromise) {
      this.__configPromise = Promise.resolve().then(async () => {
        if (!WG_HOST) {
          throw new Error('WG_HOST Environment Variable Not Set!');
        }

        console.log('Loading configuration...')
        let config;
        try {
          config = await fs.readFile(path.join(WG_PATH, 'wg0.json'), 'utf8');
          config = JSON.parse(config);
          console.log('Configuration loaded.')
        } catch (err) {
          // const privateKey = await Shell.exec('wg genkey');
          // const publicKey = await Shell.exec(`echo ${privateKey} | wg pubkey`, {
          //   log: 'echo ***hidden*** | wg pubkey',
          // });
          const { privateKey, publicKey } = await this.genKey()
          const address = WG_DEFAULT_ADDRESS.replace('x', '1');

          config = {
            server: {
              privateKey,
              publicKey,
              address,
            },
            clients: {},
          };
          console.log('Configuration generated.')
        }

        await this.__saveConfig(config);
        await Shell.exec('wg-quick down wg0').catch(() => {
        });
        await Shell.exec('wg-quick up wg0').catch(err => {
          if (err && err.message && err.message.includes('Cannot find device "wg0"')) {
            throw new Error('WireGuard exited with the error: Cannot find device "wg0"\nThis usually means that your host\'s kernel does not support WireGuard!');
          }

          throw err;
        });
        // await Util.exec(`iptables -t nat -A POSTROUTING -s ${WG_DEFAULT_ADDRESS.replace('x', '0')}/24 -o eth0 -j MASQUERADE`);
        // await Util.exec('iptables -A INPUT -p udp -m udp --dport 51820 -j ACCEPT');
        // await Util.exec('iptables -A FORWARD -i wg0 -j ACCEPT');
        // await Util.exec('iptables -A FORWARD -o wg0 -j ACCEPT');
        await this.__syncConfig();

        return config;
      });
    }

    return this.__configPromise;
  }


  async saveConfig() {
    const config = await this.getConfig();
    await this.__saveConfig(config);
    await this.__syncConfig();
  }

  async __saveConfig(config: IServerConfig) {
    let result = `
[Interface]
PrivateKey = ${config.privateKey}
Address = ${config.address}/24
ListenPort = ${config.listen}
PreUp = ${config.preUp}
PostUp = ${config.postUp}
PreDown = ${config.preDown}
PostDown = ${config.postDown}
`;

    for (const { id, ...client } of config.peers) {
      if (!client.enabled) continue;

      result += `

# Client: ${client.name} (${id})
[Peer]
PublicKey = ${client.publicKey}
PresharedKey = ${client.preSharedKey}
AllowedIPs = ${client.address}/32`;
    }

    await fs.writeFile(path.join(WG_PATH, `wg${this.serverId}.conf`), result, {
      mode: 0o600,
    });
  }

  async getClients() {
    const config = await this.getConfig();
    const clients = Object.entries(config.clients).map(([ clientId, client ]) => ({
      id: clientId,
      name: client.name,
      enabled: client.enabled,
      address: client.address,
      publicKey: client.publicKey,
      createdAt: new Date(client.createdAt),
      updatedAt: new Date(client.updatedAt),
      allowedIPs: client.allowedIPs,

      persistentKeepalive: null,
      latestHandshakeAt: null,
      transferRx: null,
      transferTx: null,
    }));

    // Loop WireGuard status
    const dump = await Util.exec('wg show wg0 dump', {
      log: false,
    });
    dump
       .trim()
       .split('\n')
       .slice(1)
       .forEach(line => {
         const [
           publicKey,
           preSharedKey, // eslint-disable-line no-unused-vars
           endpoint, // eslint-disable-line no-unused-vars
           allowedIps, // eslint-disable-line no-unused-vars
           latestHandshakeAt,
           transferRx,
           transferTx,
           persistentKeepalive,
         ] = line.split('\t');

         const client = clients.find(client => client.publicKey === publicKey);
         if (!client) return;

         client.latestHandshakeAt = latestHandshakeAt === '0'
            ? null
            : new Date(Number(`${latestHandshakeAt}000`));
         client.transferRx = Number(transferRx);
         client.transferTx = Number(transferTx);
         client.persistentKeepalive = persistentKeepalive;
       });

    return clients;
  }

  async getClient(clientId: string): Promise<WgPeer> {
    throw new Error('Yet not implanted!');
  }

  async getClientConfiguration(clientId: string): Promise<string> {
    const config = await this.getConfig();
    const client = await this.getClient(clientId);

    return `
[Interface]
PrivateKey = ${client.privateKey}
Address = ${client.address}/24
${WG_DEFAULT_DNS ? `DNS = ${WG_DEFAULT_DNS}` : ''}
${WG_MTU ? `MTU = ${WG_MTU}` : ''}

[Peer]
PublicKey = ${config.server.publicKey}
PresharedKey = ${client.preSharedKey}
AllowedIPs = ${WG_ALLOWED_IPS}
PersistentKeepalive = ${WG_PERSISTENT_KEEPALIVE}
Endpoint = ${WG_HOST}:${WG_PORT}`;
  }

  async getClientQRCodeSVG(clientId: string) {
    const config = await this.getClientConfiguration({ clientId });
    return QRCode.toString(config, {
      type: 'svg',
      width: 512,
    });
  }

  async createClient(name: string) {
    throw new Error('Yet not implanted!');
  }

  async deleteClient(clientId: string) {
    throw new Error('Yet not implanted!');
  }

  async enableClient(clientId: string) {
    throw new Error('Yet not implanted!');
  }

  async disableClient(clientId: string) {
    throw new Error('Yet not implanted!');
  }

  async updateClientName(clientId: string) {
    throw new Error('Yet not implanted!');
  }

  async updateClientAddress(clientId: string, address: string) {
    throw new Error('Yet not implanted!');
  }

}



/**
 * Used to read /etc/wireguard/*.conf and sync them with our
 * redis server.
 */
async function syncServers(): Promise<boolean> {
  throw new Error('Yet not implanted!');
}

export interface IServerConfig extends WgServerConfig {
  peers: WgPeer[]
}

export async function generateWgKey(): Promise<WgKey> {
  const privateKey = await Shell.exec('wg genkey');
  const publicKey = await Shell.exec(`echo ${privateKey} | wg pubkey`);
  return { privateKey, publicKey }
}

export async function generateWgServer(config: {
  name: string
  address: string
  port: number
  dns?: string
  mtu?: number
}): Promise<number> {

  const { privateKey, publicKey } = await generateWgKey();

  // inside redis create a config list



}

async function f() {

  const { privateKey, publicKey } = await generateWgKey()

  await generateWgServer({
    name: 'Primary',
    address: '10.8.0.0',
    port: 50210,
    mtu: 1420
  })

}


import fs from 'fs';
import path from 'path';
import deepmerge from 'deepmerge';
import type { Peer, WgKey, WgServer } from '$lib/typings';
import Network from '$lib/network';
import Shell from '$lib/shell';
import { WG_PATH, WG_SEVER_PATH } from '$lib/constants';
import { dynaJoin, isJson } from '$lib/utils';
import { getPeerConf } from '$lib/wireguard/utils';
import logger from '$lib/logger';
import { sha256 } from '$lib/hash';
import { fsAccess } from '$lib/fs-extra';
import { getClient } from '$lib/redis';

export class WGServer {
  readonly id: string;
  readonly peers: WGPeers;

  constructor(serverId: string) {
    if (!serverId) throw new Error('serverId is required');

    if (!WGServer.exists(serverId)) throw new Error('server does not exists');

    this.id = serverId;
    this.peers = new WGPeers(this);
  }

  static async exists(id: string): Promise<boolean> {
    const servers = await getServers();
    return servers.some((s) => s.id === id);
  }

  async get(): Promise<WgServer> {
    if (!fsAccess(WG_PATH)) {
      fs.mkdirSync(WG_PATH, { recursive: true, mode: 0o600 });
    }

    const server = await findServer(this.id);
    if (!server) {
      throw new Error('server not found');
    }

    if (!fsAccess(resolveConfigPath(server.confId))) {
      await this.writeConfigFile(server);
    }

    return server;
  }

  async stop(): Promise<boolean> {
    const server = await this.get();

    if (await Network.checkInterfaceExists(`wg${server.confId}`)) {
      await Shell.exec(`wg-quick down wg${server.confId}`, true);
    }

    await this.update({ status: 'down' });
    return true;
  }

  async start(): Promise<boolean> {
    const server = await this.get();

    const HASH = getConfigHash(server.confId);
    if (!HASH || server.confHash !== HASH) {
      await this.writeConfigFile(server);
    }

    if (await Network.checkInterfaceExists(`wg${server.confId}`)) {
      await Shell.exec(`wg-quick down wg${server.confId}`, true);
    }

    await Shell.exec(`wg-quick up wg${server.confId}`);

    await this.update({ status: 'up' });
    return true;
  }

  async remove(): Promise<boolean> {
    const server = await this.get();

    await this.stop();
    if (wgConfExists(server.confId)) {
      fs.unlinkSync(resolveConfigPath(server.confId));
    }

    const index = await findServerIndex(this.id);
    if (typeof index !== 'number') {
      logger.warn('findServerIndex: index not found');
      return true;
    }

    const client = getClient();
    const element = await client.lindex(WG_SEVER_PATH, index);
    if (!element) {
      logger.warn('remove: element not found');
      return true;
    }

    await client.lrem(WG_SEVER_PATH, 1, element);

    return true;
  }

  async update(update: Partial<WgServer>): Promise<boolean> {
    const server = await this.get();

    const index = await findServerIndex(this.id);
    if (typeof index !== 'number') {
      logger.warn('findServerIndex: index not found');
      return true;
    }

    const client = getClient();
    const res = await client.lset(
      WG_SEVER_PATH,
      index,
      JSON.stringify({
        ...deepmerge(server, update),
        peers: update?.peers || server?.peers || [],
        updatedAt: new Date().toISOString(),
      }),
    );

    return res === 'OK';
  }

  async writeConfigFile(wg: WgServer): Promise<void> {
    const CONFIG_PATH = resolveConfigPath(wg.confId);
    fs.writeFileSync(CONFIG_PATH, await genServerConf(wg), { mode: 0o600 });
    await this.update({ confHash: getConfigHash(wg.confId) });
  }

  static async getFreePeerIp(serverId: string): Promise<string | undefined> {
    const server = await findServer(serverId);
    if (!server) {
      logger.error('GetFreePeerIP: no server found');
      return undefined;
    }

    const reservedIps = server.peers.map((p) => p.allowedIps);
    const ips = reservedIps.map((ip) => ip.split('/')[0]);
    const net = server.address.split('/')[0].split('.');

    for (let i = 1; i < 255; i++) {
      const ip = `${net[0]}.${net[1]}.${net[2]}.${i}`;
      if (!ips.includes(ip) && ip !== server.address.split('/')[0]) {
        return ip;
      }
    }

    logger.error('GetFreePeerIP: no free ip found');
    return undefined;
  }
}

class WGPeers {
  private readonly server: WGServer;

  constructor(server: WGServer) {
    this.server = server;
  }

  async add(peer: WgServer['peers'][0]): Promise<boolean> {
    const server = await this.server.get();

    const confPath = resolveConfigPath(server.confId);
    const conf = fs.readFileSync(confPath, 'utf-8');
    const lines = conf.split('\n');

    lines.push(
      ...dynaJoin([
        `[Peer]`,
        `PublicKey = ${peer.publicKey}`,
        peer.preSharedKey && `PresharedKey = ${peer.preSharedKey}`,
        `AllowedIPs = ${peer.allowedIps}/32`,
        peer.persistentKeepalive && `PersistentKeepalive = ${peer.persistentKeepalive}`,
      ]),
    );
    fs.writeFileSync(confPath, lines.join('\n'), { mode: 0o600 });
    await this.server.update({ confHash: getConfigHash(server.confId) });

    const index = await findServerIndex(this.server.id);
    if (typeof index !== 'number') {
      logger.warn('findServerIndex: index not found');
      return true;
    }

    const client = getClient();
    await client.lset(
      WG_SEVER_PATH,
      index,
      JSON.stringify({
        ...server,
        peers: [...server.peers, peer],
      }),
    );

    if (server.status === 'up') {
      await this.server.stop();
      await this.server.start();
    }

    return true;
  }

  async remove(publicKey: string): Promise<boolean> {
    const server = await this.server.get();
    const peers = await wgPeersStr(server.confId);

    const index = await findServerIndex(this.server.id);
    if (typeof index !== 'number') {
      logger.warn('findServerIndex: index not found');
      return true;
    }

    const client = getClient();
    await client.lset(
      WG_SEVER_PATH,
      index,
      JSON.stringify({
        ...server,
        peers: server.peers.filter((p) => p.publicKey !== publicKey),
      }),
    );

    const peerIndex = peers.findIndex((p) => p.includes(`PublicKey = ${publicKey}`));
    if (peerIndex === -1) {
      logger.warn('removePeer: no peer found');
      return false;
    }

    const confPath = resolveConfigPath(server.confId);
    const conf = fs.readFileSync(confPath, 'utf-8');
    const serverConfStr = conf.includes('[Peer]') ? conf.split('[Peer]')[0] : conf;
    const peersStr = peers.filter((_, i) => i !== peerIndex).join('\n');
    fs.writeFileSync(confPath, `${serverConfStr}\n${peersStr}`, { mode: 0o600 });
    await this.server.update({ confHash: getConfigHash(server.confId) });

    if (server.status === 'up') {
      await this.server.stop();
      await this.server.start();
    }

    return true;
  }

  async update(publicKey: string, update: Partial<Peer>): Promise<boolean> {
    const server = await this.server.get();

    const index = await findServerIndex(this.server.id);
    if (typeof index !== 'number') {
      logger.warn('findServerIndex: index not found');
      return true;
    }

    const updatedPeers = server.peers.map((p) => {
      if (p.publicKey !== publicKey) return p;
      return deepmerge(p, update);
    });

    const client = getClient();
    await client.lset(WG_SEVER_PATH, index, JSON.stringify({ ...server, peers: updatedPeers }));
    await this.storePeers(publicKey, updatedPeers);

    if (server.status === 'up') {
      await this.server.stop();
      await this.server.start();
    }

    return true;
  }

  async getIndex(publicKey: string): Promise<number | undefined> {
    const server = await this.server.get();
    return server.peers.findIndex((p) => p.publicKey === publicKey);
  }

  async generateConfig(peerId: string): Promise<string | undefined> {
    const server = await findServer(this.server.id);
    if (!server) {
      logger.error('generatePeerConfig: server not found');
      return undefined;
    }
    const peer = server.peers.find((p) => p.id === peerId);
    if (!peer) {
      logger.error('generatePeerConfig: peer not found');
      return undefined;
    }
    return await getPeerConf({
      ...peer,
      serverPublicKey: server.publicKey,
      port: server.listen,
      dns: server.dns,
    });
  }

  private async storePeers(publicKey: string, peers: Peer[]): Promise<void> {
    const { confId } = await this.server.get();

    const peerIndex = await this.getIndex(publicKey);
    if (peerIndex === -1) {
      logger.warn('WGServer:StorePeers: no peer found');
      return;
    }

    const confPath = resolveConfigPath(confId);
    const conf = fs.readFileSync(confPath, 'utf-8');
    const serverConfStr = conf.includes('[Peer]') ? conf.split('[Peer]')[0] : conf;

    const peersStr = peers.filter((_, i) => i !== peerIndex).join('\n');
    fs.writeFileSync(confPath, `${serverConfStr}\n${peersStr}`, { mode: 0o600 });
    await this.server.update({ confHash: getConfigHash(confId) });
  }
}

function resolveConfigPath(confId: number): string {
  return path.resolve(path.join(WG_PATH, `wg${confId}.conf`));
}

/**
 * This function is for checking out WireGuard server is running
 */
async function wgCheckout(configId: number): Promise<boolean> {
  const res = await Shell.exec(`ip link show | grep wg${configId}`, true);
  return res.includes(`wg${configId}`);
}

export async function readWgConf(configId: number): Promise<WgServer> {
  const confPath = resolveConfigPath(configId);
  const conf = fs.readFileSync(confPath, 'utf-8');
  const lines = conf.split('\n');
  const server: WgServer = {
    id: crypto.randomUUID(),
    confId: configId,
    confHash: null,
    tor: false,
    name: '',
    address: '',
    listen: 0,
    dns: null,
    privateKey: '',
    publicKey: '',
    preUp: null,
    preDown: null,
    postDown: null,
    postUp: null,
    peers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'down',
  };
  let reachedPeers = false;
  for (const line of lines) {
    const [key, value] = line.split('=').map((s) => s.trim());
    if (reachedPeers) {
      if (key === '[Peer]') {
        server.peers.push({
          id: crypto.randomUUID(),
          name: `Unknown #${server.peers.length + 1}`,
          publicKey: '',
          privateKey: '', // it's okay to be empty because, we not using it on server
          preSharedKey: '',
          allowedIps: '',
          persistentKeepalive: null,
        });
      }
      if (key === 'PublicKey') {
        server.peers[server.peers.length - 1].publicKey = value;
      }
      if (key === 'PresharedKey') {
        server.peers[server.peers.length - 1].preSharedKey = value;
      }
      if (key === 'AllowedIPs') {
        server.peers[server.peers.length - 1].allowedIps = value;
      }
      if (key === 'PersistentKeepalive') {
        server.peers[server.peers.length - 1].persistentKeepalive = parseInt(value);
      }
    }
    if (key === 'PrivateKey') {
      server.privateKey = value;
    }
    if (key === 'Address') {
      server.address = value;
    }
    if (key === 'ListenPort') {
      server.listen = parseInt(value);
    }
    if (key === 'DNS') {
      server.dns = value;
    }
    if (key === 'PreUp') {
      server.preUp = value;
    }
    if (key === 'PreDown') {
      server.preDown = value;
    }
    if (key === 'PostUp') {
      server.postUp = value;
    }
    if (key === 'PostDown') {
      server.postDown = value;
    }
    if (key === 'PublicKey') {
      server.publicKey = value;
    }
    if (key === '[Peer]') {
      reachedPeers = true;
    }
  }
  server.status = (await wgCheckout(configId)) ? 'up' : 'down';
  return server;
}

/**
 * This function checks if a WireGuard config exists in file system
 * @param configId
 */
function wgConfExists(configId: number): boolean {
  const confPath = resolveConfigPath(configId);
  return fsAccess(confPath);
}

/**
 * Used to read /etc/wireguard/*.conf and sync them with our
 * redis server.
 */
async function syncServers(): Promise<boolean> {
  // get files in /etc/wireguard
  const files = fs.readdirSync(WG_PATH);
  // filter files that start with wg and end with .conf
  const reg = new RegExp(/^wg(\d+)\.conf$/);
  const confs = files.filter((f) => reg.test(f));
  // read all confs
  const servers = await Promise.all(confs.map((f) => readWgConf(parseInt(f.match(reg)![1]))));

  const client = getClient();
  // remove old servers
  await client.del(WG_SEVER_PATH);
  // save all servers to redis
  await client.lpush(WG_SEVER_PATH, ...servers.map((s) => JSON.stringify(s)));

  return true;
}

function wgPeersStr(configId: number): string[] {
  const confPath = path.resolve(WG_PATH, `wg${configId}.conf`);
  const conf = fs.readFileSync(confPath, 'utf-8');
  const rawPeers = conf.split('[Peer]');
  return rawPeers.slice(1).map((p) => `[Peer]\n${p}`);
}

export async function generateWgKey(): Promise<WgKey> {
  const privateKey = await Shell.exec('wg genkey');
  const publicKey = await Shell.exec(`echo ${privateKey} | wg pubkey`);
  const preSharedKey = await Shell.exec('wg genkey');
  return { privateKey, publicKey, preSharedKey };
}

interface GenerateWgServerParams {
  name: string;
  address: string;
  tor: boolean;
  port: number;
  dns?: string;
  mtu?: number;
  insertDb?: boolean;
}

export async function generateWgServer(config: GenerateWgServerParams): Promise<string> {
  const { privateKey, publicKey } = await generateWgKey();

  // inside redis create a config list
  const confId = await getNextFreeConfId();
  const uuid = crypto.randomUUID();

  let server: WgServer = {
    id: uuid,
    confId,
    confHash: null,
    tor: config.tor,
    name: config.name,
    address: config.address,
    listen: config.port,
    dns: config.dns || null,
    privateKey,
    publicKey,
    preUp: null,
    preDown: null,
    postDown: null,
    postUp: null,
    peers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'up',
  };

  // check if address or port are already reserved
  if (await isIPReserved(config.address)) {
    throw new Error(`Address ${config.address} is already reserved!`);
  }

  if (await isPortReserved(config.port)) {
    throw new Error(`Port ${config.port} is already reserved!`);
  }

  // setting iptables
  const iptables = await makeWgIptables(server);
  server.postUp = iptables.up;
  server.postDown = iptables.down;

  // save server config
  if (false !== config.insertDb) {
    const client = getClient();
    await client.lpush(WG_SEVER_PATH, JSON.stringify(server));
  }

  const CONFIG_PATH = resolveConfigPath(confId);

  // save server config to disk
  fs.writeFileSync(CONFIG_PATH, await genServerConf(server), { mode: 0o600 });

  // updating hash of the config
  const wg = new WGServer(uuid);
  await wg.update({ confHash: getConfigHash(confId) });

  // to ensure interface does not exists
  await Shell.exec(`wg-quick down wg${confId}`, true);

  // restart WireGuard
  await Shell.exec(`wg-quick up wg${confId}`);

  // return server id
  return uuid;
}

export async function isIPReserved(ip: string): Promise<boolean> {
  const addresses = (await getServers()).map((s) => s.address);
  return addresses.includes(ip);
}

export async function isPortReserved(port: number): Promise<boolean> {
  const inUsePorts = [
    await Network.getInUsePorts(),
    (await getServers()).map((s) => Number(s.listen)),
  ].flat();
  return inUsePorts.includes(port);
}

export async function isConfigIdReserved(id: number): Promise<boolean> {
  const ids = (await getServers()).map((s) => s.confId);
  return ids.includes(id);
}

export async function getNextFreeConfId(): Promise<number> {
  let id = maxConfId() + 1;
  for (let i = id; i < 1_000; i++) {
    if (!(await isConfigIdReserved(i))) {
      return i;
    }
  }
  throw new Error('WireGuard: Error: Could not find a free config id');
}

export function getConfigHash(confId: number): string | undefined {
  if (!wgConfExists(confId)) {
    return undefined;
  }

  const confPath = resolveConfigPath(confId);
  const conf = fs.readFileSync(confPath, 'utf-8');
  return sha256(conf);
}

export function maxConfId(): number {
  // get files in /etc/wireguard
  const files = fs.readdirSync(WG_PATH);
  // filter files that start with wg and end with .conf
  const reg = new RegExp(/^wg(\d+)\.conf$/);
  const confs = files.filter((f) => reg.test(f));

  const ids = confs.map((f) => {
    const m = f.match(reg);
    if (m) {
      return parseInt(m[1]);
    }
    return 0;
  });

  return Math.max(0, ...ids);
}

export async function getServers(): Promise<WgServer[]> {
  const client = getClient();
  const rawServers = await client.lrange(WG_SEVER_PATH, 0, -1);
  return rawServers.map((s) => JSON.parse(s));
}

export async function findServerIndex(id: string): Promise<number | undefined> {
  let index = 0;
  const servers = await getServers();
  for (const s of servers) {
    if (s.id === id) {
      return index;
    }
    index++;
  }
  return undefined;
}

export async function findServer(
  id: string | undefined,
  hash?: string,
): Promise<WgServer | undefined> {
  const servers = await getServers();
  return id
    ? servers.find((s) => s.id === id)
    : hash && isJson(hash)
      ? servers.find((s) => JSON.stringify(s) === hash)
      : undefined;
}

export async function makeWgIptables(s: WgServer): Promise<{ up: string; down: string }> {
  const inet = await Network.defaultInterface();
  const inet_address = await Shell.exec(`hostname -i | awk '{print $1}'`);

  const source = `${s.address}/24`;
  const wg_inet = `wg${s.confId}`;

  if (s.tor) {
    const up = dynaJoin([
      `iptables -A INPUT -m state --state ESTABLISHED -j ACCEPT`,
      `iptables -A INPUT -i ${wg_inet} -s ${source} -m state --state NEW -j ACCEPT`,
      `iptables -t nat -A PREROUTING -i ${wg_inet} -p udp -s ${source} --dport 53 -j DNAT --to-destination ${inet_address}:53530`,
      `iptables -t nat -A PREROUTING -i ${wg_inet} -p tcp -s ${source} -j DNAT --to-destination ${inet_address}:9040`,
      `iptables -t nat -A PREROUTING -i ${wg_inet} -p udp -s ${source} -j DNAT --to-destination ${inet_address}:9040`,
      `iptables -t nat -A OUTPUT -o lo -j RETURN`,
      `iptables -A OUTPUT -m conntrack --ctstate INVALID -j DROP`,
      `iptables -A OUTPUT -m state --state INVALID -j DROP`,
      `iptables -A OUTPUT ! -o lo ! -d 127.0.0.1 ! -s 127.0.0.1 -p tcp -m tcp --tcp-flags ACK,FIN ACK,FIN -j DROP`,
    ]).join('; ');
    return { up, down: up.replace(/-A/g, '-D') };
  }

  const up = dynaJoin([
    `iptables -t nat -A POSTROUTING -s ${source} -o ${inet} -j MASQUERADE`,
    `iptables -A INPUT -p udp -m udp --dport ${s.listen} -j ACCEPT`,
    `iptables -A INPUT -p tcp -m tcp --dport ${s.listen} -j ACCEPT`,
    `iptables -A FORWARD -i ${wg_inet} -j ACCEPT`,
    `iptables -A FORWARD -o ${wg_inet} -j ACCEPT`,
  ]).join('; ');
  return { up, down: up.replace(/ -A /g, ' -D ') };
}

export async function genServerConf(server: WgServer): Promise<string> {
  const iptables = await makeWgIptables(server);
  server.postUp = iptables.up;
  server.postDown = iptables.down;

  const lines = [
    '# Autogenerated by WireGuard UI (WireAdmin)',
    '[Interface]',
    `PrivateKey = ${server.privateKey}`,
    `Address = ${server.address}/24`,
    `ListenPort = ${server.listen}`,
    `${server.dns ? `DNS = ${server.dns}` : 'OMIT'}`,
    '',
    `${server.preUp ? `PreUp = ${server.preUp}` : 'OMIT'}`,
    `${server.postUp ? `PostUp = ${server.postUp}` : 'OMIT'}`,
    `${server.preDown ? `PreDown = ${server.preDown}` : 'OMIT'}`,
    `${server.postDown ? `PostDown = ${server.postDown}` : 'OMIT'}`,
  ];
  server.peers.forEach((peer, index) => {
    lines.push('');
    lines.push(`## ${peer.name || `Peer #${index + 1}`}`);
    lines.push('[Peer]');
    lines.push(`PublicKey = ${peer.publicKey}`);
    lines.push(`${peer.preSharedKey ? `PresharedKey = ${peer.preSharedKey}` : 'OMIT'}`);
    lines.push(`AllowedIPs = ${peer.allowedIps}/32`);
    lines.push(
      `${peer.persistentKeepalive ? `PersistentKeepalive = ${peer.persistentKeepalive}` : 'OMIT'}`,
    );
  });

  return lines.filter((l) => l !== 'OMIT').join('\n');
}

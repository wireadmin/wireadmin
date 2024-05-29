import fs, { promises } from 'node:fs';
import path from 'path';
import deepmerge from 'deepmerge';
import { execa } from 'execa';
import { ip } from 'node-netkit';

import { WG_PATH } from '$lib/constants';
import logger from '$lib/logger';
import Network from '$lib/network';
import { WG_STORE } from '$lib/storage';
import type { Peer, WgKey, WgServer } from '$lib/typings';
import { dynaJoin, sleep } from '$lib/utils';
import { fsAccess } from '$lib/utils/fs-extra';
import { sha256 } from '$lib/utils/hash';
import { getPeerConf } from '$lib/wireguard/utils';

export class WGServer {
  readonly id: string;
  readonly peers: WGPeers;

  constructor(serverId: string) {
    if (!serverId) {
      throw new Error('WGServer: id is required');
    }

    if (!WGServer.exists(serverId)) {
      throw new Error('WGServer: server not found');
    }

    this.id = serverId;
    this.peers = new WGPeers(this);
  }

  static async exists(id: string): Promise<boolean> {
    const exists = await WG_STORE.exists(id);
    if (!exists) {
      logger.debug(`WireGuard: ServerExists: server does not exists. Id: ${id}`);
      logger.debug(await WG_STORE.getall());
      return false;
    }

    return true;
  }

  async get(): Promise<WgServer> {
    if (!fsAccess(WG_PATH)) {
      logger.debug(`WireGuard: Get: path does not exists. Path: ${WG_PATH}`);
      await promises.mkdir(WG_PATH, { recursive: true, mode: 0o600 });
    }

    const server = await WG_STORE.get(this.id);
    if (!server) {
      throw new Error('WireGuard: Server not found');
    }

    const confPath = resolveConfigPath(server.confId);
    if (!fsAccess(confPath)) {
      logger.debug(`WireGuard: Get: config file does not exists. Path: ${confPath}`);
      await this.writeConfigFile(server);
    }

    return server;
  }

  async stop(): Promise<boolean> {
    const server = await this.get();

    const iface = `wg${server.confId}`;

    if (await Network.interfaceExists(iface)) {
      await execa(`wg-quick down ${iface}`, { shell: true });
    }

    await this.update({ status: 'down' });

    // TODO: Drop any iptables rules related the interface

    return true;
  }

  async start(): Promise<void> {
    const server = await this.get();

    const HASH = getConfigHash(server.confId);
    if (!HASH || server.confHash !== HASH) {
      await this.writeConfigFile(server);
    }

    const isAlreadyUp = await this.isUp();
    if (isAlreadyUp) {
      logger.debug('WGServer:Start: interface already up... taking down');
      await execa(`wg-quick down wg${server.confId}`, { shell: true });
    }

    await execa(`wg-quick up wg${server.confId}`, { shell: true });

    await this.update({ status: 'up' });
  }

  async remove(): Promise<void> {
    const server = await WG_STORE.get(this.id);
    if (!server) {
      logger.warn(`WireGuard: Remove: server not found. Id: ${this.id}`);
      return;
    }

    if (wgConfExists(server.confId)) {
      logger.debug(`WireGuard: Remove: deleting config file. Id: ${this.id}`);
      await promises.unlink(resolveConfigPath(server.confId));
    }

    await WG_STORE.del(this.id);
  }

  async update(update: Partial<WgServer>): Promise<boolean> {
    const server = await WG_STORE.get(this.id);
    if (!server) {
      logger.warn(`WireGuard: Update: server not found. Id: ${this.id}`);
      return true;
    }

    await WG_STORE.set(this.id, {
      ...deepmerge(server, update),
      peers: update?.peers || server?.peers || [],
      updatedAt: new Date().toISOString(),
    });

    return true;
  }

  async writeConfigFile(wg: WgServer): Promise<void> {
    const CONFIG_PATH = resolveConfigPath(wg.confId);
    fs.writeFileSync(CONFIG_PATH, await genServerConf(wg), { mode: 0o600 });
    await this.update({ confHash: getConfigHash(wg.confId) });
  }

  async isUp(): Promise<boolean> {
    const server = await this.get();
    try {
      const res = await execa(`wg show wg${server.confId}`, { shell: true });
      return res.stdout.includes('wg');
    } catch (e) {
      return false;
    }
  }

  async getUsage(): Promise<WgUsage> {
    const server = await this.get();
    const hasInterface = await this.isUp();

    const usages: WgUsage = {
      total: { rx: 0, tx: 0 },
      peers: new Map(),
    };

    if (!hasInterface) {
      logger.debug('WGServer: GetUsage: interface does not exists');
      return usages;
    }

    const { stdout, stderr } = await execa(`wg show wg${server.confId} transfer`, {
      shell: true,
    });
    if (stderr) {
      logger.warn(`WgServer: GetUsage: ${stderr}`);
      return usages;
    }

    const lines = stdout.split('\n');
    for (const line of lines) {
      const [peer, tx, rx] = line.split('\t');
      if (!peer) continue;
      usages.peers.set(peer, { rx: Number(rx), tx: Number(tx) });
      usages.total.rx += Number(rx);
      usages.total.tx += Number(tx);
    }

    return usages;
  }

  static async getFreePeerIp(serverId: string): Promise<string | undefined> {
    const server = await WG_STORE.get(serverId);
    if (!server) {
      logger.error('WGServer: GetFreePeerIP: no server found');
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

    logger.error('WGServer: GetFreePeerIP: no free ip found');
    return undefined;
  }
}

export type WgUsage = {
  total: PeerUsage;
  peers: Map<string, PeerUsage>;
};

export type PeerUsage = {
  rx: number;
  tx: number;
};

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
      ])
    );
    fs.writeFileSync(confPath, lines.join('\n'), { mode: 0o600 });
    await this.server.update({ confHash: getConfigHash(server.confId) });

    await WG_STORE.set(this.server.id, {
      ...server,
      peers: [...server.peers, peer],
    });

    if (server.status === 'up') {
      await this.server.stop();
      await this.server.start();
    }

    return true;
  }

  async remove(publicKey: string): Promise<boolean> {
    const server = await this.server.get();
    const peers = wgPeersStr(server.confId);

    await WG_STORE.set(this.server.id, {
      ...server,
      peers: server.peers.filter((p) => p.publicKey !== publicKey),
    });

    const peerIndex = peers.findIndex((p) => p.includes(`PublicKey = ${publicKey}`));
    if (peerIndex === -1) {
      logger.warn('WGPeers:Remove: peer not found');
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

    const updatedPeers = server.peers.map((p) => {
      if (p.publicKey !== publicKey) return p;
      return deepmerge(p, update);
    });

    await WG_STORE.set(this.server.id, { ...server, peers: updatedPeers });
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
    const server = await WG_STORE.get(this.server.id);
    if (!server) {
      logger.error('WGPeers:GeneratePeerConfig: server not found');
      return undefined;
    }

    const peer = server.peers.find((p) => p.id === peerId);
    if (!peer) {
      logger.error('WGPeers:GeneratePeerConfig: peer not found');
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

  const hasInterface = await Network.interfaceExists(`wg${configId}`);
  server.status = hasInterface ? 'up' : 'down';

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

function wgPeersStr(configId: number): string[] {
  const confPath = path.resolve(WG_PATH, `wg${configId}.conf`);
  const conf = fs.readFileSync(confPath, 'utf-8');
  const rawPeers = conf.split('[Peer]');
  return rawPeers.slice(1).map((p) => `[Peer]\n${p}`);
}

export async function generateWgKey(): Promise<WgKey> {
  const { stdout: privateKey } = await execa('wg genkey', { shell: true });
  const { stdout: publicKey } = await execa(`echo ${privateKey} | wg pubkey`, {
    shell: true,
  });
  const { stdout: preSharedKey } = await execa('wg genkey', { shell: true });
  return { privateKey, publicKey, preSharedKey };
}

interface GenerateWgServerParams {
  name: string;
  address: string;
  tor: boolean;
  port: number;
  dns?: string;
  mtu?: number;
}

export async function generateWgServer(config: GenerateWgServerParams): Promise<string> {
  const { privateKey, publicKey } = await generateWgKey();

  // Inside storage create a config list
  const confId = await getNextFreeConfId();
  const uuid = crypto.randomUUID();

  logger.debug(
    `WireGuard: GenerateWgServer: creating server with id: ${uuid} and confId: ${confId}`
  );

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

  // Check if address or port is already reserved
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
  logger.debug('WireGuard: GenerateWgServer: saving server to storage');
  logger.debug(server);
  await WG_STORE.set(uuid, server);

  const CONFIG_PATH = resolveConfigPath(confId);

  // save server config to disk
  logger.debug('WireGuard: GenerateWgServer: writing config file');
  fs.writeFileSync(CONFIG_PATH, await genServerConf(server), { mode: 0o600 });

  await sleep(50);

  // updating hash of the config
  logger.debug('WireGuard: GenerateWgServer: updating config hash');
  const wg = new WGServer(uuid);
  await wg.update({ confHash: getConfigHash(confId) });

  // to ensure interface does not exists
  await wg.stop();

  // restart WireGuard
  await wg.start();

  // return server id
  return uuid;
}

export async function isIPReserved(ip: string): Promise<boolean> {
  const severs = await WG_STORE.listServers();
  const addresses = severs.map((s) => s.address);
  return addresses.includes(ip);
}

export async function isPortReserved(port: number): Promise<boolean> {
  const severs = await WG_STORE.listServers();
  const inUsePorts = [await Network.inUsePorts(), severs.map((s) => Number(s.listen))].flat();
  return inUsePorts.includes(port);
}

export async function isConfigIdReserved(id: number): Promise<boolean> {
  const severs = await WG_STORE.listServers();
  const ids = severs.map((s) => s.confId);
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
    logger.debug('WireGuard: GetConfigHash: config does not exists. ConfId:', confId);
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

export async function makeWgIptables(s: WgServer): Promise<{ up: string; down: string }> {
  const source = `${s.address}/24`;

  const route = await ip.route.defaultRoute();
  const wg_inet = `wg${s.confId}`;
  const loopback = '127.0.0.1';

  if (!route) {
    throw new Error('No default route found');
  }

  const { stdout: inet_address } = await execa(`hostname -i | awk '{print $1}'`, { shell: true });

  if (s.tor) {
    // https://trac.torproject.org/projects/tor/wiki/doc/TransparentProxy#WARNING
    // https://lists.torproject.org/pipermail/tor-talk/2014-March/032503.html
    const out_iface = route.dev;
    const virt_addr = '10.192.0.0/10';
    const trans_port = '59040';
    const dns_port = '53530';
    const non_tor = '127.0.0.0/8 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16'.split(' ');
    const resv_iana =
      '0.0.0.0/8 100.64.0.0/10 169.254.0.0/16 192.0.0.0/24 192.0.2.0/24 192.88.99.0/24 198.18.0.0/15 198.51.100.0/24 203.0.113.0/24 224.0.0.0/4 240.0.0.0/4 255.255.255.255/32'.split(
        ' '
      );
    const up = dynaJoin(
      [
        `iptables -A INPUT -m state --state ESTABLISHED -j ACCEPT`,
        `iptables -t nat -A INPUT -i lo -j ACCEPT`,
        `iptables -A OUTPUT -d 127.0.0.1/32 -o lo -j ACCEPT`,
        `iptables -A INPUT -i ${wg_inet} -s ${source} -m state --state NEW -j ACCEPT`,
        // nat dns requests to Tor
        `iptables -t nat -A PREROUTING -i ${wg_inet} -p udp --dport 53 -j DNAT --to-destination ${inet_address}:${dns_port}`,
        // Redirect all other pre-routing and output to Tor's TransPort
        `iptables -t nat -A PREROUTING -i ${wg_inet} -p tcp -j DNAT --to-destination ${inet_address}:${trans_port}`,
        `iptables -t nat -A PREROUTING -i ${wg_inet} -p udp -j DNAT --to-destination ${inet_address}:${trans_port}`,
        // Allow Tor process output
        `iptables -A OUTPUT -o ${out_iface} -p tcp -m tcp --tcp-flags FIN,SYN,RST,ACK SYN -m state --state NEW -j ACCEPT`,
        // nat .onion addresses
        `iptables -t nat -A OUTPUT -d ${virt_addr} -p tcp -m tcp -j DNAT --to-destination ${inet_address}:${trans_port}`,
        `iptables -A OUTPUT -m state --state ESTABLISHED -j ACCEPT`,
        `iptables -A OUTPUT -m conntrack --ctstate INVALID -j DROP`,
        `iptables -A OUTPUT -m state --state INVALID -j DROP`,
        // Allow lan access for hosts in $non_tor
        [non_tor, resv_iana].flat().map((n) => `iptables -t nat -A OUTPUT -d ${n} -j RETURN`),
        // Don't nat the Tor process, the loopback, or the local network
        `iptables -t nat -A OUTPUT -o lo -j RETURN`,
        `iptables -A OUTPUT ! -o lo ! -d ${loopback} ! -s ${loopback} -p tcp -m tcp --tcp-flags ACK,FIN ACK,FIN -j DROP`,
        `iptables -A OUTPUT ! -o lo ! -d ${loopback} ! -s ${loopback} -p tcp -m tcp --tcp-flags ACK,RST ACK,RST -j DROP`,
      ].flat()
    ).join('; ');
    return { up, down: up.replace(/ -A /g, ' -D ') };
  }

  const up = dynaJoin([
    `iptables -t nat -A POSTROUTING -s ${source} -o ${route.dev} -j MASQUERADE`,
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
      `${peer.persistentKeepalive ? `PersistentKeepalive = ${peer.persistentKeepalive}` : 'OMIT'}`
    );
  });

  return lines.filter((l) => l !== 'OMIT').join('\n');
}

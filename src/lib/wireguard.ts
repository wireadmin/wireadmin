import { promises as fs } from "fs";
import path from "path";
import { WG_PATH } from "@lib/constants";
import Shell from "@lib/shell";
import { WgKey, WgServer } from "@lib/typings";
import { client, WG_SEVER_PATH } from "@lib/redis";
import { dynaJoin, isJson } from "@lib/utils";
import deepmerge from "deepmerge";
import { getPeerConf, getServerConf } from "@lib/wireguard-utils";
import Network from "@lib/network";

export class WGServer {

  static async stop(id: string): Promise<boolean> {
    const server = await findServer(id)
    if (!server) {
      console.error('server could not be updated (reason: not exists)')
      return false
    }

    await Shell.exec(`wg-quick down wg${server.confId}`, true)

    await this.update(id, { status: 'down' })
    return true
  }

  static async start(id: string): Promise<boolean> {
    const server = await findServer(id)
    if (!server) {
      console.error('server could not be updated (reason: not exists)')
      return false
    }

    await Shell.exec(`wg-quick down wg${server.confId}`, true)
    await Shell.exec(`wg-quick up wg${server.confId}`)

    await this.update(id, { status: 'up' })
    return true
  }

  static async remove(id: string): Promise<boolean> {
    const server = await findServer(id)
    if (!server) {
      console.error('server could not be updated (reason: not exists)')
      return false
    }

    await this.stop(id)
    await fs.unlink(path.join(WG_PATH, `wg${server.confId}.conf`)).catch(() => null)

    const index = await findServerIndex(id)
    if (typeof index !== 'number') {
      console.warn('findServerIndex: index not found')
      return true
    }

    const element = await client.lindex(WG_SEVER_PATH, index)
    if (!element) {
      console.warn('remove: element not found')
      return true
    }

    await client.lrem(WG_SEVER_PATH, 1, element)

    return true
  }

  static async update(id: string, update: Partial<WgServer>): Promise<boolean> {
    const server = await findServer(id)
    if (!server) {
      console.error('server could not be updated (reason: not exists)')
      return false
    }
    const index = await findServerIndex(id)
    if (typeof index !== 'number') {
      console.warn('findServerIndex: index not found')
      return true
    }
    const res = await client.lset(WG_SEVER_PATH, index, JSON.stringify({
      ...deepmerge(server, update),
      peers: update?.peers || server?.peers || [],
      updatedAt: new Date().toISOString()
    }))
    return res === 'OK'
  }

  static async findAttachedUuid(confId: number): Promise<string | undefined> {
    const server = await getServers()
    return server.find((s) => s.confId === confId)?.id
  }

  static async addPeer(id: string, peer: WgServer['peers'][0]): Promise<boolean> {
    const server = await findServer(id)
    if (!server) {
      console.error('server could not be updated (reason: not exists)')
      return false
    }

    const confPath = path.join(WG_PATH, `wg${server.confId}.conf`)
    const conf = await fs.readFile(confPath, 'utf-8')
    const lines = conf.split('\n')

    lines.push(...dynaJoin([
      `[Peer]`,
      `PublicKey = ${peer.publicKey}`,
      peer.preSharedKey && `PresharedKey = ${peer.preSharedKey}`,
      `AllowedIPs = ${peer.allowedIps}/32`,
      peer.persistentKeepalive && `PersistentKeepalive = ${peer.persistentKeepalive}`
    ]))
    await fs.writeFile(confPath, lines.join('\n'))

    const index = await findServerIndex(id)
    if (typeof index !== 'number') {
      console.warn('findServerIndex: index not found')
      return true
    }
    await client.lset(WG_SEVER_PATH, index, JSON.stringify({
      ...server,
      peers: [ ...server.peers, peer ]
    }))

    await this.stop(server.id)
    await this.start(server.id)
    return true
  }

  static async removePeer(id: string, publicKey: string): Promise<boolean> {
    const server = await findServer(id)
    if (!server) {
      console.error('server could not be updated (reason: not exists)')
      return false
    }
    const peers = await wgPeersStr(server.confId)

    const index = await findServerIndex(id)
    if (typeof index !== 'number') {
      console.warn('findServerIndex: index not found')
      return true
    }
    await client.lset(WG_SEVER_PATH, index, JSON.stringify({
      ...server,
      peers: server.peers.filter((p) => p.publicKey !== publicKey)
    }))

    const peerIndex = peers.findIndex((p) => p.includes(`PublicKey = ${publicKey}`))
    if (peerIndex === -1) {
      console.warn('removePeer: no peer found')
      return false
    }

    const confPath = path.join(WG_PATH, `wg${server.confId}.conf`)
    const conf = await fs.readFile(confPath, 'utf-8')
    const serverConfStr = conf.includes('[Peer]') ?
       conf.split('[Peer]')[0] :
       conf
    const peersStr = peers.filter((_, i) => i !== peerIndex).join('\n')
    await fs.writeFile(confPath, `${serverConfStr}\n${peersStr}`)

    await WGServer.stop(server.id)
    await WGServer.start(server.id)

    return true
  }

  static async getFreePeerIp(id: string): Promise<string | undefined> {
    const server = await findServer(id)
    if (!server) {
      console.error('getFreePeerIp: server not found')
      return undefined
    }
    const reservedIps = server.peers.map((p) => p.allowedIps)
    const ips = reservedIps.map((ip) => ip.split('/')[0])
    const net = server.address.split('/')[0].split('.')
    for (let i = 1; i < 255; i++) {
      const ip = `${net[0]}.${net[1]}.${net[2]}.${i}`
      if (!ips.includes(ip) && ip !== server.address.split('/')[0]) {
        return ip
      }
    }
    console.error('getFreePeerIp: no free ip found')
    return undefined
  }

  static async generatePeerConfig(id: string, peerId: string): Promise<string | undefined> {
    const server = await findServer(id)
    if (!server) {
      console.error('generatePeerConfig: server not found')
      return undefined
    }
    const peer = server.peers.find((p) => p.id === peerId)
    if (!peer) {
      console.error('generatePeerConfig: peer not found')
      return undefined
    }
    return await getPeerConf({
      ...peer,
      serverPublicKey: server.publicKey,
      port: server.listen,
      dns: server.dns
    })
  }

}

/**
 * This function is for checking out WireGuard server is running
 */
async function wgCheckout(configId: number): Promise<boolean> {
  const res = await Shell.exec(`ip link show | grep wg${configId}`, true)
  return res.includes(`wg${configId}`)
}

export async function readWgConf(configId: number): Promise<WgServer> {
  const confPath = path.join(WG_PATH, `wg${configId}.conf`)
  const conf = await fs.readFile(confPath, 'utf-8')
  const lines = conf.split('\n')
  const server: WgServer = {
    id: crypto.randomUUID(),
    confId: configId,
    type: 'direct',
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
    status: 'down'
  }
  let reachedPeers = false
  for (const line of lines) {
    const [ key, value ] = line.split('=').map((s) => s.trim())
    if (reachedPeers) {
      if (key === '[Peer]') {
        server.peers.push({
          id: crypto.randomUUID(),
          name: `Unknown #${server.peers.length + 1}`,
          publicKey: '',
          privateKey: '', // it's okay to be empty because, we not using it on server
          preSharedKey: '',
          allowedIps: '',
          persistentKeepalive: null
        })
      }
      if (key === 'PublicKey') {
        server.peers[server.peers.length - 1].publicKey = value
      }
      if (key === 'PresharedKey') {
        server.peers[server.peers.length - 1].preSharedKey = value
      }
      if (key === 'AllowedIPs') {
        server.peers[server.peers.length - 1].allowedIps = value
      }
      if (key === 'PersistentKeepalive') {
        server.peers[server.peers.length - 1].persistentKeepalive = parseInt(value)
      }
    }
    if (key === 'PrivateKey') {
      server.privateKey = value
    }
    if (key === 'Address') {
      server.address = value
    }
    if (key === 'ListenPort') {
      server.listen = parseInt(value)
    }
    if (key === 'DNS') {
      server.dns = value
    }
    if (key === 'PreUp') {
      server.preUp = value
    }
    if (key === 'PreDown') {
      server.preDown = value
    }
    if (key === 'PostUp') {
      server.postUp = value
    }
    if (key === 'PostDown') {
      server.postDown = value
    }
    if (key === 'PublicKey') {
      server.publicKey = value
    }
    if (key === '[Peer]') {
      reachedPeers = true
    }
  }
  server.status = await wgCheckout(configId) ? 'up' : 'down'
  return server
}

/**
 * This function checks if a WireGuard config exists in file system
 * @param configId
 */
async function wgConfExists(configId: number): Promise<boolean> {
  const confPath = path.join(WG_PATH, `wg${configId}.conf`)
  try {
    await fs.access(confPath)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Used to read /etc/wireguard/*.conf and sync them with our
 * redis server.
 */
async function syncServers(): Promise<boolean> {
  // get files in /etc/wireguard
  const files = await fs.readdir(WG_PATH)
  // filter files that start with wg and end with .conf
  const reg = new RegExp(/^wg(\d+)\.conf$/)
  const confs = files.filter((f) => reg.test(f))
  // read all confs
  const servers = await Promise.all(confs.map((f) => readWgConf(parseInt(f.match(reg)![1]))))
  // remove old servers
  await client.del(WG_SEVER_PATH)
  // save all servers to redis
  await client.lpush(WG_SEVER_PATH, ...servers.map((s) => JSON.stringify(s)))
  return true
}

async function wgPeersStr(configId: number): Promise<string[]> {
  const confPath = path.join(WG_PATH, `wg${configId}.conf`)
  const conf = await fs.readFile(confPath, 'utf-8')
  const rawPeers = conf.split('[Peer]')
  return rawPeers.slice(1).map((p) => `[Peer]\n${p}`)
}

export async function generateWgKey(): Promise<WgKey> {
  const privateKey = await Shell.exec('wg genkey');
  const publicKey = await Shell.exec(`echo ${privateKey} | wg pubkey`);
  const preSharedKey = await Shell.exec('wg genkey');
  return { privateKey, publicKey, preSharedKey }
}

export async function generateWgServer(config: {
  name: string
  address: string
  type: WgServer['type']
  port: number
  dns?: string
  mtu?: number
  insertDb?: boolean
}): Promise<string> {

  const { privateKey, publicKey } = await generateWgKey();

  // inside redis create a config list
  const confId = await maxConfId() + 1
  const uuid = crypto.randomUUID()

  let server: WgServer = {
    id: uuid,
    confId,
    type: config.type,
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
    status: 'up'
  }

  // check if address or port are already reserved
  const [ addresses, ports ] = (await getServers())
     .map((s) => [ s.address, s.listen ])

  // check for the conflict
  if (Array.isArray(addresses) && addresses.includes(config.address)) {
    throw new Error(`Address ${config.address} is already reserved!`)
  }

  if (Array.isArray(addresses) && ports.includes(config.port)) {
    throw new Error(`Port ${config.port} is already reserved!`)
  }

  // setting iptables
  const iptables = await makeWgIptables(server)
  server.postUp = iptables.up
  server.postDown = iptables.down

  // save server config
  if (false !== config.insertDb) {
    await client.lpush(WG_SEVER_PATH, JSON.stringify(server))
  }

  const CONFIG_PATH = path.join(WG_PATH, `wg${confId}.conf`)

  // save server config to disk
  await fs.writeFile(CONFIG_PATH, getServerConf(server), {
    mode: 0o600,
  })

  // to ensure interface does not exists
  await Shell.exec(`wg-quick down wg${confId}`, true)

  // restart WireGuard
  await Shell.exec(`wg-quick up wg${confId}`)

  // return server id
  return uuid
}

export async function maxConfId(): Promise<number> {
  // get files in /etc/wireguard
  const files = await fs.readdir(WG_PATH)
  // filter files that start with wg and end with .conf
  const reg = new RegExp(/^wg(\d+)\.conf$/)
  const confs = files.filter((f) => reg.test(f))
  const ids = confs.map((f) => {
    const m = f.match(reg)
    if (m) {
      return parseInt(m[1])
    }
    return 0
  })
  return Math.max(0, ...ids)
}

export async function getServers(): Promise<WgServer[]> {
  return (await client.lrange(WG_SEVER_PATH, 0, -1)).map((s) => JSON.parse(s))
}

export async function findServerIndex(id: string): Promise<number | undefined> {
  let index = 0;
  const servers = await getServers()
  for (const s of servers) {
    if (s.id === id) {
      return index
    }
    index++
  }
  return undefined
}

export async function findServer(id: string | undefined, hash?: string): Promise<WgServer | undefined> {
  const servers = await getServers()
  return id ?
     servers.find((s) => s.id === id) :
     hash && isJson(hash) ? servers.find((s) => JSON.stringify(s) === hash) :
        undefined
}

async function makeWgIptables(s: WgServer): Promise<{ up: string, down: string }> {
  const inet = await Network.defaultInterface()
  const source = `${s.address}/24`
  const wgInet = `wg${s.confId}`

  if (s.type === 'direct') {
    const up = dynaJoin([
      `iptables -t nat -A POSTROUTING -s ${source} -o ${inet} -j MASQUERADE`,
      `iptables -A INPUT -p udp -m udp --dport ${s.listen} -j ACCEPT`,
      `iptables -A INPUT -p tcp -m tcp --dport ${s.listen} -j ACCEPT`,
      `iptables -A FORWARD -i ${wgInet} -j ACCEPT`,
      `iptables -A FORWARD -o ${wgInet} -j ACCEPT`,
    ]).join('; ')
    return { up, down: up.replace(/ -A /g, ' -D ') }
  }

  if (s.type === 'tor') {
    const up = dynaJoin([
      `iptables -A INPUT -m state --state ESTABLISHED -j ACCEPT`,
      `iptables -A INPUT -i ${wgInet} -s ${source} -m state --state NEW -j ACCEPT`,
      `iptables -t nat -A PREROUTING -i ${wgInet} -p udp -s ${source} --dport 53 -j DNAT --to-destination 10.8.0.1:53530`,
      `iptables -t nat -A PREROUTING -i ${wgInet} -p tcp -s ${source} -j DNAT --to-destination 10.8.0.1:9040`,
      `iptables -t nat -A PREROUTING -i ${wgInet} -p udp -s ${source} -j DNAT --to-destination 10.8.0.1:9040`,
      `iptables -t nat -A OUTPUT -o lo -j RETURN`,
      `iptables -A OUTPUT -m conntrack --ctstate INVALID -j DROP`,
      `iptables -A OUTPUT -m state --state INVALID -j DROP`,
      `iptables -A OUTPUT ! -o lo ! -d 127.0.0.1 ! -s 127.0.0.1 -p tcp -m tcp --tcp-flags ACK,FIN ACK,FIN -j DROP`,
    ]).join('; ')
    return { up, down: up.replace(/-A/g, '-D') }
  }

  return { up: '', down: '' }
}

import { promises as fs } from "fs";
import path from "path";
import { WG_PATH } from "@lib/constants";
import Shell from "@lib/shell";
import { WgKey, WgPeer, WgServer } from "@lib/typings";
import { client, WG_SEVER_PATH } from "@lib/redis";
import { isJson } from "@lib/utils";
import deepmerge from "deepmerge";

export class WGServer {

  static async stop(id: string): Promise<boolean> {
    const server = await findServer(id)
    if (!server) {
      console.error('server could not be updated (reason: not exists)')
      return false
    }
    await Shell.exec(`ip link set down dev wg${server.confId}`, true)
    await this.update(id, { status: 'down' })
    return true
  }

  static async start(id: string): Promise<boolean> {
    const server = await findServer(id)
    if (!server) {
      console.error('server could not be updated (reason: not exists)')
      return false
    }
    await createInterface(server.confId, server.address)
    await Shell.exec(`ip link set up dev wg${server.confId}`)
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
    await dropInterface(server.confId)
    await fs.unlink(path.join(WG_PATH, `wg${server.confId}.conf`)).catch(() => null)
    const index = await findServerIndex(id)
    console.log('index', index)
    if (typeof index !== 'number') {
      console.warn('findServerIndex: index not found')
      return true
    } else {
      await client.lrem(WG_SEVER_PATH, 1, JSON.stringify(server))
    }
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
    const res = await client.lset(WG_SEVER_PATH, index, JSON.stringify(deepmerge(server, update)))
    return res === 'OK'
  }

}

/**
 * Used to read /etc/wireguard/*.conf and sync them with our
 * redis server.
 */
async function syncServers(): Promise<boolean> {
  throw new Error('Yet not implanted!');
}

export async function generateWgKey(): Promise<WgKey> {
  const privateKey = await Shell.exec('wg genkey');
  const publicKey = await Shell.exec(`echo ${privateKey} | wg pubkey`);
  return { privateKey, publicKey }
}

export async function generateWgServer(config: {
  name: string
  address: string
  type: WgServer['type']
  port: number
  dns?: string
  mtu?: number
}): Promise<string> {

  const { privateKey, publicKey } = await generateWgKey();

  // inside redis create a config list
  const confId = await maxConfId() + 1
  const uuid = crypto.randomUUID()

  const server: WgServer = {
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

  // save server config
  await client.lpush(WG_SEVER_PATH, JSON.stringify(server))

  const CONFIG_PATH = path.join(WG_PATH, `wg${confId}.conf`)

  // save server config to disk
  await fs.writeFile(CONFIG_PATH, getServerConf(server), {
    mode: 0o600,
  })

  // to ensure interface does not exists
  await dropInterface(confId)
  await Shell.exec(`ip link set down dev wg${confId}`, true)


  // create a interface
  await createInterface(confId, config.address)

  // restart WireGuard
  await Shell.exec(`wg setconf wg${confId} ${CONFIG_PATH}`)
  await Shell.exec(`ip link set up dev wg${confId}`)

  // return server id
  return uuid
}

/**
 *   # ip link add dev wg0 type wireguard
 *   # ip address add dev wg0 10.0.0.1/24
 *
 * @param configId
 * @param address
 */
export async function createInterface(configId: number, address: string): Promise<boolean> {

  // first checking for the interface is already exists
  const interfaces = await Shell.exec(`ip link show | grep wg${configId}`, true)
  if (interfaces.includes(`wg${configId}`)) {
    console.error(`failed to create interface, wg${configId} already exists!`)
    return false
  }

  // create interface
  const o1 = await Shell.exec(`ip link add dev wg${configId} type wireguard`)
  // check if it has error
  if (o1 !== '') {
    console.error(`failed to create interface, ${o1}`)
    return false
  }

  const o2 = await Shell.exec(`ip address add dev wg${configId} ${address}/24`)
  // check if it has error
  if (o2 !== '') {
    console.error(`failed to assign ip to interface, ${o2}`)
    console.log(`removing interface wg${configId} due to errors`)
    await Shell.exec(`ip link delete dev wg${configId}`, true)
    return false
  }

  return true

}

export async function dropInterface(configId: number) {
  await Shell.exec(`ip link delete dev wg${configId}`, true)
}

export function getServerConf(server: WgServer): string {
  return `
# Autogenerated by WireGuard UI (WireAdmin) 
[Interface]
PrivateKey = ${server.privateKey}
Address = ${server.address}/24
ListenPort = ${server.listen}
${server.dns ? `DNS = ${server.dns}` : ''}

PreUp = ${server.preUp}
PostUp = ${server.postUp}
PreDown = ${server.preDown}
PostDown = ${server.postDown}

${server.peers.map(getPeerConf).join('\n')}
 `
}

export function getPeerConf(peer: WgPeer): string {
  return `
[Peer]
PublicKey = ${peer.publicKey}
${peer.preSharedKey ? `PresharedKey = ${peer.preSharedKey}` : ''}
AllowedIPs = ${peer.address}/32
${peer.persistentKeepalive ? `PersistentKeepalive = ${peer.persistentKeepalive}` : ''}
 `
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

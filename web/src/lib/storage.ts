import { Client, HashMap, MSGPack } from 'storage-box';
import { FsDriver } from 'storage-box/node';

import { WG_SEVER_PATH } from '$lib/constants';
import { env } from '$lib/env';
import logger from '$lib/logger';
import type { WgServer } from '$lib/typings';
import { isJson } from '$lib/utils';

const driver = new FsDriver(env.STORAGE_PATH, { parser: MSGPack });

const storage = new Client(driver);
storage._state = 'ready';

export const WG_STORE = storage.createHashMap(
  WG_SEVER_PATH,
  class extends HashMap<string, WgServer> {
    async listServers(): Promise<WgServer[]> {
      const raw = await this.getall();
      const list = [];
      for (const [key, value] of Object.entries(raw)) {
        if (typeof value === 'string' && isJson(value)) {
          list.push(JSON.parse(value));
        } else if (typeof value === 'object') {
          list.push(value);
        } else {
          logger.warn(`WireGuard: ListServers: malformed server: ${key}`);
        }
      }
      return list;
    }

    async findByHash(hash: string): Promise<WgServer | undefined> {
      const servers = await this.listServers();
      return servers.find((s) => s.confHash === hash);
    }
  }
);

export { storage };

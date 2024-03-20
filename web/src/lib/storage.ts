import { Client, FsDriver, MSGPack } from '@litehex/storage-box';
import { resolve } from 'node:path';
import { env } from '$lib/env';

const storagePath = resolve(env.STORAGE_PATH);
const driver = new FsDriver(storagePath, { parser: MSGPack });

export const client = new Client(driver);

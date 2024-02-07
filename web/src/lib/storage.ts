import { Client, MSGPack } from '@litehex/storage-box';
import { FsDriver } from '@litehex/storage-box/driver';
import { resolve } from 'node:path';

const storagePath = resolve(process.cwd(), 'storage.pack');
const driver = new FsDriver(storagePath, { parser: MSGPack });

export const client = new Client(driver);

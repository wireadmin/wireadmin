import { accessSync, promises } from 'fs';

export function fsAccess(path: string): boolean {
  try {
    accessSync(path);
    return true;
  } catch (error) {
    return false;
  }
}

export async function fsTouch(filePath: string): Promise<void> {
  const fd = await promises.open(filePath, 'a');
  await fd.close();
}

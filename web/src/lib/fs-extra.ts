import { promises } from 'fs';

export async function fsAccess(path: string): Promise<boolean> {
  try {
    await promises.access(path);
    return true;
  } catch (error) {
    return false;
  }
}

export async function fsTouch(filePath: string): Promise<void> {
  const fd = await promises.open(filePath, 'a');
  await fd.close();
}

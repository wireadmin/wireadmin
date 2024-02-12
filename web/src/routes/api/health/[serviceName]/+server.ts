import { json, type RequestHandler } from '@sveltejs/kit';
import { execa } from 'execa';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { stdout } = await execa('screen', ['-ls'], { shell: true });
    const isRunning = stdout.includes(params.serviceName!);

    return json({ healthy: isRunning });
  } catch (e) {
    return json({ healthy: false });
  }
};

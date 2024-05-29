import { promises } from 'node:fs';
import { execa } from 'execa';

import logger from '$lib/logger';
import { fsTouch } from '$lib/utils/fs-extra';

export const SERVICES = <const>{
  tor: {
    name: 'Tor',
    start:
      'screen -L -Logfile /var/log/wireadmin/tor.log -dmS tor bash -c "screen -S tor -X wrap off; tor -f /etc/tor/torrc"',
    stop: 'pkill tor',
    logfile: '/var/log/wireadmin/tor.log',
    health: async () => {
      try {
        const { stdout } = await execa('screen', ['-ls'], { shell: true });
        return stdout.includes('tor');
      } catch (_) {
        return false;
      }
    },
  },
  dnsmasq: {
    name: 'Dnsmasq',
    start: 'dnsmasq',
    stop: 'pkill dnsmasq',
    logfile: '/var/log/dnsmasq/dnsmasq.log',
    health: async () => {
      try {
        const { stdout } = await execa('ps cax | grep dnsmasq', { shell: true });
        return stdout.search(/dnsmasq .* dnsmasq$/gm) !== -1;
      } catch (_) {
        return false;
      }
    },
  },
};

export type ServiceName = keyof typeof SERVICES;
export type Service = (typeof SERVICES)[ServiceName];

export function getService(service: ServiceName | string | undefined): Service | undefined {
  if (!!service && service in SERVICES) {
    return SERVICES[service as ServiceName];
  }
}

export function restart(serviceName: ServiceName) {
  const service = SERVICES[serviceName];

  // Stop
  const { exitCode: stopCode } = execa(service.stop, { shell: true });

  // Start
  const { exitCode: startCode } = execa(service.start, { shell: true });

  logger.info(`Restarted ${serviceName} service. Stats: ${stopCode}:${startCode}`);

  return stopCode === 0 && startCode === 0;
}

export async function logs(serviceName: ServiceName): Promise<string> {
  const file = SERVICES[serviceName].logfile;
  await fsTouch(file);
  return await promises.readFile(file, { encoding: 'utf-8' });
}

export async function clearLogs(serviceName: ServiceName): Promise<void> {
  const file = SERVICES[serviceName].logfile;
  const cleared = new Date().toISOString();
  await promises.writeFile(file, `${cleared} [notice] Log file cleared\n`, { encoding: 'utf-8' });
}

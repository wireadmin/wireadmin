import { execa } from 'execa';
import logger from '$lib/logger';

export const SERVICES = <const>{
  tor: {
    name: 'Tor',
    command: {
      start: 'screen -L -Logfile /var/vlogs/tor -dmS "tor" tor -f /etc/tor/torrc',
      stop: 'pkill tor',
      logs: 'logs tor',
    },
  },
};

export type ServiceName = keyof typeof SERVICES;

export function restart(serviceName: ServiceName) {
  // Stop
  const { exitCode: stopExitCode } = execa(SERVICES[serviceName].command.stop, { shell: true });

  // Start
  const { exitCode: startExitCode } = execa(SERVICES[serviceName].command.start, { shell: true });

  logger.info({
    message: `Restarted ${serviceName} service`,
    stopExitCode,
    startExitCode,
  });

  return stopExitCode === 0 && startExitCode === 0;
}

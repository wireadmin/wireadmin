#!/usr/bin/env bash
set -e

source /etc/wireadmin/xscript.sh

ENV_FILE="/app/.env"

echo "                                                   "
echo " _       ___           ___       __          _     "
echo "| |     / (_)_______  /   | ____/ /___ ___  (_)___ "
echo "| | /| / / / ___/ _ \/ /| |/ __  / __ \`__ \/ / __ \\"
echo "| |/ |/ / / /  /  __/ ___ / /_/ / / / / / / / / / /"
echo "|__/|__/_/_/   \___/_/  |_\__,_/_/ /_/ /_/_/_/ /_/ "
echo "                                                   "

touch "$ENV_FILE"
chmod 400 "$ENV_FILE"

if [ -z "$ADMIN_PASSWORD" ]; then
  log warn "No ADMIN_PASSWORD provided, using default password"
fi

# Remove duplicated envs
awk -F= '!a[$1]++' "$ENV_FILE" > "/tmp/$(basename "$ENV_FILE")" \
  && mv "/tmp/$(basename "$ENV_FILE")" "$ENV_FILE"

if [ -z "$WG_HOST" ]; then
  log "error" "the WG_HOST environment variable is not set"
  exit 1
fi

# Generate Tor configuration
generate_tor_config
setup_logrotate
setup_dns

# Background services
crond
dnsmasq

# Start Tor
screen -L -Logfile /var/log/wireadmin/tor.log -dmS tor \
  bash -c "screen -S tor -X wrap off; tor -f $TOR_CONFIG"

sleep 1
echo -e "\n======================== Versions ========================"
echo -e "Alpine: \c" && cat /etc/alpine-release
echo -e "WireGuard: \c" && wg -v | head -n 1 | awk '{print $2}'
echo -e "Tor: \c" && tor --version | head -n 1 | awk '{print $3}' | sed 's/.$//'
echo -e "Dnsmasq: \c" && dnsmasq -v | head -n 1 | cut -d ' ' -f3
echo -e "Lyrebird: \c" && lyrebird -version
echo -e "\n======================= Tor Config ======================="
grep -v "^#" "$TOR_CONFIG"
echo -e "====================== Dnsmasq Config ======================"
grep -v "^#" "$DNSMASQ_CONFIG"
echo -e "==========================================================\n"
sleep 1

exec "$@"

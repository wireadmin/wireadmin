#!/usr/bin/env bash
set -e

ENV_FILE="/app/.env"

TOR_CONFIG="/etc/tor/torrc"
TOR_CONFIG_TEMPLATE="${TOR_CONFIG}.template"

log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] [$1] $2"
}

to_camel_case() {
  echo "${1}" | awk -F_ '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2));}1' OFS=""
}

generate_tor_config() {
  # Copying the torrc template to the torrc file
  cp "${TOR_CONFIG_TEMPLATE}" "${TOR_CONFIG}"

  # IP address of the container
  local inet_address="$(hostname -i | awk '{print $1}')"

  sed -i "s/{{INET_ADDRESS}}/$inet_address/g" "${TOR_CONFIG}"

  # any other environment variables that start with TOR_ are added to the torrc
  # file
  env | grep ^TOR_ | sed -e 's/TOR_//' -e 's/=/ /' | while read -r line; do
    key=$(echo "$line" | awk '{print $1}')
    value=$(echo "$line" | awk '{print $2}')
    key=$(to_camel_case "$key")
    echo "$key $value" >> "${TOR_CONFIG}"
  done

  # Removing duplicated tor options
  awk -F= '!a[tolower($1)]++' "${TOR_CONFIG}" > "/tmp/$(basename "${TOR_CONFIG}")" \
    && mv "/tmp/$(basename "${TOR_CONFIG}")" "${TOR_CONFIG}"

  # Remove comment line with single Hash
  sed -i '/^#\([^#]\)/d' "${TOR_CONFIG}"
  # Remove options with no value. (KEY[:space:]{...VALUE})
  sed -i '/^[^ ]* $/d' "${TOR_CONFIG}"
  # Remove double empty lines
  sed -i '/^$/N;/^\n$/D' "${TOR_CONFIG}"

  log "notice" "Tor configuration file has been generated"
}

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

tee "/etc/logrotate.d/rotator" &> /dev/null << EOF
/var/log/wireadmin/*.log {
  size 512K
  rotate 3
  missingok
  notifempty
  create 0640 root adm
  copytruncate
}
EOF

# Start Tor on the background
crond
_TOR_UID=$(id -u tor)
mkdir -p /var/lib/tor && chown -R "$_TOR_UID:$_TOR_UID" /var/lib/tor
screen -L -Logfile /var/log/wireadmin/tor.log -dmS tor bash -c "screen -S tor -X wrap off; tor -f $TOR_CONFIG"

sleep 1
echo -e "\n======================== Versions ========================"
echo -e "Alpine: \c" && cat /etc/alpine-release
echo -e "WireGuard: \c" && wg -v | head -n 1 | awk '{print $2}'
echo -e "Tor: \c" && tor --version | head -n 1 | cut -d ' ' -f3
echo -e "Lyrebird: \c" && lyrebird -version
echo -e "\n========================= Torrc ========================="
grep -v "^#" "$TOR_CONFIG"
echo -e "========================================================\n"
sleep 1

exec "$@"

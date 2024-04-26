#!/usr/bin/env bash
set -e

ENV_FILE="/app/.env"

TOR_CONFIG="/etc/tor/torrc"
TOR_CONFIG_TEMPLATE="${TOR_CONFIG}.template"

log() {
  local level=$1
  local message=$2
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] [$level] $message"
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
    echo "$key $value" >>"${TOR_CONFIG}"
  done

  # Removing duplicated tor options
  awk -F= '!a[tolower($1)]++' "${TOR_CONFIG}" >"/tmp/$(basename "${TOR_CONFIG}")" &&
    mv "/tmp/$(basename "${TOR_CONFIG}")" "${TOR_CONFIG}"

  # Checking if there is /etc/torrc.d folder and if there are use globbing to include all files
  local torrc_files=$(find /etc/torrc.d -type f -name "*.conf")
  if [ -n "${torrc_files}" ]; then
    log "notice" "Found torrc.d folder with configuration files"
    echo "%include /etc/torrc.d/*.conf" >>"${TOR_CONFIG}"
  fi

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

mkdir -p /var/vlogs

touch "${ENV_FILE}"
chmod 400 "${ENV_FILE}"

if ! grep -q "AUTH_SECRET" "${ENV_FILE}"; then
  tee -a "${ENV_FILE}" &>/dev/null <<EOF
AUTH_SECRET=$(openssl rand -base64 32)
EOF
fi

# Checking if there is `UI_PASSWORD` environment variable
# if there was, converting it to sha256 and storing it to
# the .env
if [ -n "$UI_PASSWORD" ]; then
  sed -i '/^HASHED_PASSWORD/d' "${ENV_FILE}"
  tee -a "${ENV_FILE}" &>/dev/null <<EOF
HASHED_PASSWORD=$(checksum hash -a sha256 -C "${UI_PASSWORD}")
EOF
  unset UI_PASSWORD
else
  log "error" "no password set for the UI"
  exit 1
fi

if [ -z "$WG_HOST" ]; then
log "error" "the WG_HOST environment variable is not set"
  exit 1
fi

# Remove duplicated envs
awk -F= '!a[$1]++' "${ENV_FILE}" >"/tmp/$(basename "${ENV_FILE}")" &&
  mv "/tmp/$(basename "${ENV_FILE}")" "${ENV_FILE}"

# Generate Tor configuration
generate_tor_config

# Start Tor on the background
screen -dmS "tor" tor -f "${TOR_CONFIG}"

sleep 1
echo -e "\n======================== Versions ========================"
echo -e "Alpine Version: \c" && cat /etc/alpine-release
echo -e "WireGuard Version: \c" && wg -v | head -n 1 | awk '{print $1,$2}'
echo -e "Tor Version: \c" && tor --version | head -n 1
echo -e "Obfs4proxy Version: \c" && obfs4proxy -version
echo -e "\n========================= Torrc ========================="
cat "${TOR_CONFIG}"
echo -e "========================================================\n"
sleep 1

exec "$@"

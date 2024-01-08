#!/usr/bin/env bash
set -e

TOR_CONFIG="/etc/tor/torrc"
ENV_FILE="/app/.env"

to_camel_case() {
  echo "${1}" | awk -F_ '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2));}1' OFS=""
}

generate_tor_config() {
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

  # Checking if there is /etc/torrc.d folder and if there is
  # any file in it, adding them to the torrc file
  local torrc_files=$(find /etc/torrc.d -type f -name "*.conf")
  if [ -n "${torrc_files}" ]; then
    for file in ${torrc_files}; do
      cat "$file" >>"${TOR_CONFIG}"
    done
  fi

  # Remove comment line with single Hash
  sed -i '/^#\([^#]\)/d' "${TOR_CONFIG}"
  # Remove options with no value. (KEY[:space:]{...VALUE})
  sed -i '/^[^ ]* $/d' "${TOR_CONFIG}"
  # Remove double empty lines
  sed -i '/^$/N;/^\n$/D' "${TOR_CONFIG}"
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
# if there was, converting it to hex and storing it to
# the .env
if [ -n "$UI_PASSWORD" ]; then
  sed -i '/^HASHED_PASSWORD/d' "${ENV_FILE}"
  tee -a "${ENV_FILE}" &>/dev/null <<EOF
HASHED_PASSWORD=$(printf "%s" "${UI_PASSWORD}" | od -A n -t x1 | tr -d ' \n')
EOF
  unset UI_PASSWORD
else
  echo "[error] no password set for the UI"
  exit 1
fi

if [ -z "$WG_HOST" ]; then
  echo "[error] the WG_HOST environment variable is not set"
  exit 1
fi

# Remove duplicated envs
awk -F= '!a[$1]++' "${ENV_FILE}" >"/tmp/$(basename "${ENV_FILE}")" &&
  mv "/tmp/$(basename "${ENV_FILE}")" "${ENV_FILE}"

# Starting Redis server in detached mode
screen -L -Logfile /var/vlogs/redis -dmS "redis" \
  bash -c "redis-server --port 6479 --daemonize no --dir /data --appendonly yes"

# Generate Tor configuration
generate_tor_config

# Start Tor on the background
screen -L -Logfile /var/vlogs/tor -dmS "tor" tor -f "${TOR_CONFIG}"

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

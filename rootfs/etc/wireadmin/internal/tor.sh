#!/bin/bash

TOR_CONFIG="/etc/tor/torrc"
TOR_CONFIG_TEMPLATE="$TOR_CONFIG.template"

_cleanse_config() {
  # Remove comment line with single Hash
  sed -i '/^#\([^#]\)/d' "$TOR_CONFIG"

  # Remove options with no value. (KEY[:space:]{...VALUE})
  sed -i '/^[^ ]* $/d' "$TOR_CONFIG"

  # Remove duplicate lines
  sed -i '/^$/N;/\n.*\n/d' "$TOR_CONFIG"

  # Remove double empty lines
  sed -i '/^$/N;/^\n$/D' "$TOR_CONFIG"
}

_fix_permissions() {
  mkdir -p /var/lib/tor
  uown tor /var/lib/tor
  chmod +x /var/lib/tor
}

_load_from_env() {
  local added_count=0
  local updated_count=0
  for _env_name in $(env | grep -o "^TOR_[^=]*"); do

    # skip custom options
    if [[ " ${CUSTOM_TOR_OPTIONS[*]} " == *" ${_env_name} "* ]]; then
      continue
    fi

    local env_value="${!_env_name}"

    # remove prefix and convert to camel case
    local option=$(to_camel_case "${_env_name#TOR_}")
    if [ -n "$env_value" ]; then

      # Check if there is a corresponding option in the torrc file, and update it
      if grep -i -q "^$option" "$TOR_CONFIG"; then
        sed -i "s/^$option.*/$option $env_value/" "$TOR_CONFIG"
        updated_count=$((updated_count + 1))
      else
        echo "$option $env_value" >> "$TOR_CONFIG"
        added_count=$((added_count + 1))
      fi

    fi
  done

  # Add a blank line at the end of the file
  echo "" >> "$TOR_CONFIG"

  if [ "$added_count" -gt 0 ] || [ "$updated_count" -gt 0 ]; then
    echo ""
    log NOTICE "Added $added_count and updated $updated_count options from environment variables."
  fi

}

generate_tor_config() {
  # Copying the torrc template to the torrc file
  cp "${TOR_CONFIG_TEMPLATE}" "$TOR_CONFIG"

  # IP address of the container
  local inet_address="$(hostname -i | awk '{print $1}')"

  sed -i "s/{{INET_ADDRESS}}/$inet_address/g" "$TOR_CONFIG"

  # any other environment variables that start with TOR_ are added to the torrc
  # file
  env | grep ^TOR_ | sed -e 's/TOR_//' -e 's/=/ /' | while read -r line; do
    key=$(echo "$line" | awk '{print $1}')
    value=$(echo "$line" | awk '{print $2}')
    key=$(to_camel_case "$key")
    echo "$key $value" >> "$TOR_CONFIG"
  done

  # Removing duplicated tor options
  awk -F= '!a[tolower($1)]++' "$TOR_CONFIG" > "/tmp/$(basename "$TOR_CONFIG")" \
    && mv "/tmp/$(basename "$TOR_CONFIG")" "$TOR_CONFIG"

  _load_from_env
  _cleanse_config
  _fix_permissions

  log "notice" "Tor configuration file has been generated"
}

get_torrc_option() {
  grep -i "^$1" "$TOR_CONFIG" | awk '{print $2}'
}

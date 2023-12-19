#!/usr/bin/env bash


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


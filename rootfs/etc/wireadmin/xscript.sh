#!/bin/bash

source /etc/wireadmin/internal/dns.sh
source /etc/wireadmin/internal/logrotate.sh
source /etc/wireadmin/internal/tor.sh

uppercase() {
  echo "$1" | tr '[:lower:]' '[:upper:]'
}

log() {
  echo -e "$(date +"%b %d %H:%M:%S %Z") [$(uppercase "$1")] $2"
}

to_camel_case() {
  echo "$1" | awk -F_ '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2));}1' OFS=""
}

uown() {
  _UID="$(id -u "$1")"
  chown -R "$_UID":"$_UID" "$2"
}

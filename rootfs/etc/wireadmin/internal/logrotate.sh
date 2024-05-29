#!/bin/bash

setup_logrotate() {
  tee "/etc/logrotate.d/rotator" &> /dev/null << EOF
/var/log/dnsmasq/dnsmasq.log
/var/log/wireadmin/*.log {
  size 512K
  rotate 3
  missingok
  notifempty
  create 0640 root adm
  copytruncate
}
EOF
}

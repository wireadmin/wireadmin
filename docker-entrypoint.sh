#!/usr/bin/dumb-init /bin/bash
set -e

# Note above that we run dumb-init as PID 1 in order to reap zombie processes
# as well as forward signals to all processes in its session. Normally, sh
# wouldn't do either of these functions so we'd leak zombies as well as do
# unclean termination of all our sub-processes.

# Prevent core dumps
ulimit -c 0

# Checking if there is /data folder
if [ ! -d "/data" ]; then
  mkdir -p /data
  chmod 700 /data
fi

mkdir -p /var/vlogs

# IP address of the container
inet_address="$(hostname -i | awk '{print $1}')"

sed -i "s/{{INET_ADDRESS}}/$inet_address/g" /etc/tor/torrc

# if /etc/tor/bridges was mounted, use those bridges
if [ "$TOR_USE_BRIDGES" = "true" ]; then
  echo "Using bridges..."
  tee -a /etc/tor/torrc <<EOF

# Using Bridges, obsf4
UseBridges 1
ClientTransportPlugin obfs4 exec /usr/local/bin/obfs4proxy managed

EOF
  cat /etc/tor/bridges >>/etc/tor/torrc
fi

# Removing duplicated lines form /etc/tor/torrc file
awk '!seen[$0]++' /etc/tor/torrc >/tmp/torrc
mv /tmp/torrc /etc/tor/torrc

# any other environment variables that start with TOR_ are added to the torrc
# file
env | grep ^TOR_ | sed -e 's/TOR_//' -e 's/=/ /' >>/etc/tor/torrc

# Start Tor in the background
screen -L -Logfile /var/vlogs/tor -dmS tor bash -c "tor"

# Starting Redis server in detached mode
screen -L -Logfile /var/vlogs/redis -dmS redis bash -c "redis-server --port 6479 --daemonize no --dir /data --appendonly yes"

# After 5 seconds, export the database to the WireGuard config file
screen -dm bash -c "sleep 5; curl -s -o /dev/null http://127.0.0.1:3000/api/wireguard/regen"

echo -e "\n======================== Versions ========================"
echo -e "Alpine Version: \c" && cat /etc/alpine-release
echo -e "WireGuard Version: \c" && wg -v | head -n 1 | awk '{print $1,$2}'
echo -e "Tor Version: \c" && tor --version | head -n 1
echo -e "Obfs4proxy Version: \c" && obfs4proxy -version
echo -e "\n========================= Torrc ========================="
cat /etc/tor/torrc
echo -e "========================================================\n"

exec "$@"

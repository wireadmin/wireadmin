#!/usr/bin/dumb-init /bin/sh
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

# Starting Redis server in detached mode
screen -dmS redis bash -c "redis-server --port 6479 --daemonize no --dir /data --appendonly yes"

# Start Tor in the background
screen -dmS tor bash -c "sleep 1; tor -f /etc/tor/torrc"

# If WG_HOST exists, again export it as NEXT_PUBLIC_WG_HOST
export NEXT_PUBLIC_WG_HOST="$WG_HOST"

# After 5 seconds, export the database to the WireGuard config file
screen -dm bash -c "sleep 5; curl -s -o /dev/null http://127.0.0.1:3000/api/wireguard/regen"

exec "$@"

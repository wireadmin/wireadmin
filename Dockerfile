FROM docker.io/library/node:alpine AS deps
WORKDIR /app

LABEL Maintainer="Shahrad Elahi <https://github.com/shahradelahi>"


COPY src/package.json src/pnpm-lock.yaml ./
RUN npm i -g pnpm
RUN pnpm i --frozen-lockfile

# Copy build result to a new image.
# This saves a lot of disk space.
FROM docker.io/library/node:alpine as runner
WORKDIR /app

# Move node_modules one directory up, so during development
# we don't have to mount it in a volume.
# This results in much faster reloading!
#
# Also, some node_modules might be native, and
# the architecture & OS of your development machine might differ
# than what runs inside of docker.
COPY src/ /app/
COPY --from=deps /opt/app/node_modules ./node_modules

# Install Linux packages
RUN apk add -U --no-cache \
  wireguard-tools \
  dumb-init \
  iptables

# Expose UI Ports
EXPOSE 3000/tcp

# Set Environment
ENV DEBUG=Server,WireGuard

# Run Web UI
WORKDIR /app
CMD ["/usr/bin/dumb-init", "node", "server.js"]

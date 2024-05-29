ARG ALPINE_VERSION=3.19
ARG NODE_VERSION=20

FROM --platform=$BUILDPLATFORM shahradel/torproxy:latest as tor
FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-alpine${ALPINE_VERSION} as node
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN apk update \
  && apk upgrade \
  && rm -rf /var/cache/apk/*

FROM node as base
RUN apk add -U --no-cache \
  iptables net-tools \
  screen bash \
  wireguard-tools \
  tor \
  && rm -rf /var/cache/apk/*

FROM base AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY web .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile \
  && NODE_ENV=production pnpm build \
  && pnpm prune --prod \
  && mv node_modules /tmp/node_modules \
  && mv build /tmp/build \
  && rm -rf ./*

FROM base
WORKDIR /app

COPY --from=tor /usr/local/bin/lyrebird /usr/local/bin/lyrebird

COPY /config/torrc.template /etc/tor/torrc.template

# Base env
ENV PROTOCOL_HEADER=x-forwarded-proto
ENV HOST_HEADER=x-forwarded-host
ENV NODE_ENV=production
ENV LOG_LEVEL=error

# Copy the goods from the build stage
COPY --from=build /tmp/package.json package.json
COPY --from=build /tmp/node_modules node_modules
COPY --from=build /tmp/build build

# Fix permissions
RUN mkdir -p /data && chmod 700 /data
RUN mkdir -p /etc/tor/torrc.d && chmod -R 400 /etc/tor/torrc.d
RUN mkdir -p /var/log/wireadmin && touch /var/log/wireadmin/web.log

# Setup entrypoint
COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

# Volumes
VOLUME ["/etc/tor", "/var/lib/tor", "/data"]

# Run the app
EXPOSE 3000/tcp
CMD [ "node", "./build/index.js" ]

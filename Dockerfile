ARG ALPINE_VERSION=3.19
ARG LYREBIRD_VERSION=0.2.0
ARG NODE_VERSION=20

FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-alpine${ALPINE_VERSION} as node
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ >/etc/timezone
RUN apk update \
  && apk upgrade \
  && apk add -U --no-cache \
    iptables net-tools \
    screen logrotate bash \
    wireguard-tools \
    dnsmasq \
    tor \
  && rm -rf /var/cache/apk/*

FROM --platform=${BUILDPLATFORM} golang:alpine AS pluggables
ARG LYREBIRD_VERSION
RUN apk update \
  && apk upgrade \
  && apk add -U --no-cache \
    bash \
    make \
  && rm -rf /var/cache/apk/*
SHELL ["/bin/bash", "-c"]
RUN <<EOT
  set -ex
  cd /tmp

  # Lyrebird - https://gitlab.torproject.org/tpo/anti-censorship/pluggable-transports/lyrebird
  wget "https://gitlab.torproject.org/tpo/anti-censorship/pluggable-transports/lyrebird/-/archive/lyrebird-$LYREBIRD_VERSION/lyrebird-lyrebird-$LYREBIRD_VERSION.tar.gz"
  tar -xvf lyrebird-lyrebird-$LYREBIRD_VERSION.tar.gz
  pushd lyrebird-lyrebird-$LYREBIRD_VERSION || exit 1
  make build -e VERSION=$LYREBIRD_VERSION
  cp ./lyrebird /usr/local/bin
  popd || exit 1

  cp -rv /go/bin /usr/local/bin
  rm -rf /go
  rm -rf /tmp/*
EOT

FROM node AS build
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY web .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile \
  && NODE_ENV=production pnpm build \
  && pnpm prune --prod \
  && cp -R node_modules build package.json /tmp \
  && rm -rf ./*

FROM node
WORKDIR /app

COPY --from=pluggables /usr/local/bin/lyrebird /usr/local/bin/lyrebird
COPY rootfs /

ENV PROTOCOL_HEADER=x-forwarded-proto
ENV HOST_HEADER=x-forwarded-host
ENV NODE_ENV=production
ENV LOG_LEVEL=error

# Copy the goodies from the build stage
COPY --from=build /tmp/package.json package.json
COPY --from=build /tmp/node_modules node_modules
COPY --from=build /tmp/build build

# Fix permissions
RUN mkdir -p /data/ /etc/tor/torrc.d/ /var/log/wireadmin/ \
  && chmod 700 /data/ \
  && chmod -R 400 /etc/tor/ \
  && touch /var/log/wireadmin/web.log

RUN echo '*  *  *  *  *    /usr/bin/env logrotate /etc/logrotate.d/rotator' >/etc/crontabs/root

# Setup entrypoint
COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

# Volumes
VOLUME ["/etc/tor", "/var/lib/tor", "/data"]

# Run the app
EXPOSE 3000/tcp
CMD [ "node", "/app/build/index.js" ]

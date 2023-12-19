FROM node:alpine as base
LABEL Maintainer="Shahrad Elahi <https://github.com/shahradelahi>"
WORKDIR /app

ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY --from=chriswayg/tor-alpine:latest /usr/local/bin/obfs4proxy /usr/local/bin/obfs4proxy
COPY --from=chriswayg/tor-alpine:latest /usr/local/bin/meek-server /usr/local/bin/meek-server

# Update and upgrade packages
RUN apk update && apk upgrade \
  # Install required packages
  && apk add -U --no-cache \
  iproute2 iptables net-tools \
  screen curl bash \
  wireguard-tools \
  openssl \
  tor \
  redis \
  # Clear APK cache
  && rm -rf /var/cache/apk/*

COPY /config/torrc /etc/tor/torrc

COPY /scripts /scripts
RUN chmod -R +x /scripts

COPY /bin /usr/local/bin
RUN chmod -R +x /usr/local/bin


FROM base AS deps

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY web/package.json web/pnpm-lock.yaml /temp/dev/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile -C /temp/dev/

COPY web/package.json web/pnpm-lock.yaml /temp/prod/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prod -C /temp/prod/


FROM base AS build
COPY --from=deps /temp/dev/node_modules node_modules
COPY web .

# build
ENV NODE_ENV=production
RUN npm run build


FROM base AS release

COPY --from=deps /temp/prod/node_modules node_modules
COPY --from=build /app/build build
COPY --from=build /app/package.json .

ENV NODE_ENV=production
ENV LOG_LEVEL=error

COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

HEALTHCHECK --interval=60s --timeout=3s --start-period=20s --retries=3 \
 CMD curl -f http://127.0.0.1:3000/api/health || exit 1

RUN mkdir -p /data && chmod 700 /data
RUN mkdir -p /etc/torrc.d && chmod -R 400 /etc/torrc.d
RUN mkdir -p /var/vlogs && chmod -R 600 /var/vlogs && touch /var/vlogs/web

VOLUME ["/etc/torrc.d", "/data", "/var/vlogs"]

# run the app
EXPOSE 3000/tcp
CMD [ "npm", "run", "start" ]

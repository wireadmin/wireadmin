FROM node:alpine as base
WORKDIR /app

ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY --from=golang:1.20-alpine /usr/local/go/ /usr/local/go/
COPY --from=gogost/gost:3.0.0-rc8 /bin/gost /usr/local/bin/gost

COPY --from=chriswayg/tor-alpine:latest /usr/local/bin/obfs4proxy /usr/local/bin/obfs4proxy
COPY --from=chriswayg/tor-alpine:latest /usr/local/bin/meek-server /usr/local/bin/meek-server

RUN apk add -U --no-cache \
  iproute2 iptables net-tools \
  screen vim curl bash \
  wireguard-tools \
  openssl \
  dumb-init \
  tor \
  redis


FROM node:alpine  as builder
WORKDIR /app

COPY /src/package.json /src/package-lock.json ./
RUN npm install

ENV NODE_ENV=production
COPY /src/ .

RUN npm run build


FROM base
WORKDIR /app

ENV NODE_ENV=production

LABEL Maintainer="Shahrad Elahi <https://github.com/shahradelahi>"

COPY /config/torrc /etc/tor/torrc

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/public ./public

COPY /src/package.json /src/package-lock.json ./
RUN npm install --omit dev

EXPOSE 3000/tcp

COPY docker-entrypoint.sh /usr/bin/entrypoint
RUN chmod +x /usr/bin/entrypoint
ENTRYPOINT ["/usr/bin/entrypoint"]

CMD ["npm", "run", "start"]

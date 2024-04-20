# WireGuard GUI (Easy Admin UI)

![Screenshot](assets/screenshot-1.png)

|                                                                                            |                                                                                            |                                                                                            |
| :----------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------: |
| <img src="assets/screenshot-2.png" alt="screenshot" style="width:100%;max-height:300px;"/> | <img src="assets/screenshot-4.png" alt="screenshot" style="width:100%;max-height:300px;"/> | <img src="assets/screenshot-3.png" alt="screenshot" style="width:100%;max-height:300px;"/> |

## Features

- Easy-to-use web-based admin UI
- Support for multiple users and servers
- Support for **Tor for anonymized connections**
- List, create, delete, or modify any server or user
- Scan QR codes or easily download the client configurations.

## Installation

### 1. Prerequisites

- [Docker Engine](https://docs.docker.com/engine/install/)

### 2. Persistent Data

WireAdmin store configurations at `/data`. It's important to mount a volume at this location to ensure that
your data is not lost during container restarts or updates.

#### Create a docker volume

```bash
docker volume create wireadmin-data --driver local
```

### 3. Download Image

#### Build from source

```bash
git clone https://github.com/shahradelahi/wireadmin
docker buildx build --tag litehex/wireadmin .
```

#### Pull from Docker Hub (recommended)

```bash
docker pull litehex/wireadmin
```

### 4. Run

When creating each server, ensure that you add the port exposure through Docker. In the below command, the port `51820`
is added for the WireGuard server.

**NOTE:** The port `3000` is for the WebUI, and can be changed with `PORT` environment variable, but for security
reasons, it's recommended to NOT expose **_any kind of WebUI_** to the public. It's up to you to remove it after
configuring
the Servers/Peers.

```bash
docker run --rm \
 -e WG_HOST=<YOUR_SERVER_IP> \
 -e UI_PASSWORD=<ADMIN_PASSWORD> \
 -p "3000:3000/tcp" \
 -p "51820:51820/udp" \
 -v "wireadmin-data:/data" \
 --cap-add=NET_ADMIN \
 --cap-add=SYS_MODULE \
 --sysctl="net.ipv4.conf.all.src_valid_mark=1" \
 --sysctl="net.ipv4.ip_forward=1" \
  litehex/wireadmin
```

## Environment Options

These options can be configured by setting environment variables using `-e KEY="VALUE"` in the `docker run` command.

| Option            | Description                                                                     | Optional |
| ----------------- | ------------------------------------------------------------------------------- | -------- |
| `WG_HOST`         | The public IP address of the WireGuard server.                                  |          |
| `UI_PASSWORD`     | The password for the admin UI.                                                  |          |
| `HOST`            | The hostname for the WebUI. (default: `127.0.0.1`)                              | ✔️       |
| `PORT`            | The port for the WebUI. (default: `3000`)                                       | ✔️       |
| `TOR_USE_BRIDGES` | Set this to `1` and then mount the bridges file at `/etc/torrc.d/bridges.conf`. | ✔️       |
| `TOR_*`           | The `Torrc` proxy configuration. (e.g. `SocksPort` as `TOR_SOCKSPORT="9050"`)   | ✔️       |

## Reporting

For bug reports, and feature requests, please create an issue
on [GitHub](https://github.com/shahradelahi/wireadmin/issues).

## License

[GPL-3.0](LICENSE) © [Shahrad Elahi](https://github.com/shahradelahi)

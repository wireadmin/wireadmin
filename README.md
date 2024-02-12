# WireGuard GUI (Easy Admin UI)

![Screenshot](assets/screenshot-1.png)

|                                                                                            |                                                                                            |                                                                                            |
|:------------------------------------------------------------------------------------------:|:------------------------------------------------------------------------------------------:|:------------------------------------------------------------------------------------------:|
| <img src="assets/screenshot-2.png" alt="screenshot" style="width:100%;max-height:300px;"/> | <img src="assets/screenshot-4.png" alt="screenshot" style="width:100%;max-height:300px;"/> | <img src="assets/screenshot-3.png" alt="screenshot" style="width:100%;max-height:300px;"/> |

## Features

- Easy-to-use web-based admin UI
- Support for multiple users and servers
- Support for **Tor for anonymized connections**
- List, create, delete, or modify any server or user
- Scan QR codes or easily download the client configurations.

## Requirements

* A host with a kernel that supports WireGuard.
* A host with Docker installed.

## Installation

### 1. Install Docker

To install Docker, go to the official documentation and install a version that meets your environment's requirements.

- [Install Docker Engine](https://docs.docker.com/engine/install/)

### 2. Persistent Data

WireAdmin uses `redis` to store the WireGuard configurations and their data at `/data`. It's important to mount a volume
at this location to ensure that your data is not lost during container restarts or updates.

#### Create a docker volume

```bash
docker volume create wireadmin-data --driver local
```

### 3. Run WireAdmin

Install WireAdmin using the command line:

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
  litehex/wireadmin:latest
```

Please note that the port `3000` is for the WebUI, and it's up to you to remove it after configuring the Servers/Peers.

> IMPORTANT: When creating each server, ensure that you add the port exposure through Docker. (The port `51820` is added
> as an example.)

## Environment Options

These options can be configured by setting environment variables using `-e KEY="VALUE"` in the `docker run` command.

| Option            | Description                                                                                                                            | Optional |
|-------------------|----------------------------------------------------------------------------------------------------------------------------------------|----------|
| `WG_HOST`         | The public IP address of the WireGuard server.                                                                                         |          |
| `UI_PASSWORD`     | The password for the admin UI.                                                                                                         |          |
| `TOR_USE_BRIDGES` | Set this to `1` and then mount the bridges file at `/etc/torrc.d/bridges.conf`.                                                        | ✔️       |
| `TOR_*`           | The `Torrc` proxy configuration. (e.g. `SocksPort` as `TOR_SOCKSPORT="9050"`)                                                          | ✔️       |

## Reporting

If you have any questions, bug reports, and feature requests, please create an issue
on [GitHub](https://github.com/shahradelahi/wireadmin/issues).

## Support the Project

Seriously, this project is free and open-source, and all I ask for as support is for you to give a star to [the
repository](https://github.com/shahradelahi/wireadmin).

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details

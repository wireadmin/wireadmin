# wireadmin

## 2.0.1

### Patch Changes

- 883bfe4: chore: Update dependencies

## 2.0.0

### Major Changes

- efb93e5: BREAKING: `UI_PASSWORD` has been removed. Please use `ADMIN_PASSWORD` instead.
- efb93e5: feat: Creates a Dnsmasq server on port 53 and forwards DNS queries through the Tor network.

### Minor Changes

- eb45ccc: fix: using `storage-box` instead of `redis` for storing configs
- 66a1fe2: feat: dark mode

### Patch Changes

- eb45ccc: fix: improve `healthcheck` and silence warning form `sveltekit-superforms`
- eb45ccc: fix: storage path was not pointing to `/data`
- eb45ccc: fix: improve password hashing method and env loader
- eb45ccc: chore: slightly improve server page layout
- eb45ccc: fix: tor config generation when container restarts
- eb45ccc: feat: show total net usage and connection mode in server page
- eb45ccc: feat: add section for showing the state of background services

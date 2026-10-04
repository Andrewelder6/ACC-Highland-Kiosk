# ACC Highland Kiosk
Always-on iPad dashboard for ACC Highland IT Office.

Cloudflare Worker serves the static kiosk and a same-origin `/api/buses` endpoint that converts CapMetro GTFS-Realtime trip updates into simple arrival timestamps for the three configured stops.

## Cloudflare
Import this repository as a Worker app. Cloudflare reads `wrangler.toml`; no build command is required.

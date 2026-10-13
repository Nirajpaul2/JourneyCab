# JourneyCab: Cloudflare Worker + Tunnel

## Deployment and diagnosis

On 13 October 2026, the public `/api/health` and `/api/session` URLs returned HTTP 200 HTML instead of JSON. Cloudflare account inspection identified `journeycab.nirajpaul.com` as a custom domain of the **journeycab Worker**, not a Pages project. The frontend had no API proxy, and the Mac tunnel had no JourneyCab route. The separate root domain `nirajpaul.com` serves another application.

```text
Browser https://journeycab.nirajpaul.com
  /, /admin, /assets/* -> Worker static assets (dist)
  /api, /api/*        -> cloudflare/worker.js -> api-proxy.js
                          -> https://journeycab-api.nirajpaul.com
                          -> mac-home-server tunnel
                          -> http://127.0.0.1:5173
                          -> JourneyCab Docker, persistent ./data
```

`wrangler.jsonc` sends API paths to the Worker before SPA fallback, and defines the server-side `BOOKING_API_ORIGIN`. Never point it to the frontend domain (recursive proxy), the root domain (another app), or localhost (the edge cannot reach the Mac directly).

The dedicated backend DNS record uses the existing `mac-home-server` tunnel. Its native Mac connector reaches the loopback Docker port. Existing Supabase and other tunnel entries must remain intact. A Docker-based connector would require different networking; its localhost is not the Mac.

## Run the backend

```sh
npm run docker -- -f compose.yaml -f compose.production.yaml up -d --wait
```

This preserves the database and loopback bind, sets `NODE_ENV=production` and `APP_ORIGIN=https://journeycab.nirajpaul.com`, and uses Secure, HttpOnly, host-only session cookies. **Use the public HTTPS admin URL; local HTTP admin login does not work in production mode.** Keep the original browser Origin header and server origin checks.

New booking intake remains closed by default (`BOOKINGS_OPEN=false`) until launch readiness is established. Admin login works while intake is closed. SMS credentials are not configured by this change.

Docker has an `unless-stopped` restart policy. The Mac must remain awake with Docker Desktop and cloudflared running; this is not guaranteed 24/7 hosting. The backend remains Node/SQLite; no FastAPI/Supabase migration was performed.

## Deploy the frontend and API proxy

From the repository root, using the existing Cloudflare account:

```sh
npm ci
npm test
npm run build
npx wrangler deploy --dry-run
npx wrangler deploy
```

Node 22.18+ is required. The build includes the frontend and validates backend TypeScript. Wrangler deploys the `dist` assets and `cloudflare/worker.js` together to the existing `journeycab` Worker. Preserve its existing custom domain. Uploading only static assets will break API routing again. The Cloudflare Git build, if enabled, must also use this Wrangler config and build assets before deployment.

The proxy accepts only the production browser origin; preview domains cannot use production sessions. It forwards cookies, tracking Authorization and original Origin, preserves Set-Cookie and backend JSON statuses, blocks redirects/HTML responses, bounds request bodies to 16 KiB and sends no-store cache headers. Do not enable Cache Everything for API paths.

If Access is subsequently configured on the backend hostname, add both `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` as Worker secrets with a dedicated service-token policy. Never expose them through Vite variables, Git or logs. No Access policy was disabled for this setup. Application authentication remains required for staff endpoints.

`TRUST_PROXY=0` remains unchanged. Backend rate limits aggregate connections through the tunnel; review trusted client identity before increasing traffic. Do not blindly trust caller-supplied forwarding headers.

## Verify

```sh
curl -i https://journeycab.nirajpaul.com/api/health
curl -i https://journeycab.nirajpaul.com/api/session
curl -i https://journeycab.nirajpaul.com/api/admin/bookings
```

Expected: 200 JSON `{"ok":true}`, 200 JSON `{"email":null}`, and 401 JSON respectively. Test login privately at `/admin`; passwords must never be placed in command arguments or chat. Staff accounts live in the same persistent local JourneyCab database. `npm run admin:create` provisions an account through hidden terminal input if required.

## Backups and rollback

The pre-cutover SQLite backup is in ignored `data/backups/pre-cloudflare-20261013.sqlite`; the original tunnel configuration is in ignored `data/backups/tunnel-before-journeycab-20261013.json`. Keep these private and copy database backups off-host according to the launch runbook.

The pre-fix Worker version is `894f5a3c-0012-4056-9893-02d84391737b`. Use Wrangler rollback if the new deployment fails; that old version has the original broken API routing. Remove only the newly added JourneyCab backend route/DNS if reverting infrastructure. Never restore an old full tunnel snapshot over later changes to other applications.

To restore local HTTP mode, run `npm run docker -- up -d --wait` without the production override, but first disable the public JourneyCab backend route. Do not expose development session settings through the tunnel. Never delete the data directory or Docker volumes as part of rollback.

## References

- [Worker static assets and API routing](https://developers.cloudflare.com/workers/static-assets/binding/)
- [SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)
- [Cloudflare Tunnel routing](https://developers.cloudflare.com/tunnel/concepts/routing/)

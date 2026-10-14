# JourneyCab

A ride-request service for Bihar and selected routes to Uttar Pradesh with local driver partners and manual staff confirmation. The React/TypeScript frontend is backed by a Node/SQLite API. This first release is implemented and tested locally; production hosting, operator details and messaging credentials still need configuration.

## Run locally

Requires Node.js 22.18+ and npm.

```sh
git clone https://github.com/Nirajpaul2/JourneyCab.git
cd JourneyCab
npm ci
npm run dev
```

The frontend opens at `http://127.0.0.1:5173`; Vite proxies `/api` to the Node server on port 3001. The default database is `data/journeycab.sqlite` and is excluded from Git. Use fictional passenger details during development. This is now persistent storage: refreshing the browser does not delete submitted requests.

```sh
npm test         # Fare, coverage, persistence, workflow, auth and notification tests
npm run build    # Frontend + backend TypeScript checks, Vite production bundle
npm start        # API + built frontend; see DEPLOYMENT.md for origin/TLS configuration
```

`npm run preview` serves the built frontend **and API** together at `http://127.0.0.1:4173` using a separate `data/preview.sqlite` database. Run `npm run build` first. Keep the local server running while using the booking page. `.env.example` documents available settings. Environment files must be explicitly loaded; see the deployment guide.

## Keep the local service running with Docker

```sh
npm run docker -- up -d --build --wait
npm run docker -- ps
npm run docker -- logs --tail 100
npm run docker:test  # Isolated booking + container restart smoke test
```

Open `http://127.0.0.1:5173/` or `/admin`. Stop any `npm run dev` process using port 5173 before the first Docker startup. The container serves both the built site and the booking API, uses `restart: unless-stopped`, and binds the existing ignored `data/` directory for persistence. The wrapper matches your local UID/GID so private database permissions are retained. Run only one service against this SQLite database.

After source changes, rerun the build/start command. `npm run docker -- restart` restarts the service; `npm run docker -- stop` deliberately stops it. Keep Docker Desktop running. The service is unavailable while the Mac is asleep, powered off or Docker is stopped. For 24/7 customer access, deploy to an always-on HTTPS host.

This Compose file is **loopback-only local HTTP**, with no SMS credentials loaded. It is not a public production configuration. See [DEPLOYMENT.md](DEPLOYMENT.md) and the [FastAPI/Supabase migration plan](FASTAPI-SUPABASE-PLAN.md).

## Staff setup

There is no seeded/default account. With Docker running, create a staff account privately in your local terminal:

```sh
npm run admin:create
```

Enter your staff email, a 14–128 character password, and repeat the password. Password input is hidden and sent to the container through stdin; it is never included in command arguments or saved in a file. Sign in at `http://127.0.0.1:5173/admin`. The command creates an account in the same database as the running application and refuses to overwrite existing accounts.

For non-Docker hosting, see [DEPLOYMENT.md](DEPLOYMENT.md#create-and-manage-staff-accounts) to create a staff account securely using the management command, then sign in at `/admin`.

## First-release workflow

1. Customer chooses a published one-way route and five-seater AC car category, enters contact and address details, and requests a ride.
2. The API saves a **pending request**, returning a reference and private status link. No automatic reservation or payment occurs.
3. Staff confirms availability with partner drivers, agrees the fare with the customer and records its inclusions.
4. Staff assigns an active driver in the requested category. Hatchback bookings also allow a Sedan upgrade after staff records customer approval at the unchanged agreed fare. Driver acceptance is required and overlapping bookings are rejected.
5. Staff confirms the booking. The customer status page displays the agreed fare and assigned driver. A persistent notification is queued.
6. With configured SMS credentials, the server submits the message to the provider. Without them, staff contacts the customer manually and records the outcome. SMS acceptance is distinct from delivery.

The dashboard also supports driver registration/activation, request search/filtering, audit history, cancellation/decline and completion. Authentication, session revocation, same-origin write checks, input limits, rate limits, idempotent submission and version-checked staff updates are enforced by the server.

## Published routes and fares

The client banner supplied on 13 October 2026 replaces the demo fare catalog with **19 directional one-way fares**, including Siwan → Varanasi and Siwan/Maharajganj → Gorakhpur, as approved by the client. See [ROUTE-PRICING.md](ROUTE-PRICING.md) for the complete transcription and assumptions.

Examples: Siwan → Patna **₹2,299**, Chhapra → Patna **₹1,599**, Siwan → Varanasi **₹5,399**. Published prices cover five-seater AC cars; toll tax and parking are extra. No sample tax or kilometre multiplier is added. Staff agrees final charges and tax treatment before confirmation. Reverse routes, larger vehicles, round trips and local rentals have no supplied price and are not available for online booking. Existing stored bookings are preserved.

Images and font are bundled locally; preserve [ASSET_CREDITS.md](ASSET_CREDITS.md) and font licensing.

## Source map

- `src/App.tsx`, `src/components/Home.tsx`, `src/components/BookingForm.tsx`: customer journey and request submission.
- `src/components/Operations.tsx`: authenticated staff desk and partner register.
- `src/components/Tracking.tsx`: private customer status and confirmed driver details.
- `src/config.ts`, `src/booking.ts`: coverage, initial estimates and shared validation.
- `server/store.ts`: SQLite schema, request idempotency, authentication, state transitions and audit records.
- `server/app.ts`: HTTP API, authorization, origin checks, rate limiting and static frontend delivery.
- `server/notifications.ts`: optional SMS provider adapter with explicit pending/accepted/failed/unknown states.
- `server/index.ts`: server lifecycle and notification worker; `server/manage.ts`: account creation and consistent backups.

## Deployment and limits

Read [DEPLOYMENT.md](DEPLOYMENT.md) before going live. The server requires a single Node process and persistent disk; a static-only deployment is insufficient. No production infrastructure, SMS credentials, real driver records or staff credentials are included. Automatic dispatch, live tracking, payments, customer accounts/OTP, automated WhatsApp/email delivery and multi-role staff access are outside this release.

The old Sites project continues to return `Sites project not found`; it has not been updated. The preserved hosting manifest identifies that historical static demo, not the new backend deployment.

See [VERIFICATION.md](VERIFICATION.md) for test evidence and verification limits.

## Cloudflare Worker and Tunnel

See [CLOUDFLARE-DEPLOYMENT.md](CLOUDFLARE-DEPLOYMENT.md) for the public deployment. The `journeycab` Worker serves the frontend and forwards `/api/*` through `journeycab-api.nirajpaul.com` to the persistent Docker backend. Use the production Compose override for the HTTPS origin and secure staff sessions. This is a Workers deployment, not Pages.

## Check a ride and send a WhatsApp confirmation

Customers can open **Track my ride** in the main navigation or use the private status link from their request receipt. `/track` requires the booking reference and private access key; a reference alone does not grant access. Tracking shows booking progress and confirmed driver details, not live GPS location. Staff can inspect bookings through **Admin → Ride requests**.

For each confirmed booking, **Open WhatsApp confirmation** opens a draft addressed to that customer. Review the message preview, send it from WhatsApp, then record channel, time and outcome under **Customer communication**. Opening the link does not send or record delivery. Automatic WhatsApp delivery is not configured.

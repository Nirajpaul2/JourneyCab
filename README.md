# JourneyCab

A Bihar-only ride-request service with local driver partners and manual staff confirmation. The React/TypeScript frontend is backed by a Node/SQLite API. This first release is implemented and tested locally; production hosting, real fares, operator details and messaging credentials still need configuration.

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

`npm run preview` serves only the frontend bundle; use the Node server for full workflow testing. `.env.example` documents available settings. Environment files must be explicitly loaded; see the deployment guide.

## Staff setup

There is no seeded/default account. See [DEPLOYMENT.md](DEPLOYMENT.md#create-and-manage-staff-accounts) to create a staff account securely using the management command, then sign in at `/admin`.

## First-release workflow

1. Customer chooses One Way, Round Trip or Local, selects a category, enters contact and address details, and requests a ride.
2. The API saves a **pending request**, returning a reference and private status link. No automatic reservation or payment occurs.
3. Staff confirms availability with partner drivers, agrees the fare with the customer and records its inclusions.
4. Staff assigns an active driver in the requested category; overlapping bookings are rejected.
5. Staff confirms the booking. The customer status page displays the agreed fare and assigned driver. A persistent notification is queued.
6. With configured SMS credentials, the server submits the message to the provider. Without them, staff contacts the customer manually and records the outcome. SMS acceptance is distinct from delivery.

The dashboard also supports driver registration/activation, request search/filtering, audit history, cancellation/decline and completion. Authentication, session revocation, same-origin write checks, input limits, rate limits, idempotent submission and version-checked staff updates are enforced by the server.

## Bihar coverage and estimates

Pickup cities: **Patna, Gaya, Bodh Gaya, Rajgir, Nalanda, Muzaffarpur, Darbhanga, Bhagalpur, Purnia, Begusarai, Hajipur and Arrah**.

Featured intercity pairs: **Patna ↔ Gaya, Bodh Gaya, Rajgir, Muzaffarpur, Darbhanga and Bhagalpur**. All 12 cities support local 4-hour/40-km and 8-hour/80-km requests. Other intercity pairs show the unsupported-route state. Out-of-state cities are rejected by both form and API validation.

Initial sample Sedan estimates: Patna → Gaya one way ₹1,465; three-day round trip ₹11,383; local 8 hours / 80 km ₹2,728. These remain illustrative until operational pricing is supplied. Staff must agree a final fare with the customer before confirming. Images and font are bundled locally; preserve [ASSET_CREDITS.md](ASSET_CREDITS.md) and font licensing.

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

Read [DEPLOYMENT.md](DEPLOYMENT.md) before going live. The server requires a single Node process and persistent disk; a static-only deployment is insufficient. No production infrastructure, SMS credentials, real driver records or staff credentials are included. Automatic dispatch, live tracking, payments, customer accounts/OTP, WhatsApp/email delivery and multi-role staff access are outside this release.

The old Sites project continues to return `Sites project not found`; it has not been updated. The preserved hosting manifest identifies that historical static demo, not the new backend deployment.

See [VERIFICATION.md](VERIFICATION.md) for test evidence and verification limits.

# JourneyCab first release: deployment and operations

This version implements **partner drivers + manual team confirmation**. It is a working first-release implementation, not a launched production service. No real SMS was sent during development. The operational prices, legal business identity, support contact, retention policy, approved messaging setup and production host remain to be supplied and verified.

## Runtime and hosting

Use one Node.js 22.18+ process with a persistent local disk. The Node server serves both the compiled frontend and `/api` on the same origin. Requests, staff accounts, sessions, drivers, audit history and notification records persist in SQLite with WAL enabled. This is a single-instance deployment; do not put the database on an ephemeral filesystem, network share, or run multiple application replicas against it. Plan a managed database migration before horizontal scaling. The built-in SQLite API is still marked experimental in the tested Node 22 runtime.

The historical `.openai/hosting.json` belongs to the old static Sites demo. **Publishing `dist/` alone will not run this release’s backend.** The Sites API continues to report `Sites project not found`; that project identity is retained for recovery. No production deployment has been performed.

1. Provision a Node host/container with persistent disk, TLS termination, process restart and external uptime monitoring.
2. Install locked dependencies with `npm ci`, then run `npm test` and `npm run build`.
3. Set environment variables through the host’s secret/configuration manager:
   - `NODE_ENV=production`
   - `APP_ORIGIN=https://your-actual-domain` (exact origin, no trailing slash)
   - `DATABASE_PATH=/persistent/private/path/journeycab.sqlite`
   - `HOST=127.0.0.1` behind a local reverse proxy, or `0.0.0.0` inside a private container network
   - `PORT=3001`
   - `TRUST_PROXY=0` normally. Use `1` only with one trusted reverse proxy that replaces `X-Forwarded-For` and prevents direct public access to Node.
4. Run `npm start`. Route frontend pages and `/api` to this same process. `/api/health` checks database connectivity.
5. Production request submission defaults to closed. Complete the operator, policy and infrastructure setup, then set `BOOKINGS_OPEN=true` for a supervised end-to-end booking. Confirm HTTPS, secure session cookies, staff sign-in, driver assignment and customer delivery before announcing availability. Set it back to `false` to pause new requests.

A multi-stage `Dockerfile` is included. Its container build has not been exercised in this workspace. Supply `APP_ORIGIN` and a persistent `/app/data` volume owned by container UID 1000. Do not expose an unprotected HTTP container directly as production. Load secrets at runtime, not into the image.

## Create and manage staff accounts

There is no default production account or password. Create the first account against the intended database:

```sh
# In bash; password is read silently and passed via stdin, not a command argument.
read -r -s -p 'New staff password (14+ characters): ' JC_STAFF_PASSWORD
printf '\n'
printf '%s' "$JC_STAFF_PASSWORD" | npm run manage -- admin staff@example.com
unset JC_STAFF_PASSWORD
```

Use a real staff address and a unique password. All first-release staff accounts have full dispatch access. Passwords use salted scrypt hashes. Sessions expire after eight hours, use HttpOnly/SameSite cookies and Secure cookies in production; logout revokes the session. A multi-role permissions system, self-service password recovery and MFA are not included yet. Use a private staff-access gateway where required by the operator’s launch requirements.

Environment files are optional: `node --env-file=.env --import tsx server/index.ts` loads one explicitly. `npm start`, `npm run dev`, and the management command otherwise read the shell/host environment. If using `.env` for account management, run `node --env-file=.env --import tsx server/manage.ts admin staff@example.com` with password on stdin. Never commit `.env`, database files or backups.

## Dispatch workflow

1. Customer selects a supported Bihar route/category or local package, supplies contact and pickup information, consents to booking contact, and requests a ride.
2. The server validates the journey and calculates the initial estimate itself. Request retries are idempotent. The customer gets a reference and a private status link; the link’s access key stays in its URL fragment and is sent only as an API authorization header. Only its hash is stored.
3. Staff opens `/admin`, checks availability with partners, agrees the final fare with the customer, and records fare inclusions/exclusions and customer agreement.
4. Staff adds a verified partner to the register and assigns an active partner in the requested vehicle category after confirming driver acceptance. Overlapping assigned/confirmed trips are blocked. Intercity/local allocation includes a one-hour buffer; round trips reserve through the return date’s end. This remains an estimate: staff must check real travel and repositioning time.
5. Staff confirms the booking. The customer’s private page now shows the agreed fare and driver name, phone, vehicle and registration. It polls every 30 seconds. A durable SMS notification is queued in the same transaction.
6. After the ride, mark it complete. A future ride cannot be marked complete. Cancellations/declines require a reason and queue customer updates. Rescheduling or replacing a confirmed assignment currently requires cancelling and creating a new request with the customer; automatic dispatch is deliberately excluded.

Changes carry a version number, so one staff member cannot silently overwrite another staff member’s newer change. Audit events record the actor, action, note and time. The inbox shows the latest 500 requests; add server-side pagination/export before growing beyond this operational limit. Staff refresh the inbox manually.

## Customer notification delivery

The customer status page works without an SMS provider. Staff can call/message the customer through their existing business channel, then record the channel/time/outcome under **Customer communication**. The application does not pretend those messages were sent automatically.

An optional Twilio SMS adapter is implemented. Configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_FROM` only after selecting and setting up an appropriate messaging account/sender for the business. Confirm provider requirements for India, message content/template approval, consent and delivery with the provider before activation. If a different SMS or WhatsApp provider is chosen, replace `server/notifications.ts` while keeping the durable outbox contract. No email/WhatsApp delivery is currently implemented.

With all three credentials present, the server processes pending messages every ten seconds. **Enabling credentials sends existing pending notifications**, so never point production credentials at a development/test database. Provider acceptance is shown as **Accepted by SMS provider**, not delivered. A timeout, server-side provider error or interrupted send is marked **unknown** and is not automatically resent, to prevent duplicate messages. Inspect the provider console, then record a manual customer contact if needed. Delivery receipts/callbacks, retries after rejection and delivery metrics remain launch integrations to validate for the chosen provider.

## Data, backups and recovery

- Keep the database and its WAL files on a private persistent volume with restricted access and encryption supplied by the host/storage platform. Application-level at-rest encryption is not implemented.
- Create a consistent backup with `npm run manage -- backup /private/backup/path/journeycab.sqlite`. It uses SQLite’s backup API; do not copy only the main file while WAL writes are active.
- Schedule encrypted off-host backups and test restoration before launch. Backup scheduling and monitoring must be configured on the chosen host.
- Restore with the application stopped, preserve the original database/WAL/SHM set as a recovery copy, then place the verified backup at `DATABASE_PATH` with matching permissions and restart. Never mix a restored database with an old WAL/SHM file.
- Agree and implement a customer-data retention/deletion policy before collecting real requests. The current privacy page explicitly identifies the missing operator/contact/retention information.
- Keep production request-body, cookie and Authorization-header logging disabled. Tracking keys, customer addresses and phone numbers must not be included in application or proxy logs.

## Before opening to customers

The implementation is ready for staging review. Going live still needs actual fares and route/service hours, real verified partners, a staffed contact number, operator identity and approved policies, the chosen host/domain, operational backups/monitoring, and a verified notification channel. Perform a production security review and a supervised end-to-end booking using the chosen infrastructure. Current security controls and local tests are not a substitute for that launch review.

Implementation references: [Node SQLite API](https://nodejs.org/download/release/latest-jod/docs/api/sqlite.html), [OWASP session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [Twilio Message API](https://www.twilio.com/docs/messaging/api/message-resource).

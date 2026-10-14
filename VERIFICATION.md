# First-release verification — 13 October 2026

## Automated coverage

`npm test`: **23 passing tests**. Coverage includes all 19 banner fares, no invented reverse/category/rental prices, selected Uttar Pradesh routes, validation, server-derived prices, persistence, private tracking authorization, hashed tokens, idempotency, manual workflow, version conflicts, driver overlap, a conservative 24-hour allocation window, optional SMS, provider acceptance semantics, ambiguous delivery, staff auth/origin/body limits, rate limits, closed intake and backup restoration. Three API-client tests also reject HTML fallbacks/network failures rather than treating them as successful receipts. Old demo-formula tests were replaced by banner-based fare checks.

SMS tests use an injected fake provider. **No real SMS, email, WhatsApp message or phone call was sent.**

`npm run build`: frontend and backend TypeScript checks plus Vite production build.

## Banner update checks

- Verified the desktop route list displays the transcribed fares and selects Siwan → Varanasi correctly.
- Searched that route and reached the Sedan review with **₹5,399**, no sample-tax line, and **toll tax & parking payable separately**.
- No new customer request or message was submitted during this browser check. Automated API/store tests exercise the updated persistence and workflow.
- Screenshot: ignored `qa/banner-routes.png`.

## Earlier first-release browser checks (before the banner update)

The frontend and API ran against an isolated temporary SQLite database containing only synthetic test records. There is no default account or test partner in the shipped database.

- Submitted a Patna → Gaya Sedan request with the initial ₹1,465 estimate and booking-contact consent. Received a server-generated reference and private status link.
- Verified the customer page initially showed request received, with no assigned-driver contact information.
- Signed in to `/admin` with a temporary test account. Added a Sedan partner through the driver register.
- Opened the saved request in the staff inbox, recorded customer agreement to a ₹1,600 fare with inclusions, assigned the partner after recording driver acceptance, and confirmed the booking.
- Refreshed the customer page: it showed **Booking confirmed**, ₹1,600, the partner name, mobile, model and registration. The result survived a page reload and API restarts during development.
- Verified the SMS-unconfigured notice, persistent pending message and manual contact-record action. The test note explicitly says no real customer contact occurred.
- Staff dashboard checked at 1440px, 768px and 375px with no horizontal overflow. Customer tracking checked at 1440px, 768px and 375px with no overflow; desktop and mobile appearances visually inspected.
- No staff-page console errors observed during the browser walkthrough.

Screenshots are in the ignored local `qa/` folder: `operations-desktop.jpg` and `customer-confirmation-mobile.jpg`.

## Docker availability checks

- Built the multi-stage Node image successfully, including frontend/backend TypeScript checks and the production frontend bundle.
- `npm run docker:test` passed against a disposable database: admin page serving, unauthorized staff API rejection, write-origin protection, banner-priced booking creation, idempotent retries, private tracking, and persistence after a container restart. The test reads the current ephemeral port after restart because Docker may reassign it.
- Started `journeycab-app-1` detached on `127.0.0.1:5173` with a healthy database probe, `unless-stopped` restart policy, non-root runtime, private persistent bind mount and log limits.
- Live `/api/health` returned `{"ok":true}` and `/api/session` returned `{"email":null}`. No default staff account exists; the preserved local database had zero staff/booking/driver records before cutover.
- Created a consistent pre-cutover backup under ignored `data/backups/`. The disposable smoke database/container was removed. No messages were sent and no existing Supabase production service was modified.
- The initial public base-image pull was blocked by a stalled Docker Desktop credential helper. An anonymous pull with a temporary config fetched the official image; user Docker credentials/settings were left unchanged. Subsequent image builds succeeded using the cached base.
- No FastAPI/Supabase migration or production hosting is claimed; see `FASTAPI-SUPABASE-PLAN.md`. Local availability still requires Docker Desktop and an awake Mac.

## Verification limits

No production host, real SMS credentials or domain/TLS configuration was available. Provider delivery and callbacks, operator tax treatment/policies, uptime monitoring, scheduled off-host backups, production load/security review have not been verified. The SQLite backup operation and restoration are covered by an automated test; operational scheduling is not configured.

The earlier static frontend had an axe accessibility audit. That audit does not cover the new operations, tracking and privacy pages; no full automated accessibility audit is claimed for these pages. Form labels, keyboard focus styling and responsive layouts are implemented.

The previous Sites project returns `Sites project not found`. It has not received this server-backed release, and its static manifest is retained only as historical project identity. Production intake is closed by default until `BOOKINGS_OPEN=true` is explicitly set.

## Cloudflare API repair — 13 October 2026

- Cloudflare account inspection identified the public custom domain as the `journeycab` Worker, not Pages. Previously the public API returned the static HTML fallback, while local Docker returned JSON.
- 30 tests passed: 23 existing application tests, 6 API proxy tests and one Worker route/asset isolation test. Proxy tests cover configuration validation, original Origin and cookie/Authorization forwarding, cross-origin rejection, backend errors, redirects/HTML/network failures and the 16 KiB request limit.
- Frontend/backend TypeScript and Vite build, Wrangler deployment dry run and binding type generation succeeded. The deployed Worker startup time was 2 ms.
- Backed up SQLite, switched only the JourneyCab container to production HTTPS settings and retained the persistent database. Customer intake remains closed. The container returned healthy after recreation.
- Added `journeycab-api.nirajpaul.com` without DNS overwrite. Added its loopback service to `mac-home-server` and compared every other ingress entry against the saved configuration; all were preserved. No Supabase application/database changes were made.
- Deployed Worker version `eb197dfb-4dc7-44f5-8bc6-bab613aa8141` with static frontend and same-origin API proxy. Existing public custom domain was preserved.
- Live curl checks passed: `/api/health` 200 JSON, `/api/session` 200 JSON with no signed-in email, `/api/admin/bookings` 401 JSON, `/admin` 200 HTML. Untrusted-origin POST `/api/session` returned 403; an empty same-origin login reached backend validation and returned 400 JSON. No passwords or bookings were submitted.
- Browser verification: the public HTTPS `/admin` page completed its session check and displayed the login form without the server-unavailable error. A real authenticated login was not performed; the user must enter their existing credentials privately.
- One initial Python urllib probe returned text/plain 403; curl and the browser then passed. No security policy was weakened in response.
- Service availability still requires an awake Mac, Docker Desktop and cloudflared. SMS delivery, sustained uptime and production load have not been verified. See `CLOUDFLARE-DEPLOYMENT.md` for operation and rollback details.

## Driver assignment empty state — 14 October 2026

- Read-only category checks found the quoted booking requested a hatchback, while the two active driver records were sedans. The exact-category rule correctly excluded them; no driver or booking records were changed.
- The admin form now names the requested category, explains when no active matching driver exists, lists other registered active categories and offers a Driver partners shortcut. Assignment controls are disabled while no matching partner exists.
- All 30 existing regression tests and the TypeScript/Vite production build passed. The backend category and conflict checks remain unchanged.

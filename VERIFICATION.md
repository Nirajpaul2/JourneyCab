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

## Customer-approved Sedan upgrade — 14 October 2026

- Added Hatchback → Sedan as the only permitted category substitution. A strict customer-approval boolean is enforced server-side, alongside driver acceptance, active status, version checks and overlapping-booking protection. Requested category and agreed fare remain unchanged.
- Approval metadata (staff identity/time) persists with the booking and an audit event records the upgrade. Private staff metadata is not returned by public tracking. Confirmed tracking identifies the assigned Sedan upgrade.
- Admin options label Sedan upgrades and require a separate customer-approval checkbox. Changing the selected driver resets both approval and driver-acceptance checkboxes.
- All 32 tests pass, including approval missing/false/nonboolean rejection, unchanged fare/category, saved audit metadata, public visibility only after confirmation, inactive/conflicting driver rejection, blocked downgrades/SUV substitutions and unchanged same-category assignments. TypeScript/Vite build passed.
- Created a consistent private backup at ignored `data/backups/pre-sedan-upgrade-20261014.sqlite` before backend deployment. No real booking was assigned or confirmed during implementation.
- Rebuilt and restarted only the JourneyCab container; health passed and runtime checks confirmed Hatchback → Sedan allowed, Sedan → Hatchback blocked, production mode and `BOOKINGS_OPEN=true` preserved. Published frontend Worker version `15a48211-42f3-43d7-8e04-b9a6451e24a1`.

## Ride tracking navigation and WhatsApp drafts — 14 October 2026

- Added Track my ride to desktop/mobile navigation and explained private-link/access-key requirements on the tracking page. Status tracking does not imply live GPS tracking.
- Confirmed bookings now provide a recipient-specific WhatsApp confirmation draft and message preview. Drafts include route, pickup date/time/address, agreed fare/terms, assigned driver/vehicle and approved upgrade where applicable. Unconfirmed, cancelled, completed, incomplete and invalid-recipient bookings cannot generate confirmation links.
- Creating or opening a link does not send a message or alter contact/delivery status. Staff must send in WhatsApp and separately record actual contact through the existing audited workflow. No real customer message was sent in testing.
- All 34 tests and the TypeScript/Vite build passed. New tests cover correct recipient normalization, reserved-character URL encoding, confirmed-only eligibility, agreed details, exclusion of private staff metadata and no mutation of the booking when a draft is prepared.

## Aryan logo and public branding — 14 October 2026

- Created a transparent red/navy cab emblem from the client reference using the built-in image generator, with prompt and asset provenance in `BRAND-IDENTITY.md`.
- Shared responsive BrandLogo component combines the emblem with accessible live English/Hindi text across the header, footer, receipt, operations, tracking and privacy pages. Updated the site icon, title and public business name. Future WhatsApp drafts and notification text use the configured business name; stored records were not rewritten.
- All 34 tests and frontend/backend builds passed. Desktop browser inspection verified the logo and navigation layout; the viewport override did not take effect, so no mobile browser verification is claimed. Compact CSS layouts are implemented.
- Rebuilt JourneyCab's container successfully with a healthy restart and deployed Worker version `450d86ec-9fa5-4723-86a9-b3e54b651a7d`. Verified the live homepage title, header and footer branding. Screenshot saved under ignored `qa/aryan-website.png`.

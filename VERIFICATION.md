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

## Verification limits

No production host, real SMS credentials or domain/TLS configuration was available. Provider delivery and callbacks, operator tax treatment/policies, uptime monitoring, scheduled off-host backups, production load/security review and the Docker image build have not been verified. The SQLite backup operation and restoration are covered by an automated test; operational scheduling is not configured.

The earlier static frontend had an axe accessibility audit. That audit does not cover the new operations, tracking and privacy pages; no full automated accessibility audit is claimed for these pages. Form labels, keyboard focus styling and responsive layouts are implemented.

The previous Sites project returns `Sites project not found`. It has not received this server-backed release, and its static manifest is retained only as historical project identity. Production intake is closed by default until `BOOKINGS_OPEN=true` is explicitly set.

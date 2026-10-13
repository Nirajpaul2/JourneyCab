# First-release verification — 13 October 2026

## Automated coverage

`npm test`: 25 tests cover existing Bihar fares/validation plus persistent requests after reopening the database, server-derived estimates, private tracking authorization, hashed access keys, idempotent submissions, malformed inputs, interstate rejection, manual state transitions, staff/customer/driver agreement requirements, stale versions, overlapping driver assignments, cancellation/release, local packages, optional SMS, accepted-versus-delivered semantics, ambiguous delivery handling, login/logout authorization, origin checks, body limits, rate limits, closed booking intake and consistent backup restoration.

SMS tests use an injected fake provider. **No real SMS, email, WhatsApp message or phone call was sent.**

`npm run build`: frontend and backend TypeScript checks plus Vite production build.

## Browser checks

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

No production host, real SMS credentials or domain/TLS configuration was available. Provider delivery and callbacks, actual operator fares/policies, uptime monitoring, scheduled off-host backups, production load/security review and the Docker image build have not been verified. The SQLite backup operation and restoration are covered by an automated test; operational scheduling is not configured.

The earlier static frontend had an axe accessibility audit. That audit does not cover the new operations, tracking and privacy pages; no full automated accessibility audit is claimed for these pages. Form labels, keyboard focus styling and responsive layouts are implemented.

The previous Sites project returns `Sites project not found`. It has not received this server-backed release, and its static manifest is retained only as historical project identity. Production intake is closed by default until `BOOKINGS_OPEN=true` is explicitly set.

# FastAPI and Supabase migration plan

Status: planned; the running service still uses the tested Node API and SQLite. Docker persistence is the immediate availability fix. Replacing the API does not, by itself, make a sleeping laptop available 24/7.

## Target architecture

```text
Customer website + staff /admin (existing React UI)
                 |
        HTTPS / same-origin proxy
                 |
            FastAPI API
                 |
     Supabase PostgreSQL (private data)
                 |
        Durable SMS outbox worker
```

Deploy the frontend and API behind one HTTPS origin to preserve the current cookie and CSRF model. Run FastAPI in an image built from the official Python base, using one Uvicorn process per container initially. Use a dedicated notification worker. Run schema migrations as a one-off release step, not once per API worker. Use a VPS or container host that remains powered on, with restart policies, readiness monitoring, log rotation and automated backups.

Supabase supplies PostgreSQL storage. It does not automatically host this FastAPI container. A local Supabase stack was observed on this Mac; no credentials were read and no databases were modified. The owner confirmed that Supabase serves other production apps and requires isolation. Use a dedicated JourneyCab project/instance as the target. Do not reuse existing application tables, service credentials, Compose projects, volumes, networks or published ports; do not restart, upgrade or migrate the existing stack. A private schema in the current instance would still share resource pressure and outages, so it is not the default design. Select the separate JourneyCab instance/project and hosting destination before integration.

## Data and access design

- SQLAlchemy 2 + psycopg and Alembic migrations; choose and lock supported package versions when implementing.
- Use a direct PostgreSQL connection for a long-lived backend where networking permits. Use Supabase's session pooler on an IPv4-only host when required. Set small bounded application pools, connection timeouts and verified TLS for remote connections. Do not assume a transaction-pooler connection supports session features.
- Put business tables in a private, non-exposed schema; a dedicated backend database role gets only the needed permissions. Keep migration-owner credentials separate. If any tables are exposed through Supabase Data APIs, require RLS and explicit deny/allow tests. Never expose a database password or Supabase service-role key in the React bundle.
- Preserve the existing staff login/session contract in the first migration: port scrypt verification, hashed session tokens, expiration, secure HttpOnly cookies, CSRF origin checks, login throttling and logout revocation. No default admin password. Supabase Auth can be a later explicit change with staff invitations and session cutover; using Supabase storage does not require replacing staff authentication immediately.
- Store monetary amounts as integer rupees (or explicitly migrate all money to paise), never floating-point values. Preserve immutable quoted fare snapshots when the published catalog changes.
- Keep booking/customer details and hashed private tracking keys restricted to the API. Public tracking responses must continue excluding passenger phone/address data and withhold driver contact until confirmation.

## Tables and constraints

| Table | Required behavior |
| --- | --- |
| staff_users / staff_sessions | Unique staff identity, secure password hashes, hashed expiring sessions; later roles can distinguish dispatch and finance |
| drivers | Active status, service area, vehicle category, registration, verification metadata |
| bookings | Unique reference, idempotency key + request hash, journey/contact snapshots, status, quote, version and hashed tracking token |
| driver_allocations | Transactional collision prevention with PostgreSQL range/exclusion constraints or a locked driver row; preserve current allocation windows during import |
| booking_events | Append-only audit of staff action, actor, timestamp and reason |
| notification_outbox | Same-transaction enqueue on confirmation/cancellation; transactional claims, provider IDs, accepted/delivered/unknown states |
| request_rate_limits | Shared persistent throttling for multiple API replicas; do not rely on per-process memory |
| published_routes | All 19 directional fares from ROUTE-PRICING.md; versioned catalog shared with React |

The backend must keep idempotent submissions and version-checked updates atomic. Driver collision checks and notification claims must remain safe with two simultaneous workers; a check-then-write sequence without a transaction is insufficient. A notification timeout with an unknown provider result must not trigger blind duplicate delivery.

## API contract to preserve

- `GET /api/health`: readiness, including a bounded database check. Add a separate process-only liveness endpoint.
- `GET/POST/DELETE /api/session`: current staff session contract.
- `POST /api/bookings`: validated ride request, no automatic confirmation or payment.
- `GET /api/bookings/{reference}`: existing private bearer tracking token.
- `GET /api/admin/bookings` and `GET/POST /api/admin/bookings/{reference}`: list, detail and allowed state transitions.
- `GET/POST /api/admin/drivers` and `PATCH /api/admin/drivers/{id}`: partner register.
- `POST /api/admin/notifications/{id}`: controlled send/manual-contact action.

Use Pydantic request/response models, explicit error mapping and maximum request-body limits. Preserve the frontend's JSON response shapes, status codes and meaningful error messages. Keep same-origin `/api` routing rather than opening permissive cross-origin credential access.

## Delivery sequence

1. **Stabilize current runtime:** Docker Compose, existing persistent database, backup, detached startup, health and restart verification. Do not connect the existing app to an empty new database as an apparent fix.
2. **Provision staging:** select Supabase project, server and domain. Configure connection secrets privately. Create a separate migration role and runtime role. Test connection without printing credentials.
3. **Implement parity:** FastAPI routes, PostgreSQL schema, staff auth, route validation, state machine, tracking, notification worker, production intake gate and security headers. Export the route catalog into a neutral shared format to avoid maintaining divergent TS/Python prices.
4. **Test:** run the current contract scenarios against both APIs. Add concurrent duplicate submissions, simultaneous driver assignment, stale-version conflicts, session expiry, unauthorized tracking, RLS/role access and outbox claim tests. Verify frontend customer and staff flows on staging.
5. **Import:** take a consistent SQLite backup, run a dry-run importer, then compare counts, references, statuses, quoted amounts, driver links and tracking-token hashes. Preserve historic bookings even if their routes are no longer bookable. Do not migrate temporary login/rate-limit state without a clear expiry policy; require staff to sign in again at cutover.
6. **Cut over:** close new intake and pause staff mutations/notification delivery briefly, take the final snapshot, import once, verify, switch the same-origin proxy, run a supervised test, then reopen intake. Never run two SMS workers against the same outbox during cutover.
7. **Rollback:** retain the original database and image. Before any new PostgreSQL writes, rollback is a proxy switch. After new writes, stop intake and reconcile/export those writes before reverting; never silently discard post-cutover bookings.

## Payment history (separate feature)

The current app has no payment collection or history. Plan an append-only payment/refund ledger linked to bookings: amount, method (cash/UPI), reference, received/refunded date, staff actor and verification status. Derive paid/balance from the ledger and agreed fare. Distinguish a manually reported payment from verified gateway settlement. Add payment-gateway collection/webhooks only after selecting a provider, with signature validation and unique event IDs; do not create fictional historical payments during migration.

## Inputs needed

- A dedicated JourneyCab Supabase project or separate instance, isolated from the existing production apps. Keep database credentials in a local ignored environment file or the host secret manager, not in chat.
- An always-on host and production domain. Docker Desktop on this Mac is local development availability, not a 24/7 hosting guarantee.
- A real staff account and operating team. No default account is included.
- SMS credentials and sender setup when real delivery is wanted; no provider is enabled by this Docker change.

## Official references

- [FastAPI Docker deployment](https://fastapi.tiangolo.com/deployment/docker/)
- [Supabase PostgreSQL connections](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase connection pool limits](https://supabase.com/docs/guides/database/connecting-to-postgres/pooling-and-limits)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Docker Compose service configuration](https://docs.docker.com/reference/compose-file/services/)

References checked 13 October 2026. This document is a migration plan, not a claim that FastAPI or Supabase is already connected.

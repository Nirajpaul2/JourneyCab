# JourneyCab implementation status — 13 October 2026

The first-release workflow requested by the owner is implemented locally: **customer request → manual fare approval → local partner assignment → team confirmation → customer status update and notification queue**.

| Area                     | Current implementation                                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bihar customer interface | Existing responsive design, 12 cities, six featured intercity pairs and both local packages.                                                                                               |
| Ride requests            | Persisted by a Node/SQLite API; no browser-only simulated confirmation. Initial fares remain illustrative until the operator supplies real rates.                                          |
| Staff access             | Scrypt passwords, server-side sessions, protected admin API, same-origin writes, rate limits, logout and eight-hour expiry. No default credentials.                                        |
| Dispatch                 | Fare and inclusions recorded after customer agreement; driver acceptance and active matching category required; overlapping assignments and stale updates rejected.                        |
| Partner register         | Driver contact, Bihar base, vehicle category/model/registration, active/inactive status. Documentary verification is an operator responsibility.                                           |
| Customer confirmation    | Private status page shows confirmed fare and assigned driver after staff approval. Random access key, hash stored server-side.                                                             |
| Communications           | Durable SMS queue and optional Twilio adapter; manual contact records without credentials. Provider acceptance is not labelled delivered. Real delivery remains unconfigured and untested. |
| Operations history       | Actor/action/note/time audit trail; cancellation/decline and trip completion.                                                                                                              |
| Recovery                 | Persistent SQLite storage, backup management command and tested backup restoration. Scheduled encrypted off-host backups need hosting setup.                                               |
| Verification             | 25 automated tests, TypeScript/build checks, complete browser workflow and mobile/tablet/desktop checks. See VERIFICATION.md for exact limits.                                             |
| Deployment               | Node/container files and setup guide included. Production request intake defaults closed. No production deployment performed.                                                              |

## What still needs the owner or production infrastructure

Real service pricing/hours and verified partners; operator identity, support contact and approved policies; a Node host/domain with a private persistent disk; live notification credentials and provider delivery validation; operational backup/monitoring setup; and a production security/load review. Details are in DEPLOYMENT.md.

This release uses one application instance and shows the latest 500 requests in the staff inbox. It does not implement payments, automated dispatch, GPS tracking, customer accounts/OTP, WhatsApp/email delivery, multi-role permissions or self-service staff password recovery. Rescheduling/reassignment currently requires closing the original request and creating a new one with the customer.

The old static Sites preview remains inaccessible to management (`Sites project not found`). It is not the current implementation. Do not publish the frontend bundle alone as the new service; its API requires the Node runtime described in DEPLOYMENT.md.

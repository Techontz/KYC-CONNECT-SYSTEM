# BodaConnect OS API (Laravel)

Rider, vehicle and association registry for the UMAPIDO bodaboda pilot in Dodoma, Tanzania.
This is the backend for the Next.js frontend in `../frontend`. The binding API contract is
`../docs/API_CONTRACT.md` (base path `/api/v1`, camelCase JSON).

Stack: Laravel 13, PHP 8.4, MySQL 8.4, Laravel Sanctum (bearer tokens).

## Setup

```bash
composer install
cp .env.example .env            # DB_* already point at mysql://root@127.0.0.1:3306/bodaconnect
php artisan key:generate
mysql -uroot -e "CREATE DATABASE IF NOT EXISTS bodaconnect; CREATE DATABASE IF NOT EXISTS bodaconnect_test"
php artisan migrate:fresh --seed
php artisan serve --port=8000   # API at http://127.0.0.1:8000/api/v1
php artisan test                # feature tests, run against the bodaconnect_test database
```

If port 8000 is taken by another local project, use `php artisan serve --port=8010` and point the
frontend's API base URL at it.

## Demo logins (seeded, synthetic data)

Login is phone + OTP. With `APP_ENV=local` the response of `POST /api/v1/auth/otp/request`
contains `devCode`, and the code is also written to `storage/logs/laravel.log`.

| Phone | Role | Seeded as |
|---|---|---|
| +255700000001 | platform_admin | Neema Mollel |
| +255700000002 | verifier | Baraka Mushi |
| +255700000003 | field_agent (UMAPIDO) | Rehema Said |
| +255700000004 | association_admin (UMAPIDO) | Hamisi Kombo |
| +255700000005 | group_leader (Kikundi cha Jamatini) | Saidi Juma Mrisho |
| +255700000006 | rider | Juma Hamisi Mwakyusa |

```bash
B=http://127.0.0.1:8000/api/v1
curl -s -X POST $B/auth/otp/request -H 'Content-Type: application/json' -d '{"phoneNumber":"+255700000001"}'
curl -s -X POST $B/auth/otp/verify  -H 'Content-Type: application/json' -d '{"phoneNumber":"+255700000001","code":"<devCode>"}'
curl -s $B/me -H "Authorization: Bearer <token>"
```

OTP requests are limited to 3/min per phone and 10/min per IP. If you hit `RATE_LIMITED` while
testing locally, wait a minute or run `php artisan cache:clear`.

Seed contents: 2 organisations (BodaConnect (Wadonge Group Limited), UMAPIDO Dodoma), 8 UMAPIDO
groups, 14 parking points across Dodoma wards, 121 synthetic riders with Swahili names spread
over the whole status funnel, about 110 vehicles, 300 verification cases (with decisions), 3
open duplicate flags plus one resolved, 5 support requests, notifications, and privacy notice
`2026-01` in Swahili and English. The seeder is deterministic (`mt_srand` with a fixed seed, no
Faker), so every `migrate:fresh --seed` produces the same data.

## Architecture

```
app/
  Support/
    Scope.php            central authorisation scope (role_assignments -> query constraints)
    Permissions.php      role -> permission map, role labels, privileged roles
    Audit.php            append-only audit writer with metadata redaction
    ErrorRenderer.php    every exception -> contract error envelope
    ApiException.php     domain errors (BUSINESS_RULE, CONFLICT, NOT_FOUND, ...)
    Completeness.php     mandatory field completeness (drives completion rate)
    DuplicateDetector.php phone / identity hash / plate / name matching (never merges)
    Phone.php            E.164 normalisation and masking for Tanzanian numbers
  Http/
    Middleware/RequestId.php      X-Request-Id on every response (generated if absent)
    Middleware/IdempotencyKey.php Idempotency-Key replay for POST creates (24h, per user)
    Requests/*                    Form Requests (camelCase input, errors -> fieldErrors)
    Resources/*                   API Resources (camelCase output)
    Controllers/*                 one controller per module (below)
  Models/*               UUID primary keys (HasUuids)
```

Modules and controllers:

| Module | Controller | Endpoints |
|---|---|---|
| Auth | AuthController | OTP request/verify, logout, /me |
| Registry | RiderController, DocumentController | riders CRUD, submit, duplicate check, corrections, consents, documents |
| Vehicles | VehicleController | vehicles, relationships (history kept) |
| Structure | OrganisationController | organisations, groups, parking points, group memberships |
| Verification | VerificationController | cases, assign, decision (separation of duties) |
| Duplicates | DuplicateController | open flags, resolve |
| Insight | DashboardController, ReportController | summary KPIs, CSV exports |
| Privacy | PrivacyController | active notice (public), disclosures |
| Support | SupportController, NotificationController | support/correction requests, in-app notifications, announcements |
| Admin | AdminController, LookupController | users, roles, disable/enable, audit log, lookups |

Database: `users`, `personal_access_tokens`, `organisations`, `people`, `organisation_memberships`,
`groups` (MySQL reserved word, always back-quoted by Laravel's grammar), `parking_points`,
`group_memberships`, `vehicles`, `vehicle_relationships`, `verification_cases`,
`verification_decisions`, `documents`, `privacy_notices`, `consent_records`, `data_disclosures`,
`service_requests`, `notifications` (model `InAppNotification`), `support_requests`, `audit_events`,
`role_assignments`, `duplicate_flags`, `otp_codes`, `report_exports`, `idempotency_keys`, `counters`
(sequence for `system_id` such as `BC-DOD-000123`).

### Authorisation model

Every request resolves `Scope::for($user)` from the user's active role assignments:

| Role | Scope |
|---|---|
| platform_admin, verifier | global |
| field_agent, association_admin | people with an active membership in their organisation(s) |
| group_leader | active members of their group(s), limited fields only (`limitedView: true`) |
| rider, owner | their own person record (`users.person_id`) |

All list and show queries go through `Scope` (`people()`, `vehicles()`, `groups()`,
`viaPerson()`, ...). An id outside the caller's scope returns `404 NOT_FOUND`, never 403, so the
existence of records is not leaked. A missing permission returns `403 FORBIDDEN`.

Separation of duties (AC-07): the user who submitted a rider cannot decide its verification cases,
and nobody can decide a case about their own person record (`422 BUSINESS_RULE`).

## Security notes

* OTP: 6 digits, 5 minute TTL, single use, stored as HMAC-SHA256 (keyed with `APP_KEY`), max 5
  verify attempts, rate limited. `devCode` is returned only when `APP_ENV=local`. The request
  endpoint returns the same body for unknown numbers (no enumeration). Disabled users get no code.
* Tokens: Sanctum personal access tokens, 12h absolute lifetime. Privileged roles
  (platform_admin, verifier, association_admin) get tokens that expire after 30 minutes idle.
  Disabling a user or revoking a role deletes the user's tokens.
* Identity numbers: `people.identity_reference` uses the `encrypted` cast; duplicate matching uses
  `identity_reference_hash` (SHA-256 of the normalised value). Responses mask it unless the caller
  has `riders.view_sensitive` (verifier, platform_admin). It never appears in exports or audit logs.
* Documents: stored on the private `local` disk (`storage/app/private/documents/<random>.<ext>`),
  the disk's `serve` option is off, so there is no public or signed URL. Only pdf/jpg/png up to 5MB
  (extension and MIME both checked). SHA-256 of each file is stored. Downloads re-check scope and
  are audited.
* Exports: CSV generated synchronously to the private disk, minimal fields (masked phones, no
  identity numbers), purpose of at least 10 characters required, downloadable by the creator only,
  for 15 minutes. Cells are escaped against spreadsheet formula injection. Create and download are
  audited.
* Audit: `audit_events` is append-only (model guards plus MySQL triggers that reject UPDATE and
  DELETE). Metadata is redacted: keys such as otp, token, password, identity are stored as
  `[REDACTED]`. Each event stores the request id, IP and user agent.
* Errors: every API error uses the envelope `{"error":{"code","message","fieldErrors?","details?","requestId"}}`.
  With `APP_DEBUG=false` no exception class, message or stack trace is ever returned.
* CORS: only `http://localhost:3000` and `http://localhost:3011`. The frontend normally calls the
  API server-to-server through its BFF route and keeps the token in an HttpOnly cookie.
* Production checklist: `APP_ENV=production`, `APP_DEBUG=false`, real SMS gateway in
  `AuthController::requestOtp`, a non-root DB user, HTTPS only, and a shared cache store (Redis) so
  rate limits apply across instances.

## Tests

`php artisan test` runs the feature suite in `tests/Feature` against MySQL `bodaconnect_test`:

* `AuthOtpTest`: OTP login, hashed storage, single use, 5 attempt limit, rate limit, no enumeration, devCode only in local, error envelope and X-Request-Id
* `ScopeTest`: AC-05 group leader isolation, AC-06 cross-org 404, rider self-only and protected fields
* `RiderRegistrationTest`: AC-02 duplicate phone 409 without merge, identity flag, encryption at rest, camelCase field errors, idempotency replay
* `VerificationTest`: AC-07 self-approval blocked, status rollup, permission check
* `ExportTest`: AC-10 permission, purpose, audit, 15 minute window, no identity numbers
* `DocumentTest`: AC-11 not publicly reachable, scope re-check, audit, mime and size validation
* `UserAdminTest`: US-06 disable revokes tokens, scoped role grant/revoke, append-only audit and redaction
* `SeededDemoTest`: demo users, dashboard metrics and per-role visibility on the seeded data

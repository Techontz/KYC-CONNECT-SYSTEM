# BodaConnect OS: API Contract (v1)

Source of truth shared by `backend/` (Laravel 13 + MySQL) and `frontend/` (Next.js 15).
Derived from *BodaConnect OS MVP PRD & Technical Plan v1.0* (UMAPIDO Dodoma pilot).

## Ports (local dev)

| App | URL |
|---|---|
| Laravel API | http://127.0.0.1:8010/api/v1 (8010 because port 8000 is used by another local project) |
| BodaConnect OS frontend | http://localhost:3011 (3011 because port 3001 is used by another local project) |
| KYC Connect landing (overview) | http://localhost:3000 |

## Auth model

* Phone OTP → Laravel Sanctum personal access token (bearer).
* The browser **never** holds the token in JS. The Next.js frontend has a route handler
  `src/app/api/bff/[...path]/route.ts` that forwards requests to Laravel and keeps the token in an
  `HttpOnly; Secure (prod); SameSite=Lax` cookie named `bc_session`. Login/logout go through
  `src/app/api/auth/*` route handlers that set/clear that cookie.
* OTP: 6 digits, 5 min TTL, single use, stored hashed, max 5 verify attempts, request rate-limited
  (3/min per phone, 10/min per IP). `/auth/otp/request` always returns 200 with the same body
  whether or not the number is registered (no enumeration).
* **Dev only** (`APP_ENV=local`): response includes `"devCode": "123456"` and the code is written to
  `storage/logs/laravel.log`. Never in production.
* Token expiry 12h (privileged roles: idle-timeout 30 min enforced via `last_used_at`).
* Revoking a user (`status=disabled`) deletes all their tokens.

## Conventions

* Base path `/api/v1`, JSON, **camelCase** keys in requests and responses.
* Every response carries header `X-Request-Id`; errors include it in the body.
* Error envelope:
  ```json
  {"error":{"code":"VALIDATION_ERROR","message":"Please check the highlighted fields.","fieldErrors":{"phoneNumber":"Enter a valid phone number."},"requestId":"..."}}
  ```
  Codes: `VALIDATION_ERROR` 400/422, `UNAUTHENTICATED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404,
  `CONFLICT` 409, `BUSINESS_RULE` 422, `RATE_LIMITED` 429, `SERVER_ERROR` 500.
* Lists: `?page=1&perPage=25` (max 100) → `{"data":[...],"meta":{"page":1,"perPage":25,"total":123,"lastPage":5}}`.
* Single resources: `{"data":{...}}`.
* Creates accept header `Idempotency-Key` (uuid). Same key + same user within 24h → return the original response.
* Timestamps ISO-8601 UTC. UI renders in `Africa/Dar_es_Salaam`.
* Phone numbers normalised to E.164 (`0712345678` → `+255712345678`).
* Vehicle plates normalised (uppercase, no spaces/dashes) into `registrationNumberNormalised`; display value kept.

## Roles (role_assignments.role)

| key | label | scope |
|---|---|---|
| `platform_admin` | BodaConnect platform administrator | global |
| `verifier` | BodaConnect verifier | global (cannot decide cases they submitted) |
| `field_agent` | BodaConnect field agent | organisation |
| `association_admin` | UMAPIDO association administrator | organisation |
| `group_leader` | Group / parking-point leader | group |
| `rider` | Rider | own person record |
| `owner` | Motorcycle/bajaji owner | own vehicles |

Server enforces role **and** scope on every endpoint (AC-05/AC-06). Out-of-scope id → 404 (not 403) to avoid leaking existence.

## Status enums

* Rider/person `profileStatus`: `draft | submitted | under_review | verified | correction_required | rejected | archived`
* Verification case `status`: same list minus `archived` is allowed; types: `phone | identity | vehicle | membership`
* Verification `method`: `document_review | in_person | association_confirmation | phone_otp`
* Vehicle relationship `relationshipType`: `owner | operator | keeper`
* Vehicle `vehicleType`: `motorcycle | bajaji`
* Support request `category`: `correction | help | complaint`; `status`: `open | in_progress | resolved | rejected`
* Duplicate flag `status`: `open | confirmed_duplicate | not_duplicate`

## Endpoints

### Auth
| Method | Path | Body / notes |
|---|---|---|
| POST | `/auth/otp/request` | `{phoneNumber}` → `{data:{sent:true, expiresInSeconds:300, devCode?}}` |
| POST | `/auth/otp/verify` | `{phoneNumber, code}` → `{data:{token, user}}` |
| POST | `/auth/logout` | revokes current token |
| GET | `/me` | `{data:{id, phoneE164, status, person:{id, legalName, preferredName}|null, roles:[{role, organisationId, organisationName, groupId, groupName}], permissions:[string]}}` |

### Riders (people)
| Method | Path | Notes |
|---|---|---|
| GET | `/riders` | filters: `q` (name/phone/systemId), `organisationId`, `groupId`, `parkingPointId`, `status`, `registeredFrom`, `registeredTo`. Returns minimum fields: `id, systemId, legalName, preferredName, phoneMasked, profileStatus, completeness, organisationName, groupName, parkingPointName, createdAt, duplicateFlag` |
| POST | `/riders` | `{legalName, preferredName?, phoneNumber, dateOfBirth?, gender?, identityReference?, organisationId, groupId?, parkingPointId?, privacyNoticeVersion, captureMethod:'assisted_registration'|'self_registration', consents:[{purpose, granted:bool}], vehicle?:{vehicleType, registrationNumber, make?, model?, relationshipType}}` → 201 `{data:rider, duplicates:[...]}`. Exact phone match → 409 `CONFLICT` with `details.matches`. Fuzzy/ID/plate matches → created and `duplicateFlag` raised (never auto-merge). |
| POST | `/riders/duplicate-check` | `{phoneNumber?, identityReference?, legalName?, registrationNumber?}` → `{data:{matches:[{id, systemId, legalName, reason:'phone'|'identity'|'plate'|'name'}]}}` |
| GET | `/riders/{id}` | full permitted profile: person fields (identityReference returned **masked** unless `riders.view_sensitive`), memberships, groupMemberships, vehicles (with relationships), verificationCases, consents, documents (metadata), completeness `{percent, missing:[string]}`, timeline (audit summary) |
| PATCH | `/riders/{id}` | contact/preferred fields directly; protected fields (`legalName`, `identityReference`, `dateOfBirth`) → 422 `BUSINESS_RULE` unless verifier/admin |
| POST | `/riders/{id}/submit` | draft/correction_required → submitted; creates verification cases (identity, membership, phone) |
| POST | `/riders/{id}/correction-requests` | `{field, proposedValue, reason}` → creates support_request(category=correction) |
| POST | `/riders/{id}/documents` | multipart `file` + `documentType` (`national_id|driving_licence|vehicle_registration|membership_letter|other`); pdf/jpg/png ≤ 5MB, stored on private disk with random key |
| GET | `/documents/{id}/download` | re-checks access; streams file; audited. No public URLs. |

### Vehicles
| GET | `/vehicles` | `q`, `vehicleType`, `status` (scoped) |
| POST | `/vehicles` | `{vehicleType, registrationNumber, make?, model?, colour?}`; duplicate normalised plate → 409 with match |
| GET | `/vehicles/{id}` | with relationships (person name, type, startAt, endAt, verificationStatus) |
| POST | `/vehicles/{id}/relationships` | `{personId, relationshipType, startAt?}`; ending previous active relationship of same type sets `endAt` |
| POST | `/vehicle-relationships/{id}/end` | `{endAt?}` |

### Organisations / groups / parking points
| GET | `/organisations` | scoped |
| POST | `/organisations` | platform_admin |
| GET | `/organisations/{id}` | with counts |
| GET/POST | `/organisations/{id}/groups` | `{name, code, leaderPersonId?}` |
| PATCH | `/groups/{id}` | |
| GET/POST | `/organisations/{id}/parking-points` | `{name, ward, area?, latitude?, longitude?}` |
| GET | `/groups/{id}/members` | roster, minimum fields |
| POST | `/groups/{id}/memberships` | `{personId}`; existing active membership in same org → ends it (history kept); duplicate active in same group → 409 |
| POST | `/group-memberships/{id}/end` | |

### Verification
| GET | `/verification-cases` | `status`, `verificationType`, `assignedTo=me` |
| GET | `/verification-cases/{id}` | subject summary, evidence documents, history (all decisions) |
| POST | `/verification-cases/{id}/assign` | `{userId?}` (default self) → `under_review` |
| POST | `/verification-cases/{id}/decision` | `{outcome:'verified'|'correction_required'|'rejected', method, reasonCode, notes}`; reason required; submitter === decider → 422 `BUSINESS_RULE` "Separation of duties" (AC-07). Rider `profileStatus` becomes `verified` only when all its open cases are verified. |

### Duplicates
| GET | `/duplicate-flags` | open flags |
| POST | `/duplicate-flags/{id}/resolve` | `{resolution:'confirmed_duplicate'|'not_duplicate', notes}` |

### Dashboard & reports
| GET | `/dashboard/summary` | scoped. `{data:{totals:{riders, verified, pendingVerification, correctionRequired, drafts, vehicles, groups, parkingPoints, openDuplicates, openSupport}, completionRate, duplicateRate, medianTurnaroundHours, groupCoverage:{covered,total}, funnel:[{stage,count}], registrationsByDay:[{date,count}] (30d), byGroup:[{groupName,count}], recentActivity:[{action, actorName, entityType, at}], definitions:{metricKey: "plain-language definition"}}}` |
| GET | `/reports` | list of report types `[{key, name, description, fields:[...]}]`: `rider_roster`, `verification_status`, `group_coverage` |
| POST | `/reports/exports` | `{reportType, purpose (required, min 10 chars), filters:{organisationId?, groupId?, status?}}` → creates export (sync CSV generation), audit `export.created` |
| GET | `/reports/exports` | caller's exports |
| GET | `/reports/exports/{id}/download` | re-checks permission; link valid 15 min after creation; audited |

### Privacy
| GET | `/privacy/notices/active` | public (no auth) – current notice `{version, language, content}` |
| GET | `/riders/{id}/consents` | |
| POST | `/riders/{id}/consents/{consentId}/withdraw` | |
| POST | `/privacy/disclosures` | platform_admin only `{subjectPersonId, recipientOrgId, purpose, dataCategories:[], legalBasis, expiryAt?}` |
| GET | `/privacy/disclosures` | `?subjectPersonId=` |

### Support
| GET | `/support-requests` | rider sees own; staff sees scoped |
| POST | `/support-requests` | `{category, description, subjectPersonId?}` |
| POST | `/support-requests/{id}/resolve` | `{status:'resolved'|'rejected', resolutionSummary}`; resolving an approved correction applies the field change and audits it |

### Notifications
| GET | `/notifications` | in-app notices for current user |
| POST | `/notifications/{id}/read` | |
| POST | `/announcements` | association_admin / platform_admin `{title, body, organisationId?}` → fan-out in-app notifications |

### Admin
| GET | `/users` | platform_admin (or association_admin for own org) |
| POST | `/users` | `{phoneNumber, legalName, roles:[{role, organisationId?, groupId?}]}` |
| POST | `/users/{id}/roles` | grant `{role, organisationId?, groupId?}` |
| DELETE | `/role-assignments/{id}` | revoke (sets `revokedAt`) |
| POST | `/users/{id}/disable` / `/users/{id}/enable` | disable revokes all tokens (US-06) |
| GET | `/audit-events` | platform_admin; `actorId`, `action`, `entityType`, `from`, `to` |
| GET | `/lookups` | `{wards:[...], documentTypes, reasonCodes, vehicleMakes, consentPurposes}` |

## Seed data (DatabaseSeeder)

Organisations: **BodaConnect (Wadonge Group Limited)** type `platform`, **UMAPIDO Dodoma** type `association`.
UMAPIDO groups (8) e.g. *Kikundi cha Jamatini*, *Nyerere Square*, *Makole*, *Area D*, *Chamwino*, *Kisasa*, *Mnadani*, *Ipagala*; parking points ~12 in Dodoma wards.
~120 synthetic riders (Swahili names, fake `+2557…` numbers), vehicles (plates like `MC 123 ABC`), mixed statuses, some verification cases, a couple of duplicate flags, privacy notice `2026-01` (sw + en).

Demo login users (OTP shown in dev):

| Phone | Role |
|---|---|
| +255700000001 | platform_admin |
| +255700000002 | verifier |
| +255700000003 | field_agent (UMAPIDO) |
| +255700000004 | association_admin (UMAPIDO) |
| +255700000005 | group_leader (Jamatini group) |
| +255700000006 | rider |

## Backend implementation notes (v1.1, binding clarifications)

These record exactly what the Laravel backend returns where the table above left room. Fields
marked "additive" are extra and safe to ignore.

* **Framework**: the backend is Laravel 13 (the skeleton shipped 13.x), not 12. No API impact.
* **OTP verify failure** (wrong, expired, used or too many attempts): `422 VALIDATION_ERROR` with
  `fieldErrors.code`. Verify success also returns `expiresAt` (additive).
* **`/me`**: additive `displayName` (string, always set). Each role also has additive `id`
  (role assignment id, used by `DELETE /role-assignments/{id}`) and `roleLabel`.
* **Rider list**: `completeness` is an integer percent (0-100); `duplicateFlag` is a boolean (open
  flag exists). `phoneMasked` looks like `+2557*****678`. The list includes archived riders unless
  filtered with `status`. `status` accepts a comma list (`submitted,under_review`).
* **Rider detail**: `completeness` is `{percent, missing:[field keys]}`. Missing keys:
  `legalName, phoneNumber, dateOfBirth, gender, identityReference, organisationMembership,
  groupMembership, parkingPoint, vehicle, registrationConsent`. Additive: `limitedView` (true for
  group leaders: only id, systemId, names, phoneMasked, profileStatus, organisation/group/parking
  point ids and names, createdAt, duplicateFlag are returned), `identityReferenceMasked`,
  `phoneE164`, `organisationId`, `groupId`, `parkingPointId`. `vehicles[]` items are vehicle objects
  with a nested `relationship`. `timeline[]` items are `{action, actorName, at}`.
* **Duplicate matches** (in `POST /riders` 409 `error.details.matches`, the 201 `duplicates`, and
  `/riders/duplicate-check`): `{id, systemId, legalName, reason, inScope, vehicleId,
  registrationNumber}`. When the match is outside the caller's scope, `legalName` is reduced to
  initials (`J*** H***`) and `inScope` is false. A `name` flag is raised on create only when the
  name AND date of birth match; name-only matches are reported but not flagged.
* **Vehicle 409**: `error.details.matches:[{id, registrationNumber, reason:'plate'}]`.
* **Dashboard**: `completionRate` and `duplicateRate` are fractions 0..1 (multiply by 100 to
  display). `medianTurnaroundHours` may be `null` when no case is decided. `funnel` stages are, in
  order, `registered, profile_complete, submitted, verified`. Additive: `totals.rejected`,
  `statusBreakdown:[{status,count}]`, `byGroup[].groupId`, `generatedAt`. Archived riders are
  excluded from all totals.
* **Lookups**: `wards: string[]`, `vehicleMakes: string[]`, `documentTypes` and `consentPurposes`:
  `[{value,label}]`, `reasonCodes: [{value,label,outcome}]` (filter by decision outcome). Additive:
  `genders`, `verificationMethods`, `roles` (all `[{value,label}]`). Consent purposes:
  `registration` (required to create a rider), `association_membership`, `partner_services`,
  `sms_notifications`.
* **Privacy notice**: `GET /privacy/notices/active?language=sw|en` (default `sw`). Response adds
  `id, title, publishedAt, availableLanguages`.
* **Verification cases**: list adds optional `personId` filter. Items: `{id, verificationType,
  status, subject:{id, systemId, legalName, preferredName, phoneMasked, profileStatus}, vehicleId,
  submittedBy:{id,name}|null, assignedTo|null, decidedBy|null, method, reasonCode, notes,
  submittedAt, decidedAt, createdAt}`; detail adds `evidence:[document]` and `history:[{id, outcome,
  method, reasonCode, notes, decidedBy, decidedAt}]`. Only open cases (`submitted`, `under_review`)
  can be decided.
* **Groups**: items `{id, organisationId, name, code, leaderPersonId, leaderName, status,
  memberCount, parkingPointCount, createdAt}`. Members roster items: `{membershipId, personId,
  systemId, legalName, preferredName, phoneMasked, profileStatus, role, parkingPointId,
  parkingPointName, status, startAt, endAt}`. Organisation detail adds `counts:{members, groups,
  parkingPoints, vehicles, verifiedMembers}`.
* **Exports**: items `{id, reportType, purpose, filters, status:'ready', rowCount, createdAt,
  expiresAt, downloadAvailable, downloadPath, downloadedAt, downloadCount}`. Download after the
  15-minute window returns `422 BUSINESS_RULE`; only the creator can download (others get 404).
* **Notifications**: list `meta` adds `unread` (count); `?unread=1` filters. `POST /announcements`
  returns `201 {data:{recipients, organisationId}}`.
* **Support requests**: items `{id, category, status, description, subjectPersonId, subjectName,
  subjectSystemId, requestedBy, field, proposedValue, reason, resolutionSummary, resolvedBy,
  resolvedAt, createdAt}`. Corrections to `legalName`, `identityReference`, `dateOfBirth` can only
  be approved by a verifier or platform_admin.
* **Idempotency**: reusing an `Idempotency-Key` with a different body returns `409 CONFLICT`;
  replays carry header `Idempotent-Replayed: true`.
* **Rate limits**: OTP request 3/min per phone and 10/min per IP; OTP verify 10/min per phone and
  30/min per IP; authenticated API 240/min per user. All return `429 RATE_LIMITED`.
* **Database**: the groups table is named `groups` (MySQL reserved word, quoted by Laravel).

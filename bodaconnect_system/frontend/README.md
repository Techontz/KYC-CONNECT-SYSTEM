# BodaConnect OS: web frontend (PWA)

The official operating system for the UMAPIDO bodaboda and bajaji association pilot in Dodoma,
Tanzania (owner: Wadonge Group Limited). Riders, field agents, association admins, group leaders,
verifiers and platform admins all use this one app. Swahili first, with an English option.

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · TanStack Query · react-hook-form + zod ·
recharts · lucide-react. The API contract is `../docs/API_CONTRACT.md` (v1 plus the v1.1 backend notes).

## Setup

```bash
cp .env.example .env.local     # adjust if needed
npm install
npm run dev                    # http://localhost:3011
npm run build && npm start     # production build on port 3011
npm run lint
```

The Laravel API must be running (see `../backend`). Locally it is served on port **8010**:

```bash
cd ../backend && php artisan serve --port=8010
```

### Environment

| Variable | Example | Notes |
|---|---|---|
| `API_BASE_URL` | `http://127.0.0.1:8010/api/v1` | Server-side only. Used by the BFF route handlers. Never sent to the browser. |
| `NEXT_PUBLIC_LANDING_URL` | `http://localhost:3000` | Link back to the KYC Connect overview site. |

### Demo accounts (development only)

The sign-in screen lists these when `NODE_ENV !== "production"`. In local dev the API returns the
OTP as `devCode`, and the sign-in screen shows it in a clearly labelled dev banner.

| Phone | Role |
|---|---|
| +255700000001 | platform_admin |
| +255700000002 | verifier |
| +255700000003 | field_agent (UMAPIDO) |
| +255700000004 | association_admin (UMAPIDO) |
| +255700000005 | group_leader (Jamatini) |
| +255700000006 | rider |

If you hit `RATE_LIMITED` while testing sign-in, run `php artisan cache:clear` in `../backend`.

## Architecture

```
Browser ──fetch /api/bff/*──▶ Next.js route handlers (BFF) ──Bearer token──▶ Laravel /api/v1
          (cookie: bc_session, HttpOnly)
```

- **BFF (backend-for-frontend).** The Sanctum token lives only in an `HttpOnly`, `SameSite=Lax`
  cookie named `bc_session`. It is `Secure` in production and lasts 12 hours. The browser never sees it.
  - `src/app/api/auth/request-otp`: forwards to `/auth/otp/request` (passes `devCode` through in dev).
  - `src/app/api/auth/verify-otp`: forwards to `/auth/otp/verify`, sets the cookie, and strips the
    token from the response.
  - `src/app/api/auth/logout`: revokes the token at the API and clears the cookie.
  - `src/app/api/bff/[...path]/route.ts`: proxies GET/POST/PATCH/PUT/DELETE and adds
    `Authorization: Bearer`. It streams request bodies (multipart uploads) and response bodies (file
    downloads), and passes through `Content-Type`, `Content-Disposition`, `X-Request-Id`,
    `Retry-After` and `Idempotent-Replayed`. A 401 clears the cookie. `..` path segments are rejected.
- **`src/middleware.ts`** sends anyone without a session to `/login?next=…`. Public pages:
  `/login` and `/privacy-notice`.
- **Typed client `src/lib/api.ts`.** `api<T>()` parses the error envelope into `ApiError`, which carries
  `code`, `message`, `fieldErrors`, `requestId` and `details`. `applyFieldErrors()` maps `fieldErrors`
  onto react-hook-form fields. Error toasts and error states show the `requestId` for support. A 401
  redirects to sign-in.
- **Idempotency (US-10).** `useIdempotencyKey()` creates one `Idempotency-Key` per submission attempt.
  The key is reused on retries after network or 5xx failures, and reset after success or a definitive
  4xx (the user must change the input). Every create POST sends one.
- **Data fetching.** TanStack Query; the `useApi(path, query)` key is `[path, query]`, so
  `invalidateQueries({queryKey: [path]})` refreshes a resource.
- **i18n.** `src/i18n/sw.ts` (source of truth; `MessageKey` type) and `src/i18n/en.ts`
  (`Record<MessageKey, string>`, so a missing translation fails the build). The language selector is an
  accessible listbox dropdown (`src/components/common/LanguageSelect.tsx`), and the choice is saved
  in `localStorage` (`bc_lang`).
- **Time.** All dates are shown in `Africa/Dar_es_Salaam` (`src/lib/format.ts`).
- **Status display.** `StatusPill` always uses icon plus text, never colour alone.
- **PWA.** `src/app/manifest.ts`, icons in `public/icons/`, and `public/sw.js`. The service worker
  caches **only** static app-shell assets (`/_next/static`, icons, fonts, the manifest). It never
  caches `/api/*` or HTML documents (PRD 8.1). When offline, a navigation gets a small built-in
  bilingual offline page. The worker is registered in production builds only. An offline banner
  explains what is unavailable.

### Design system

Inter (400 to 800, headings at -0.02em tracking). Tokens are in `src/app/globals.css` (`@theme`):
brand green `#39B54A` / hover `#2E9A3E`, forest `#1F3E35`, forest-900 `#14291F`, mint `#D6EDE3`,
mint-50 `#EEF7F2`, ink `#0B0F0D`, muted `#5B6B63`, line `#E3E8E5`, surface `#F6F8F7`, amber `#F5B700`,
red `#D64545`, blue `#2F80ED`. Corner radius is 20px on cards, 12px on inputs, and fully rounded on
buttons. Touch targets are at least 44px. Layouts are built for a 360px Android screen first; on
desktop, staff get a dark forest sidebar.

The components in `src/components/ui` are home-grown: Button, Input, Textarea, Select, Checkbox,
RadioCard, Badge, StatusPill, Card, Eyebrow, PageHeader, Table, Modal, Drawer, ConfirmModal, Tabs,
EmptyState, ErrorState, Skeleton, Toast, Pagination and Stepper.

## Screens

| PRD | Route | Who |
|---|---|---|
| S-01/S-02 | `/login` (phone, then 6-box OTP, resend timer, rate-limit message, dev code banner, demo accounts) | everyone |
| | `/privacy-notice` (public active notice) | everyone |
| S-03/S-11 | `/` staff: KPI tiles with metric definitions (AC-09), funnel, 30-day chart, by-group bars, activity. Rider: profile card, completeness ring with missing items (US-03), membership, vehicle, notices | all roles |
| S-04 | `/riders/new` 5-step wizard, live duplicate check, stop and refer, 409 match panel (AC-02), success with system ID (AC-01) | field agent, association admin, platform admin |
| S-05 | `/vehicles`, `/vehicles/new`, `/vehicles/[id]` (relationship timeline, link owner/operator/keeper, end relationship) | staff, riders (own) |
| S-06 | `/me` summary, status explanation, vehicles, membership, correction request, "not government verification" disclaimer | rider, owner |
| S-07 | `/organisations`, `/organisations/[id]` groups and parking points with create/edit drawers and group roster | staff (scoped) |
| S-08 | `/riders` roster (search, filters, table on desktop, cards on mobile), `/riders/[id]` tabs: Overview, Vehicles, Memberships, Verification, Documents (upload/download via BFF), Consents and disclosures, History | staff (group leaders get the limited view) |
| S-09/S-10 | `/verification`, `/verification/[id]` (evidence viewer, decision form, separation-of-duties message, history) | verifier, platform admin |
| | `/duplicates` open duplicate flags, compare and resolve (records never auto-merged) | verifier, association admin, platform admin |
| S-12 | `/admin` users and roles (grant, revoke, disable/enable with confirm), organisations, lookups; `/admin/audit` audit log | platform admin (association admin: own org users) |
| S-13 | `/reports` report picker, filters, field preview, mandatory purpose, confirm, export history with 15-minute downloads (AC-10) | association admin, platform admin |
| S-14 | `/notices` notifications, mark read, create announcement | all; announce: association admin, platform admin |
| S-15 | `/support` requests list, create, staff resolve (approving a correction applies it) | all |
| S-16 | `/privacy` notice, consents with withdraw, disclosure history; platform admin sees the disclosure register | all |
| S-17 | `not-found.tsx`, `error.tsx`, skeletons, empty states with illustrations, retry buttons, offline banner | |

Navigation is role-aware (`src/lib/roles.ts`) and is the union of the user's active roles. On mobile,
a bottom tab bar shows Home, Riders or Profile, Register or Vehicles, Notices and More.

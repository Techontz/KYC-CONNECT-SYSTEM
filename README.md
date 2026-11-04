# KYC Connect / BodaConnect OS

Digital rider, vehicle and association registry for the UMAPIDO bodaboda and bajaji pilot in Dodoma, Tanzania.
Product of Wadonge Group Limited.

| Folder | What it is | Stack | Local URL |
|---|---|---|---|
| `kyc-connect-web/` | KYC Connect public overview / landing site | Next.js 15, Tailwind v4 | http://localhost:3000 |
| `bodaconnect_system/frontend/` | BodaConnect OS web app (PWA) | Next.js 15, TypeScript | http://localhost:3011 |
| `bodaconnect_system/backend/` | BodaConnect OS API | Laravel 13, MySQL 8 | http://127.0.0.1:8010/api/v1 |
| `bodaconnect_system/docs/` | Shared API contract | | |

## Quick start

```bash
# 1. API (needs PHP 8.4, Composer, MySQL with a `bodaconnect` database)
cd bodaconnect_system/backend
cp .env.example .env && composer install && php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --port=8010

# 2. BodaConnect OS
cd ../frontend && cp .env.example .env.local && npm install && npm run dev   # :3011

# 3. Landing site
cd ../../kyc-connect-web && cp .env.example .env.local && npm install && npm run dev   # :3000
```

Demo logins (development only, OTP shown on screen): see `bodaconnect_system/backend/README.md`.
Each folder has its own README with details.

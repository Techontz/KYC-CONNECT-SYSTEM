# BodaKonnect public website

Public landing page of **KYC CONNECT LTD** (BRELA 211723971) introducing **BodaKonnect**, its flagship platform (UMAPIDO Dodoma pilot)
before users go into the full system.

* Next.js 15 (App Router) + TypeScript + Tailwind CSS v4, static output.
* Swahili-first with an English toggle (`src/lib/content.ts`; the choice is remembered in localStorage).
* Visual language: big bold sans headings, brand green `#39B54A`, mint `#D6EDE3` cards, deep forest `#1F3E35`,
  pill eyebrows, floating UI "chips", numbered how-it-works band, dark impact section and a forest footer.
  These tokens are shared with the BodaKonnect OS frontend.

## Run

```bash
cp .env.example .env.local   # set NEXT_PUBLIC_SYSTEM_URL to the BodaKonnect OS frontend
npm install
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
```

| Env var | Purpose |
|---|---|
| `NEXT_PUBLIC_SYSTEM_URL` | Where every "Open BodaKonnect OS" button points (default `http://localhost:3011`) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | "Talk to the pilot team" mailto address (**placeholder, replace it**) |

## Structure

```
src/app/            layout (Inter font, metadata), page, globals.css (design tokens)
src/lib/content.ts  all copy in sw + en
src/components/     LangProvider, ui (Logo, Reveal, ButtonLink, Chip), PhoneMockup
src/components/sections/  Header, Hero, Features, HowItWorks, Roles, Trust, Roadmap, Dodoma, Faq, Footer
```

## Hero slider

`src/components/sections/Hero.tsx` slides sideways like the reference site:

1. **Green brand slide**: arch texture, big headline, phone mockup with floating cards, and a cream-bordered
   badge strip (UMAPIDO | registry | 1,000 riders).
2. **Photo slides** (bodaboda, bajaji, kijiwe, safety): the photo blends into brand green on the text side, with
   an outlined button and a white trust card.

Auto-advances every 6.5 s, pauses on hover, has a pause button, dots and white arrow buttons, and starts
paused for users who prefer reduced motion.

Photos are free-licence images from Pexels, listed in `src/lib/media.ts` (allowed in `next.config.ts`).
To use real UMAPIDO photos taken with consent, put them in `public/images/` and change the URLs in `media.ts`.

## Logo

The KYC Connect mark is an open "C" (connect) with a check (verified) sweeping out of it, on a green rounded
square. Files in `public/`:

| File | Use |
|---|---|
| `logo.svg` | Full logo, dark text (light backgrounds) |
| `logo-white.svg` | Full logo, white text (dark or green backgrounds) |
| `logo-mark.svg` | Mark only (app icons, avatars, social) |
| `icon.svg` | Browser favicon |

In code: `Logo` and `LogoMark` in `src/components/ui.tsx`.

## Hero visual

`src/components/HeroHand.tsx` shows `public/images/hero-hand.png`: the client-supplied image of a hand holding a
phone running BodaKonnect OS, with its background removed (Apple Vision) so it sits on the green slide.
To replace it, cut out a new image (on a Mac: Preview > Tools > Remove Background) and save it over that file,
then update the `aspectRatio` in `HeroHand.tsx` to the new image's width / height.

## Company data

Company facts (BRELA number, dates, office, phone, email, pilot figures, collaborators) come from the
KYC CONNECT LTD corporate profile, November 2026. Figures are shown as targets, and collaborators are shown
with the profile's own disclaimer (working relationships, not signed agreements). The logo
(`public/brand/bodakonnect-logo.png`) is the official BodaKonnect logo.

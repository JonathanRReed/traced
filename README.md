# TRACED

A noir-styled browser for the [Have I Been Pwned](https://haveibeenpwned.com) public breach database. Browse known data breaches as case files, scrub a breach timeline, and check whether a password has appeared in real breach data — all without sending your actual password anywhere.

## What it does

- **Breach archive** — Every publicly known breach from HIBP, formatted as case files with severity labels (`CRITICAL`, `UNSOLVED`, `COLD CASE`), exposed data types, and affected account counts.
- **Timeline scrubber** — Navigate breach history year by year.
- **Password check** — Uses k-anonymity: your password is hashed in-browser and only the first 5 characters of the SHA-1 hash are sent to the Pwned Passwords API. Possible matches are returned and the final comparison happens on your device. Your password never leaves it.

## Stack

| Layer | Tech |
| --- | --- |
| Framework | [Astro 5](https://astro.build) (static output) |
| UI Islands | [React 19](https://react.dev) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| Hosting | [Cloudflare Pages](https://pages.cloudflare.com) |
| Data | [HIBP public API](https://haveibeenpwned.com/API/v3) — no key required |

## Project structure

```
/
├── public/               Static assets
└── src/
    ├── components/       React islands + Astro components
    │   ├── BreachArchive.tsx
    │   ├── BreachCard.tsx
    │   ├── PasswordChecker.tsx
    │   ├── TimelineScrubber.tsx
    │   ├── CommandPalette.tsx
    │   ├── FieldBriefing.astro
    │   ├── Nav.astro
    │   └── Footer.astro
    ├── layouts/          BaseLayout.astro
    ├── lib/              HIBP API helpers + utilities
    ├── pages/
    │   ├── index.astro   Home — hero + archive
    │   ├── check.astro   Password checker
    │   ├── about.astro   Project info + data sources
    │   └── case/         Dynamic breach case-file pages
    └── styles/
```

## Getting started

```sh
bun install
bun run dev        # http://localhost:4321
```

| Command | Action |
| --- | --- |
| `bun install` | Install dependencies |
| `bun run dev` | Start local dev server at `localhost:4321` |
| `bun run build` | Build static site to `./dist/` |
| `bun run preview` | Preview the production build locally |

## Privacy

- No analytics, no cookies, no tracking
- Password checker uses k-anonymity — full hash is never transmitted
- Entirely static — no backend, no database, nothing logged

## Data & attribution

All breach data is from [Troy Hunt's Have I Been Pwned](https://haveibeenpwned.com). Traced is an unofficial fan-made frontend, not affiliated with or endorsed by HIBP.

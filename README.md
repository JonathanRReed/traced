# TRACED

Browse the public [Have I Been Pwned](https://haveibeenpwned.com) breach database as case files, explore its timeline, and check a password against Pwned Passwords.

## Password checks

The browser hashes the password and sends only the first five SHA-1 hash characters to the Pwned Passwords API. It compares the returned candidates locally. Neither the password nor its complete hash is transmitted.

The site has no application backend, database, analytics, or tracking cookies. It still makes hosting and API requests; static hosting does not establish that those providers keep no request logs.

## Develop

```sh
bun install
bun run dev
```

Open `http://localhost:4321`. `bun run build` writes the static site to `dist/`; `bun run preview` serves that build locally.

The app uses Astro 5, React 19 islands, Tailwind CSS 4, and Framer Motion. Cloudflare Pages hosts it. The public breach and password data paths used here require no API key.

## Repository guide

`src/components/` contains the archive, case cards, password checker, timeline, command palette, and page sections. API helpers live in `src/lib/`.

Routes in `src/pages/` include the archive home, `check.astro`, `about.astro`, and breach pages under `case/`. Shared layout is in `src/layouts/BaseLayout.astro`; static assets are in `public/`.

## Attribution

Breach data comes from Troy Hunt's Have I Been Pwned. TRACED is an unofficial frontend, not affiliated with or endorsed by HIBP.

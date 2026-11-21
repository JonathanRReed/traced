# TRACED

A searchable frontend for the public [Have I Been Pwned](https://haveibeenpwned.com) breach database, with a case file for each breach and a local password checker backed by Pwned Passwords.

## Password checks

Your browser hashes the password with SHA-1 and sends only the first 5 characters of that hash to the Pwned Passwords API, then compares the returned candidates locally. Neither the password nor its full hash leaves the browser.

The site has no application backend, database, analytics, or tracking cookies. It still makes hosting and API requests, and static hosting doesn't mean those providers keep zero request logs.

## Develop

```sh
bun install
bun run dev
```

Open `http://localhost:4321`. `bun run build` writes the static site to `dist/`; `bun run preview` serves that build locally.

The app uses Astro 7, React 19 islands, Tailwind CSS 4 and [Starwind UI](https://starwind.dev) components. Motion is plain CSS. Fonts (Martian Mono, Doto, Atkinson Hyperlegible) are self-hosted through Fontsource. Cloudflare Pages serves `dist/` as static files, so there is no adapter. The public breach and password data paths used here require no API key.

`bun test` runs the unit tests and `bun run check` type-checks the project.

The design is three flat fields: a green band for each page's title, paper for the content, ink for the footer. Titles and figures are set in Doto (a dot-matrix face), data in Martian Mono, prose in Atkinson Hyperlegible. Every list sits on alternating green bars, and data types worth acting on are marked in red with an asterisk. The dark theme is the same system on indigo. There are three font choices (Printout, Readable, OpenDyslexic). Theme and font live in the Aa menu and are saved in `localStorage`. Design tokens are in `src/styles/global.css`; the rows, record panels, list controls and island styles are in `src/styles/components.css`.

Headings stand on their own: pages carry no lede or caption lines under them. The plain-language definition of the site sits after the list on the homepage.

The homepage server-renders the newest 60 breaches and fetches the rest from `/breaches.json` when the browser is idle. Search, filters, year and sort are kept in the URL, so a filtered view can be shared.

Pages that are only read (case files, the index, about, privacy) load no framework code. React and the search palette are fetched the first time someone presses Cmd/Ctrl+K or the search button; `src/scripts/site.ts` handles that.

## Repository guide

`src/components/` contains the breach list (`Ledger`), its rows, the case slip, password checker and command palette. Data helpers live in `src/lib/`, including the grouping of HIBP's data types into the marked families (`utils.ts`).

Routes in `src/pages/` include the home list, the static case index under `archive/`, `check.astro`, `about.astro`, and breach pages under `case/`. Shared layout is in `src/layouts/BaseLayout.astro`; static assets are in `public/`.

## Attribution

Breach data comes from Troy Hunt's Have I Been Pwned. TRACED is an unofficial frontend, not affiliated with or endorsed by HIBP.

# Chess United — official website

A fast, static website for **Chess United**, a community chess club in San
Fernando City, La Union, Philippines. It publishes the weekly Saturday session,
the 2026 tournament calendar, real club photography, the official merch price
list and the club's Messenger community link.

- **Live site:** <https://chessunited.pages.dev> (Cloudflare Pages project
  `chessunited`; mirror on the same build at
  <https://site-88c41e329d7a4c7f97de7219774a18c9.freebuff.page>)
- **Stack:** Astro 7 static output, TypeScript content data, one small vanilla JS
  file, self-hosted fonts, pre-optimized WebP images.
- **Runtime dependencies:** none beyond static files. No cookies, no forms,
  accounts or payments; the only third-party request is the Cloudflare host's own
  cookieless analytics beacon.

## Status

| Area | State |
| --- | --- |
| Design, pages, content | **VERIFIED** — built and reviewed at 1440×900 and 390×844 |
| Accessibility / SEO / best practices | **VERIFIED** — Lighthouse 100 a11y/SEO, 96+ best practices on the live site |
| Performance | **VERIFIED** — Lighthouse mobile 95–99, desktop 100 |
| Static, browser, CSP and calendar checks | **VERIFIED** — see `QA_REPORT.md` |
| Live deployment (Cloudflare Pages, project `chessunited`) | **VERIFIED** — `chessunited.pages.dev`, 2026-10-24 blue-dominant build |
| GitHub repository | **VERIFIED** — <https://github.com/RammyJo/chessunited>, branch `main`, pushed 2026-10-25 |
| Spaceship domain + DNS | **PENDING** — no domain registered or supplied |
| Custom canonical domain | **PENDING** — the site canonicalises to its `pages.dev` host |

## Quick start

Tested with Node **24.21.0** on Windows 11. Use a current Node LTS (22+).

```powershell
npm install
npm run dev          # http://localhost:4321
npm run build        # writes dist/
npm run preview      # serves the built site
```

On Windows PowerShell, if `npm.ps1` is blocked by execution policy, use
`npm.cmd` instead of `npm` (the same applies to `npx.cmd`).

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Astro dev server |
| `npm run build` | Regenerates calendar files, builds `dist/`, writes `_headers` + CSP + robots, generates the Worker |
| `npm run preview` | Serves `dist/` locally |
| `npm run check` | Astro/TypeScript diagnostics |
| `npm run qa` | Static metadata/link/image/JSON-LD checks + build checks |
| `npm run qa:browser` | Puppeteer desktop/mobile checks; needs `npm run preview` on port 4321 and Chrome |
| `npm run qa:csp` | Serves `dist/` with the production CSP and checks all 8 pages for violations |
| `npm run calendar` | Regenerates the two `.ics` files with the current `SITE_URL` |
| `npm run images` | Rebuilds WebP derivatives from the supplied originals (Python + Pillow) |
| `npm test` | Alias for the static QA pass |

Lighthouse is not installed globally. Run it through `npx` while the preview
server is up:

```powershell
npx.cmd --yes lighthouse@13.5.0 http://127.0.0.1:4321/ --view
```

## How content is organized

```
src/
  data/
    site.ts        Events, fees, prizes, merch, team, partners, group URL
    images.ts      Photo/poster paths, responsive srcsets, alt text, captions
  layouts/
    Base.astro     Metadata, canonical, Open Graph, fonts, JSON-LD, scripts
  components/      Header, footer, icons, event card, gallery/lightbox
  pages/           Home, events, play, gallery, shop, about, visit, 404
  styles/
    global.css     Design system and responsive layout
public/
  images/          Optimized photos, posters, brand assets
  fonts/           Self-hosted WOFF2 + OFL licenses
  scripts/         boot.js + site.js (menu, countdown, lightbox, copy)
  calendar/        Generated .ics files
  manifest.webmanifest
sites/
  worker.generated.js  Built Worker: static assets + headers + 404 (gitignored)
deploy.json            Deployment manifest for Freebuff Sites / Cloudflare
scripts/
  optimize_images.py   Source-to-WebP pipeline (local only)
  make_calendar.mjs    RFC 5545 calendar generator
  postbuild.mjs        robots.txt, _headers, CSP hashes, cache rules
  make_worker.mjs      Generates the Cloudflare Worker entrypoint for deploy.json
  site-url.mjs         Single source of truth for SITE_URL
  qa.mjs               Static QA
  verify-build.mjs     Metadata/sitemap/manifest/CSP build checks
  browser-qa.mjs       Puppeteer interaction/layout checks
  csp-check.mjs        Production-CSP simulation
```

## Updating facts

The rule for this project: **do not invent business details**. Dates, fees,
prizes, prices, names and venues come from the club's posters or the club's own
messages. If a detail is not verified, the page says to ask the club rather than
guessing.

1. Edit `src/data/site.ts` for events, weekly details, merch, team and partners.
2. Edit `src/data/images.ts` for photo paths, `alt` text and captions.
3. If an event date/time/fee changes, also update `scripts/make_calendar.mjs`
   (the calendar generator has its own small event list) and run `npm run build`.
4. Mark completed events `status: 'past'` and future ones `status: 'upcoming'`.
   The site is static; statuses do not flip automatically after the date.
5. Run `npm run check`, `npm run build`, `npm run qa`, `npm run qa:browser` and
   `npm run qa:csp`.

### Deployment URL

`SITE_URL` controls canonical links, Open Graph URLs, the sitemap, `robots.txt`
and the calendar links. It defaults to the live production URL in
[`scripts/site-url.mjs`](scripts/site-url.mjs):

```powershell
$env:SITE_URL = "https://your-final-domain.example"
npm run build
```

Build with the final URL **before** deploying. The default is the current live
host, `https://chessunited.pages.dev`; change it in one place —
`scripts/site-url.mjs` — when a club domain is connected.

## Deployment

The site is **live** on Cloudflare Pages: <https://chessunited.pages.dev>

```powershell
npm run check; npm run build; npm run qa; npm run qa:csp
npx wrangler pages deploy dist --project-name chessunited --branch main --commit-dirty=true
```

The same `dist/` is also published to Freebuff Sites via the manifest in
[`deploy.json`](deploy.json).
`scripts/make_worker.mjs` generates `sites/worker.generated.js`, which serves the
static files, applies the CSP/cache headers from `dist/_headers`, and returns the
custom 404 page with a real 404 status. See `DEPLOYMENT.md` for the redeploy and
rollback steps, and `DOMAIN_SETUP.md` for connecting a club domain.

## Testing and security notes

- `npm audit` reports **0 vulnerabilities** (production and full tree).
- CSP is generated from the actual inline JSON-LD blocks in the build; the
  `script-src` directive has no `'unsafe-inline'`. `style-src` allows inline
  styles because the design uses style attributes; there are no inline event
  handlers. The only allow-listed third-party host is
  `https://static.cloudflareinsights.com`, because the Cloudflare host injects
  its cookieless analytics beacon into HTML responses; the footer states “no
  cookies, no personal tracking” accordingly.
- `astro preview` does **not** apply Cloudflare's `_headers` file. Use
  `npm run qa:csp` to test the real CSP locally.
- The 404 page intentionally has no canonical URL and is `noindex, nofollow`;
  Lighthouse SEO will report the expected `is-crawlable` failure there.
- External Messenger and Google Maps links open in a new tab with
  `rel="noopener"`; all asset requests are same-origin.
- Motion: the hero and grouped content have staged entrances, buttons sweep and
  cards lift, and countdown digits pop on each change. Reveals are transform-only
  (no opacity fades), so text is always at full contrast; every animation is
  disabled under `prefers-reduced-motion: reduce`.
- Brand palette: `--azure` `#4bbced`, `--red` `#c92929` and `--gold` `#f7e42e`
  are the club's exact brand values and live only in the token block at the top of
  `src/styles/global.css`. Blue leads (primary buttons, accents), red supports
  (details band, secondary actions) and yellow is kept to small highlights.
  `--azure-ink` and `--red-ink` are darker, text-safe shades derived from those
  hues so small copy stays above 4.5:1 on cream.
- No secrets, tokens or `.env` files belong in this repository.

## Documentation

| File | Contents |
| --- | --- |
| `PROJECT_PLAN.md` | Goals, verified facts, architecture, milestones |
| `ASSET_INVENTORY.md` | All 27 supplied files, derivatives, usage, licensing |
| `DEPLOYMENT.md` | Cloudflare Pages deployment runbook |
| `DOMAIN_SETUP.md` | Spaceship → Cloudflare DNS runbook |
| `QA_REPORT.md` | Actual test results, live verification and Lighthouse measurements |
| `COSTS.md` | Known costs, free-tier assumptions, what is not purchased |
| `research/SOURCE_NOTES.md` | Verbatim transcription of the source posters |
| `research/image-manifest.json` | Machine-readable source → output image map |

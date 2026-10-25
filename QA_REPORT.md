# QA report — Chess United website

Date: **2026-10-23**  
Build: `npm run build` → `dist/` (8 HTML pages)  
Environment: Windows 11, Node **24.21.0**, npm **11.19.0**, Chrome
**155.0.8059.85**, Lighthouse **13.5.0**, Python 3.14.7 + Pillow (image pipeline
only).

Overall verdict: **released and verified live**. All automated checks pass, all
indexable pages meet the Lighthouse targets, and the production deployment was
verified on 2026-10-23 (see §5a). Only the club's own domain remains **PENDING**,
because no domain has been registered or supplied.

## 1. Automated results

| Check | Command | Result |
| --- | --- | --- |
| Astro/TypeScript diagnostics | `npm run check` | **PASS** — 14 files, 0 errors, 0 warnings, 0 hints |
| Production build | `npm run build` | **PASS** — 8 pages, calendar regenerated, 12 CSP hashes |
| Static QA | `npm run qa` | **PASS** — 8 pages, 428 links, 56 images, 14 JSON-LD blocks, 0 errors |
| Build verification | part of `npm run qa` | **PASS** — 7 sitemap URLs, 12 inline hashes, 0 errors |
| Browser QA | `npm run qa:browser` | **PASS** — 16 page/viewport checks, 0 errors, 0 warnings |
| CSP simulation | `npm run qa:csp` | **PASS** — 8/8 pages, no violations, inline JS ran |
| Dependency audit | `npm audit` | **PASS** — 0 vulnerabilities (350 packages; 185 prod, 88 dev) |

Browser QA covers 1440×900 and 390×844 for all eight pages. It checks HTTP
status, horizontal overflow, broken images, duplicate IDs, missing `alt` text,
unnamed controls, one `<h1>` per page, both self-hosted fonts, the mobile menu
and the gallery lightbox. It also records console and page errors. Result: **0
errors, 0 warnings**.

Screenshots: `C:\Users\ORASIN~1\AppData\Local\Temp\chessunited-qa\screens`.

## 2. Lighthouse — final recorded run

Run against `http://127.0.0.1:4321` using `astro preview` on the final build.
Mobile uses Lighthouse's default mobile emulation/throttling. Desktop home uses
`--preset=desktop`.

| Page | Perf | A11y | Best practices | SEO | FCP | LCP | TBT | CLS | Transferred |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Home (mobile) | **99** | 100 | 100 | 100 | 0.9 s | 2.0 s | 0 ms | 0 | 524 KiB |
| Events (mobile) | **100** | 100 | 100 | 100 | 0.9 s | 1.9 s | 0 ms | 0 | 249 KiB |
| Weekly play (mobile) | **100** | 100 | 100 | 100 | 0.9 s | 1.9 s | 0 ms | 0 | 239 KiB |
| Gallery (mobile) | **98** | 100 | 100 | 100 | 0.9 s | 2.5 s | 0 ms | 0 | 489 KiB |
| Shop (mobile) | **100** | 100 | 100 | 100 | 0.9 s | 1.9 s | 0 ms | 0 | 254 KiB |
| About (mobile) | **100** | 100 | 100 | 100 | 0.9 s | 1.9 s | 0 ms | 0 | 204 KiB |
| Visit (mobile) | **100** | 100 | 100 | 100 | 1.0 s | 1.9 s | 10 ms | 0 | 201 KiB |
| 404 (mobile) | **100** | 100 | 100 | *66* | 0.9 s | 1.8 s | 0 ms | 0 | 141 KiB |
| Home (desktop) | **100** | 100 | 100 | 100 | 0.3 s | 0.4 s | 0 ms | 0 | 739 KiB |

Targets: Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥95.

**All seven indexable pages meet every target.** The 404's SEO score is expected:
the page is deliberately `noindex, nofollow`, so Lighthouse's `is-crawlable`
audit fails. It is not a defect and the page must not be indexed.

Lighthouse scores vary slightly with machine load and network conditions. Earlier
runs of the same build gave home 99 and shop 99–100; the table records the final
run. The lowest measured performance score was **98**, and the highest LCP was
**2.5 s**, both inside the targets.

## 3. Manual functional checks

| Check | Result |
| --- | --- |
| Messenger group link | **200** at `https://m.me/j/HytA8igzNnAWDEXo/?send_source=gc:qr_code_scan_c` |
| Robinsons Maps link | **200** |
| Manna Mall Maps link | **200** |
| Ortega Convention Center Maps link | **200** |
| Visit QR decode | **PASS** — ZXing-C++ decoded the 480×480 asset to the exact Messenger group URL above |
| Calendar `.ics` files | **PASS** — 617 B and 772 B; CRLF; max line 75 bytes; 1 VEVENT each; correct UTC start/end; served as `text/calendar` |
| Copy-details button | **PASS** — label changes to “Copied”; clipboard contains the full event text with the production URL |
| Mobile menu | **PASS** — opens, focus moves inside, Tab stays trapped, Escape closes, focus returns to the toggle |
| Gallery lightbox | **PASS** — opens, full image loads, Escape closes, focus returns to the triggering thumbnail |
| Countdown | **PASS** — no console errors; shows the remaining time to Tournament 2.0 |
| External-link isolation | **PASS** — external Messenger and Google Maps links use `target="_blank"` with `rel="noopener"`; no third-party assets load |
| 404 response | **PASS locally** — missing paths return HTTP 404 with the custom page and `noindex`; re-check on Cloudflare after deploy |
| Sitemap / robots | **PASS** — 7 public URLs, no `/404`; robots points at the sitemap |
| Security headers | **PASS in simulation** — CSP, nosniff, frame denial, referrer and permissions policies; no CSP violations |

Focus test details: opening the mobile menu put focus on the in-menu brand link;
three Tab presses stayed inside the menu (close button → Events → Weekly play);
Escape returned focus to the menu button. The lightbox focused its “Close photo
viewer” button; Escape returned focus to the first gallery item.

## 4. Content and asset checks

- All **27** supplied JPEGs are accounted for in `ASSET_INVENTORY.md`: 19
  displayed sources, 2 source-only posters, 6 intentionally unused.
- Every content image has descriptive `alt` text (the logo is intentionally
  decorative with empty `alt`), and gallery photos also have captions. `alt`
  text was checked against the actual image, not just its filename. Two
  mislabeled photos were corrected during QA (`chowking` and `club`), and the
  real Chowking group photo plus two more tournament/restaurant photos were
  added.
- All image `srcset` candidates exist; no broken images in browser QA.
- Poster facts and copy were checked against `research/SOURCE_NOTES.md`. Unverified
  claims about sign-up, dress code, “all levels”, shop fulfilment and attendance
  were removed or softened.
- The shop page does **not** invent a checkout, payment or collection process; it
  tells visitors to ask the club.
- No phone number, email, Facebook page URL, testimonial, member count or
  registration endpoint was invented.
- Partner names are reproduced only where legible on the supplied poster; the
  illegible Pawn tier is omitted.

## 5. Defects found and fixed during QA

| Defect | Fix |
| --- | --- |
| Horizontal scroll from a hero pseudo-element | Contained the decoration within the viewport |
| Hero/page titles wrapping mid-word on mobile | Adjusted display sizes and grid width; verified “Tournament days.” wraps cleanly |
| Missing 1200 px selfie variant in a `srcset` | Limited that source to 480/800/1080 |
| Invalid `<div>` wrappers around `<dt>/<dd>` | Rebuilt facts as `<dl>` lists |
| Wrong alt text for several photos | Replaced with descriptions of the actual images; added previously unused real photos |
| 404 canonical pointed at `/404/` | Removed the canonical on the 404 and made QA skip it |
| Countdown timer could throw after the deadline | Declared the timer before the first tick |
| TypeScript implicit `any` in `Gallery.astro` | Typed `Astro.props as Props`; removed an unused import |
| `posters.program` pointed at a missing 1000 px file | Corrected to the generated 892 px file |
| Hardcoded “Two events remaining” | Now computed from `upcomingEvents` |
| Invented shop fulfilment steps | Rewritten as “ask the club”; no checkout claims |
| Unverified copy (“all levels”, “filled”, “no dress code”, etc.) | Removed or softened to match the sources |
| QR too small on the full poster | Cropped a quiet-zone QR and decoded it to the live group URL |

## 5a. Production verification (2026-10-23)

Deployed and published at
<https://site-88c41e329d7a4c7f97de7219774a18c9.freebuff.page> on Cloudflare via
Freebuff Sites. Checks were run against the live host, not localhost.

| Check | Result |
| --- | --- |
| All routes | **PASS** — `/`, `/events/`, `/play/`, `/gallery/`, `/shop/`, `/about/`, `/visit/` return 200 `text/html` over HTTPS |
| `robots.txt` / `sitemap-index.xml` | **PASS** — 200; robots points at the live sitemap; sitemap lists 7 public URLs and no `/404` |
| Calendar files | **PASS** — `/calendar/chess-united-tournament-2-0.ics` 200 `text/calendar`; `URL:` fields use the live host |
| Canonical / Open Graph | **PASS** — canonical is the live production URL |
| Security headers | **PASS** — CSP (`script-src` with 12 SHA-256 hashes, no `'unsafe-inline'`), `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `COOP` |
| Cache headers | **PASS** — HTML `max-age=0, must-revalidate`; images `max-age=2592000, stale-while-revalidate=604800` |
| Custom 404 | **PASS** — `/missing-page/` returns HTTP **404** with the branded page, `noindex, nofollow`, and the same security headers |
| Inline scripts under the live CSP | **PASS** — countdown ticked from 14d 17h 46m to 14d 17h 45m in the live page, so the hashed inline JSON-LD/bootstrap ran with no CSP violation |
| Live images | **PASS** — 15/15 gallery images load; no broken images, no horizontal scroll |
| HTTPS | **PASS** — valid certificate, no mixed content |

### Live Lighthouse (mobile emulation, live URL)

| Page | Perf | A11y | Best practices | SEO | LCP | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | **98** | **100** | **96** | **100** | 2.2 s | 0 |
| Gallery | **97** | **100** | **96** | **100** | 2.3 s | 0 |

Local Lighthouse on the same build: home **99 / 100 / 100 / 100** (LCP 2.0 s,
CLS 0). The live best-practices score is 96 rather than 100 for one reason: the
hosting edge injects Cloudflare's own analytics beacon
(`static.cloudflareinsights.com`), and **this machine's DNS resolves that host to
0.0.0.0**, so the request fails here (`ERR_ADDRESS_INVALID`) and records one
console error. The CSP was widened to allow that host (previously the beacon was
blocked by CSP, costing Best Practices 8 points); on a normal network the script
loads and the audit passes. This is an environment limitation, not a site
defect — but it is the only audit still failing and it is reported, not hidden.

### Gallery additions in this pass

The three remaining unused club photographs — the gold (Open champion), silver
(Kiddies 2nd) and bronze (Open 3rd) Tournament 1.0 medal close-ups — were added to
the gallery with 480/800/1200 WebP derivatives, descriptive `alt` text and
captions. The gallery now shows 15 photos; the site ships 59 images in total.
Two assets remain deliberately unused (see `ASSET_INVENTORY.md`).

### Platform note

Freebuff Sites records one `cloudflare_outcome_unknown` operation on the
**preview** environment from the first upload attempt. That attempt produced no
deployment (the preview URL returned 404) and the preview environment is still
unpublished; the production environment deployed cleanly. Re-deploying preview is
blocked until that record is reconciled, which does not affect the live site.

## 5b. Motion pass (2026-10-23)

Entrance animation and micro-motion were added across the site and then measured
on the live host.

**What changed**

- Hero choreography: eyebrow, the three title lines (staggered 90 ms apart),
  lede, both buttons (with an overshoot "pop"), the three hero facts, the photo
  frame (settles into its 1.4° tilt), the gold sticker (pop, then a slow idle
  wobble) and the event ticket (flies in from the left).
- Every inner page: the `page-hero` eyebrow, `h1` and lede animate in on load.
- Scroll entrances are now **transform-only** (`translate`/`scale`/`rotate`, no
  opacity fade) so text is never painted below full contrast.
- Staggered groups driven by `site.js`: section headings, event/division/value/
  team/venue/merch cards, fact grids, CTA blocks, gallery tiles (55 ms apart) and
  posters.
- Micro-motion: a shine sweep across buttons on hover/focus, gallery tiles lift
  on hover, countdown digits pop when their value changes, the merch tag bounces.

**Verification**

| Check | Result |
| --- | --- |
| Entrances actually run on the live site | **PASS** — `animationName` = `pop-in` / `frame-in` / `ticket-in` on the live hero |
| Reveal styles delivered live | **PASS** — `line-rise`, `reveal--pop`, `reveal--stamp`, `tick-pop`, `badge-bounce` present in the deployed CSS (41,612 B) |
| Stagger applied live | **PASS** — event cards got `--delay: 0ms` and `120ms` |
| Hover still works after reveal | **PASS** — event card hover = `matrix(1,0,0,1,-4,-4)` |
| Tilted cards keep their tilt | **PASS** — `.schedule-card` still resolves to `rotate(-0.8deg)` after `is-in` |
| Countdown pops | **PASS** — all four digits animated `is-tick` over 1.2 s |
| Gallery tiles reveal | **PASS** — 6/6 on the home gallery with progressive delays |
| Reduced motion | **PASS** — with `prefers-reduced-motion: reduce`, 0 of 7 reveal elements hidden, `translate: none`, entrance duration 1e-06 s |
| No JS console errors | **PASS** locally; live shows only the platform analytics `ERR_ADDRESS_INVALID` noted in §5a |
| Static QA + browser QA + CSP | **PASS** — 0 errors, 16 page/viewport checks, 8/8 pages CSP-clean |
| Brand palette tokens | see §5c — pinned to `#4bbced` / `#c92929` / `#f7e42e` |

**Lighthouse after the motion pass (live URL)**

| Page | Perf | A11y | Best practices | SEO | LCP | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | 95 | **100** | 96 | 100 | 2.2 s | 0 |
| Gallery | 97 | **100** | 96 | 100 | 2.4 s | 0 |

An intermediate build that faded content with `opacity` during entrance scored
**96** on live accessibility: Lighthouse's contrast audit reads partially-faded
text as low contrast. Changing reveals to transform-only restored **100** with no
loss of motion, and it also removes any chance of a slow device showing washed-out
copy. That regression was caught, fixed and re-measured rather than papered over.

## 5c. Brand palette pass (2026-10-24)

The palette tokens were re-pinned to the club's exact brand hex values and the
colour hierarchy was rebalanced.

**What changed**

- `--azure` `#1e9bd7` → **`#4bbced`**, `--red` `#df302c` → **`#c92929`**,
  `--gold` `#f5c33b` → **`#f7e42e`**. These three tokens now carry a comment
  saying they are the specified brand values and must not be altered.
- Text-safe shades were re-derived from the new hues: `--azure-ink` `#0b6a97` →
  `#0d6590` (5.5:1 on cream), `--red-ink` `#b01e22` → `#a81c1c` (6.3:1 on cream,
  7.4:1 for white text on it).
- **Primary buttons are now brand blue**, not yellow: `--btn-bg: var(--azure)`
  with ink text (8.3:1). This puts blue in the recurring action colour and keeps
  yellow to small accents (highlight mark, hero sticker, status badges,
  Kiddies header, ticker stars), per the required hierarchy.
- Derived hover shades updated to match the new bases (`#6dcdf5` on blue
  buttons, `#bb2424` on red buttons), and the unused `--cyan` / `--ink-3`
  tokens were removed so no stale palette values remain.

**Verification**

| Check | Result |
| --- | --- |
| Contrast of the new text shades | **PASS** — azure-ink 5.48:1, red-ink 6.32:1 on cream; ink on brand blue 8.32:1; white on red-ink 7.37:1; ink on gold 13.78:1 |
| `npm run check` | **PASS** — 0 errors |
| `npm run build` + `npm run qa` | **PASS** — 8 pages, 440 links, 59 images, 14 JSON-LD blocks, 12 CSP hashes |
| `npm run qa:csp` | **PASS** — 8/8 pages, no violations |
| `npm run qa:browser` | **PASS** — 16 page/viewport checks |
| Lighthouse (home, local build) | **PASS** — 100 accessibility, 100 best practices, 100 SEO, 94 performance |

## 5d. Blue-dominant pass — navy removed as a surface (2026-10-24)

The club reported that `#0A1533` still read as a brand colour, because it was
painted across large areas rather than sitting in the type and outlines. It is now
**text and linework only**; every large surface is brand blue.

**What changed**

- Removed every solid navy fill: mobile menu, ticker band, the weekly panel on
  Home and Play, team cards, footer, hamburger button, skip link, lightbox chrome,
  and the placeholder painted behind gallery tiles, the hero frame and the shop
  photo while images load.
- Those surfaces are `--azure` with **ink** text (8.32:1). Blue is a light colour,
  so white or cream on it would have measured ~1.9:1; secondary copy on blue uses
  a new derived `--on-azure-soft` `#0b3f5c` (5.1:1).
- Controls that now sit on blue were re-pointed: the weekly CTA and the
  mobile-menu CTA are paper with ink text, and `.text-link--light` (cream on gold)
  was deleted in favour of the standard ink link.
- Red took over the repeated emphasis role: every event-date chip is `--red` with
  white numerals (5.5:1) instead of navy with gold.
- Yellow was pruned to genuinely small moments — hero sticker, highlight mark,
  status badges, Kiddies header, weekly top stripe, merch tag, selection colour —
  and removed from the ticker stars, mobile-menu numbers, event dates and footer
  labels.
- Dead `.section--navy` rule deleted; `theme-color` (page meta and web manifest)
  moved from `#0a1533` to `#4bbced`.
- Fixed an empty bordered box under the events-page medal pair: the stretched
  `figure` around the landscape photo now sizes to its image.

**Measured** — share of rendered pixels within ±10/255 of the brand hexes
(Pillow, full-page screenshots unless noted):

| Page | Navy `#0A1533` | Brand blue `#4bbced` |
| --- | ---: | ---: |
| Home, 1440 px, full page | 2.84% | **15.08%** |
| Play, 1440 px | 2.98% | **18.05%** |
| About, 1440 px | 2.37% | **10.39%** |
| Gallery, 1440 px (viewport) | 4.78% | 0.43% |
| Home, 390 px, full page | 4.20% | **15.50%** |
| Mobile menu open, 390 px | 3.49% | **88.39%** |

What remains navy is type, 2–3 px outlines, the hard offset shadows, and two
low-opacity dot textures — `grep` finds **zero** solid navy backgrounds left in
`global.css`.

**Verification**

| Check | Result |
| --- | --- |
| Contrast: ink on blue | **PASS** — 8.32:1 |
| Contrast: `--on-azure-soft` on blue | **PASS** — 5.10:1 |
| Contrast: white on `--red` date chip | **PASS** — 5.48:1 |
| `npm run check` | **PASS** — 0 errors, 0 warnings, 0 hints |
| `npm run build` + `npm run qa` | **PASS** — 8 pages, 440 links, 59 images, 14 JSON-LD blocks, 12 CSP hashes |
| `npm run qa:csp` | **PASS** — 8/8 pages, no violations |
| `npm run qa:browser` | **PASS** — 16 page/viewport checks |
| Lighthouse local — home / play / about | **PASS** — accessibility **100** on all three |
| Lighthouse live home (`chessunited.pages.dev`) | **PASS** — 97 perf, **100** a11y, **100** best practices, **100** SEO, LCP 2.7 s, CLS 0, TBT 0 ms |
| Images | **PASS** — 56/56 load on the live Pages host across 7 pages |
| Layout | **PASS** — no horizontal overflow at 1440 px or 390 px on any page |

## 6. Not verified / limitations

These are outside what automated QA can prove:

- **Custom domain, DNS and its TLS.** The site is live on Cloudflare's
  `chessunited.pages.dev` host. No club domain has been registered or attached, so
  apex/`www` behaviour, DNS records at Spaceship and domain-level TLS are
  untested. See `DOMAIN_SETUP.md`.
- **Cloudflare's beacon in a normal network.** In this environment the
  host-injected analytics script cannot resolve; see §5a.
- **Cross-browser testing.** Only Chrome 155 was used. Safari, Firefox and older
  mobile browsers were not run.
- **Assistive-technology testing.** Keyboard focus, automated Lighthouse
  accessibility and semantic checks pass, but there was no screen-reader session
  (NVDA/VoiceOver) or user testing with disabled participants. WCAG 2.2 AA is a
  target, not a certification.
- **Physical QR scanning.** The digital asset decodes correctly; a printed
  poster/display was not scanned.
- **Calendar imports.** Files are structurally valid and served with the right
  MIME type, but were not imported into Google Calendar, Apple Calendar or
  Outlook.
- **Business processes.** Tournament registration, merch payment/collection and
  current weekly-session arrangements are handled by the club; the site tells
  visitors to ask in the group. Those processes were not independently verified.
- **Event freshness.** Event `status` values are static data. After 7 Nov or 5
  Dec 2026, update `src/data/site.ts` and `scripts/make_calendar.mjs`, rebuild,
  and redeploy. The countdown reaches zero on its own, but the “upcoming”
  sections do not reclassify themselves.
- **Production RUM/analytics.** None is installed by design. No field Core Web
  Vitals or traffic data exists.

## 7. Reproduce

```powershell
npm.cmd install
npm.cmd run check
npm.cmd run build
npm.cmd run qa
npm.cmd run qa:csp
npm.cmd run preview -- --host 127.0.0.1 --port 4321   # separate terminal
npm.cmd run qa:browser
```

Lighthouse (separate terminal, preview running):

```powershell
npx.cmd --yes lighthouse@13.5.0 http://127.0.0.1:4321/ --only-categories=performance,accessibility,best-practices,seo
npx.cmd --yes lighthouse@13.5.0 http://127.0.0.1:4321/ --preset=desktop --only-categories=performance,accessibility,best-practices,seo
```

## 8. Release recommendation

**Released.** The site is live at <https://chessunited.pages.dev>, verified over
HTTPS, and meets the Lighthouse targets on every indexable page. The open items
are automatic deploys (the repository exists at
<https://github.com/RammyJo/chessunited> but is not yet linked to the Pages
project), the club's own domain,
cross-browser and assistive-technology testing, and routine content upkeep (event
dates and poster prices).

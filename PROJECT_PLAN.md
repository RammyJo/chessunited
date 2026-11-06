# Chess United — Project Plan

## 1. What this is

A public marketing site for **Chess United**, a community chess club in San Fernando
City, La Union, Philippines. The club runs weekly Saturday chess at Robinsons Mall
La Union and organises age-division tournaments with cash prizes.

The site's job:

1. Tell a first-time visitor that chess happens here every week and they are welcome.
2. Publish the upcoming tournaments with accurate dates, venues, divisions and prizes.
3. Show the real community through real photographs.
4. Let people join the club's Messenger community and find the next session.
5. Present official merchandise and its prices.

## 2. Verified facts (source: supplied posters)

| Fact | Value |
| --- | --- |
| Weekly session | Every Saturday, 10:00 AM – 2:00 PM |
| Weekly venue | Robinsons Mall La Union |
| Tagline | "Chess for everyone" |
| Tournament 1.0 | Sat 17 Oct 2026, Rovers Coffee, Carlatan, San Fernando |
| Tournament 2.0 | Sat 7 Nov 2026, Manna Mall, San Fernando |
| Super Mario Cup | Sat 5 Dec 2026, Ortega Convention Center, San Fernando |
| Divisions | Open (13 & above), Kiddies (12 & below) |
| President | Yel Romero |
| Vice President | Elito Batulan |
| MC | Ricky Shetty |
| Community group | CHESS UNITED – REGION 1 NETWORK (Messenger) |

All prize amounts, registration fees, merchandise prices and partner names come from
the club's own posters. See `research/SOURCE_NOTES.md` for the full transcription.

## 3. Assumptions (documented, reversible)

- The club wanted a public informational site first, and the registration and order
  paths were added later on the club's own Cloudflare account. They are real: the
  forms write to a D1 database an officer reviews in `/admin/`. There is no online
  payment — GCash stays a manual transfer the buyer makes outside the site, and the
  reference number is only a claim the club checks by hand.
- "Chess for everyone" is the club's own tagline, used as the site's positioning.
- Robinsons Mall La Union is treated as the recurring weekly venue; the club should
  correct this page if the venue changes.
- Tournament details are as printed. The site labels them as published details and
  points visitors to the community group for changes. Event `status` is manual;
  the site is static and does not reclassify events by date.
- The shop publishes the club's printed prices and takes orders on the club's behalf;
  it does not take payment. The club confirms the shipping fee, matches the GCash
  reference, then ships. Product photos are added as the club supplies them.
- The gallery includes Tournament 1.0 plus a small number of real club-life
  photos (Chowking, restaurant, banner selfie). It is labelled accordingly.
- No third-party analytics cookies are added. Cloudflare's own cookieless beacon may
  be injected by the host, and is stated in the footer. The only cookie this project
  sets is the officer-only `cu_admin` session cookie on `/admin/`.

## 4. Site structure

```
/                 Home — positioning, next events, weekly session, gallery, shop, partners
/events/          Tournament 2.0, Super Mario Cup, Tournament 1.0 recap, weekly session
/gallery/         Real club photography with lightbox
/shop/            Merchandise catalogue with a cart, and the order form
/about/           The club, leadership, partners and sponsors
/visit/           Weekly chess, venue, map links, joining the group, event-day checklist
/membership/      Online registration and the printable digital membership card
/partners/        Partner-club directory and club intake form
/admin/           Officer queue for members, registrations and orders (noindex, cookie-gated)
/404              Custom not-found page
```

## 5. Design direction

**"Club poster, not corporate template."**

- Palette pinned to the club's three brand colours — primary blue `#4bbced`,
  secondary red `#c92929`, accent yellow `#f7e42e` — over a deep-navy ink on pale
  azure surfaces. Blue leads, red supports, yellow is limited to small highlights.
  Text-safe shades (`--azure-ink`, `--red-ink`) are derived from the brand hues
  so small copy stays above 4.5:1.
- Display type: Archivo Black (poster-weight), body: Manrope. Both self-hosted.
- Checkerboard motifs, hard 2px rules, offset "print" shadows, ticket notches.
- Photography is the hero: real tournament tables, real medals, real faces.
- Restrained motion: reveal-on-scroll, marquee, hover lift; all disabled for
  `prefers-reduced-motion`.
- Layout is asymmetric and editorial on desktop; single column, large touch targets
  and a full-screen menu on mobile.

## 6. Technical plan

- Astro **7.4.2** static output, zero UI framework, a handful of small vanilla JS
  files in `public/scripts/` (`boot`, `site`, `forms`, `cart`, `admin`). Pages are
  prerendered; the cart and the forms stay usable with the markup as the source of
  truth and JS only improving it.
- Content lives in `src/data/site.ts` so dates, prizes and prices are edited in one place;
  image paths, srcsets, alt text and captions live in `src/data/images.ts`.
- Merchandise prices are duplicated on purpose: `src/data/site.ts` renders the shop,
  `functions/api/_catalog.js` is what the club is actually charged by, because the
  server never trusts a price sent from the browser.
- All images pre-optimised to responsive WebP with Pillow; originals untouched. The
  site displays 22 unique supplied sources (15 photos, 6 poster sources, logo).
  Product photos live in `public/images/merch/<product-id>.webp` and each one used by
  the shop is listed in `merchPhotos` in `src/data/images.ts`.
- Self-hosted fonts, preloaded; the only outbound requests are the club's own
  Messenger and Google Maps links and, at most, the Cloudflare host's cookieless
  analytics beacon.
- SEO: per-page metadata, canonical URLs, Open Graph/Twitter cards, JSON-LD
  (`SportsClub`, `WebSite`, `SportsEvent`, `BreadcrumbList`, `FAQPage`), sitemap,
  robots, custom 404.
- Accessibility: WCAG 2.2 AA target, skip link, keyboard lightbox/menu, focus trap,
  focus return, visible focus, reduced motion, semantic landmarks, descriptive alt text.
  The cart drawer traps focus, closes on Escape and returns focus to its opener, and
  announces quantity changes through a live region.
- Security: Cloudflare `_headers`, SHA-256 CSP hashes for inline JSON-LD, no
  `'unsafe-inline'` for scripts, no third-party cookies. Form input is validated and
  length-capped on the server, `/admin/` is behind an HMAC-signed HttpOnly
  SameSite=Strict cookie with a constant-time compare, and no card data is collected.
- Calendar `.ics` files generated by a small Node script on every build, so URLs
  follow `SITE_URL`; no Python required to build.
- Hosting: Cloudflare Pages — static output plus Pages Functions (`functions/api/`)
  bound to the D1 database `chess-united`. The club's domain and Cloudflare account
  access are external dependencies (see `DEPLOYMENT.md`, `DOMAIN_SETUP.md`).

## 7. Milestones and acceptance criteria

| # | Milestone | Done when | Status |
| --- | --- | --- | --- |
| 1 | Discovery and asset analysis | Sources transcribed; assets inventoried | **VERIFIED** — `research/SOURCE_NOTES.md`, `ASSET_INVENTORY.md` |
| 2 | Strategy and architecture | Sitemap, copy facts, design system defined | **VERIFIED** |
| 3 | Design and implementation | All pages built, responsive, real content | **VERIFIED** |
| 4 | Functional completion | Nav, menu, countdown, calendar, lightbox, copy, group links work | **VERIFIED** — browser + manual checks |
| 5 | SEO, a11y, security, performance | Metadata, JSON-LD, sitemap, headers, budgets met | **VERIFIED** — Lighthouse targets met |
| 6 | Testing | Build, type check, link crawl, browser QA desktop + mobile, CSP | **VERIFIED** — see `QA_REPORT.md` |
| 7 | Cloudflare deployment | Site published and reachable over HTTPS | **VERIFIED** — Cloudflare Pages project `chessunited`, direct upload, live |
| 8 | Club domain / DNS | Apex resolves and is canonical | **PARTLY** — `chessunitedglobal.com` is live and canonical; `www` has no DNS record and does not resolve |
| 9 | Production verification | Live URL, headers, 404, Lighthouse | **VERIFIED** on the club domain (2026-11-04) |
| 10 | Working forms and officer queue | Registrations, orders and memberships reach a database an officer can act on | **VERIFIED LIVE** — Functions respond on the domain and the D1 binding is connected; no records had been submitted at the 2026-11-04 check |
| 11 | Online shop | Catalogue, cart and order form | **BUILT 2026-11-05** — product grid, cart drawer and checkout; awaiting a build/preview pass and the club's product photos |

## 8. Delivery status

The site is **live** at <https://chessunitedglobal.com> on Cloudflare Pages, with
HTTPS, security headers, a custom 404, the sitemap, the calendar files and the
`/api/` Functions verified on the real host. The source is pushed to
<https://github.com/RammyJo/chessunited> on `main`.

- **VERIFIED:** build, type check, static links/anchors, image variants, alt text,
  metadata, JSON-LD, sitemap/robots, calendar files, copy button, QR decode,
  mobile-menu focus trap, lightbox focus return, CSP simulation, live deployment,
  live headers/404/canonical, Lighthouse (local and live), live 401 on the admin
  queue.
- **PENDING:** `www` DNS and redirect, the stale Freebuff mirror, connecting the
  repository to Pages so a push deploys, cross-browser and screen-reader testing,
  calendar-import testing, and the first end-to-end order through the shop cart on a
  real build.
- **MANUAL MAINTENANCE:** event statuses and dates, calendar data, the duplicated
  merchandise price list (`src/data/site.ts` and `functions/api/_catalog.js`), and
  any poster change require editing the data files, rebuilding and redeploying.

## 9. Out of scope / not claimed

- No invented history, member counts, rankings, testimonials, or results.
- No online payment. The shop quotes the club's printed prices, collects a GCash
  reference number as a claim, and the club matches it by hand before shipping.
- No custom email address (none supplied).
- No member accounts or logins for the public — the card lookup is by membership
  number only.

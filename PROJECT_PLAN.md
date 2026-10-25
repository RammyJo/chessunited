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

- The club wants a public informational site, not a booking system. There is no
  verified online registration endpoint, so the site does not invent one. The
  verified Messenger group is the online call to action.
- "Chess for everyone" is the club's own tagline, used as the site's positioning.
- Robinsons Mall La Union is treated as the recurring weekly venue; the club should
  correct this page if the venue changes.
- Tournament details are as printed. The site labels them as published details and
  points visitors to the community group for changes. Event `status` is manual;
  the site is static and does not reclassify events by date.
- The shop is a price list, not a store. It does not take orders, payments or
  promise a collection process; visitors are told to ask the club.
- The gallery includes Tournament 1.0 plus a small number of real club-life
  photos (Chowking, restaurant, banner selfie). It is labelled accordingly.
- No analytics, cookies, accounts, payments, or personal data collection are added.

## 4. Site structure

```
/                 Home — positioning, next events, weekly session, gallery, shop, partners
/events/          Tournament 2.0, Super Mario Cup, Tournament 1.0 recap, weekly session
/play/            Weekly chess: schedule, what to expect, divisions, FAQ
/gallery/         Real club photography with lightbox
/shop/            Official merchandise price list and how to ask the club
/about/           The club, leadership, partners and sponsors
/visit/           Venue, map links, joining the group, event-day checklist
/404              Custom not-found page
```

## 5. Design direction

**"Club poster, not corporate template."**

- Palette pinned to the club's three brand colours — primary blue `#4bbced`,
  secondary red `#c92929`, accent yellow `#f7e42e` — over a deep-navy/cream
  neutral base. Blue leads, red supports, yellow is limited to small highlights.
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

- Astro **7.4.2** static output, zero UI framework, one small vanilla JS file.
- Content lives in `src/data/site.ts` so dates, prizes and prices are edited in one place;
  image paths, srcsets, alt text and captions live in `src/data/images.ts`.
- All images pre-optimised to responsive WebP with Pillow; originals untouched. The
  site displays 22 unique supplied sources (15 photos, 6 poster sources, logo).
- Self-hosted fonts, preloaded; no third-party requests at runtime.
- SEO: per-page metadata, canonical URLs, Open Graph/Twitter cards, JSON-LD
  (`SportsClub`, `WebSite`, `SportsEvent`, `BreadcrumbList`, `FAQPage`), sitemap,
  robots, custom 404.
- Accessibility: WCAG 2.2 AA target, skip link, keyboard lightbox/menu, focus trap,
  focus return, visible focus, reduced motion, semantic landmarks, descriptive alt text.
- Security: Cloudflare `_headers`, SHA-256 CSP hashes for inline JSON-LD, no
  `'unsafe-inline'` for scripts, no analytics/cookies/forms.
- Calendar `.ics` files generated by a small Node script on every build, so URLs
  follow `SITE_URL`; no Python required to build.
- Hosting: Cloudflare Pages static deployment. Domain and Cloudflare account access
  are external dependencies (see `DEPLOYMENT.md`, `DOMAIN_SETUP.md`).

## 7. Milestones and acceptance criteria

| # | Milestone | Done when | Status |
| --- | --- | --- | --- |
| 1 | Discovery and asset analysis | Sources transcribed; assets inventoried | **VERIFIED** — `research/SOURCE_NOTES.md`, `ASSET_INVENTORY.md` |
| 2 | Strategy and architecture | Sitemap, copy facts, design system defined | **VERIFIED** |
| 3 | Design and implementation | All pages built, responsive, real content | **VERIFIED** |
| 4 | Functional completion | Nav, menu, countdown, calendar, lightbox, copy, group links work | **VERIFIED** — browser + manual checks |
| 5 | SEO, a11y, security, performance | Metadata, JSON-LD, sitemap, headers, budgets met | **VERIFIED** — Lighthouse targets met |
| 6 | Testing | Build, type check, link crawl, browser QA desktop + mobile, CSP | **VERIFIED** — see `QA_REPORT.md` |
| 7 | Cloudflare deployment | Site published and reachable over HTTPS | **VERIFIED** — Cloudflare Pages project `chessunited`, live at <https://chessunited.pages.dev>, 2026-10-24 |
| 8 | Spaceship domain / DNS | Requires domain ownership and permission | **PENDING** — runbook ready, no domain registered |
| 9 | Production verification | Live URL, headers, 404, Lighthouse | **VERIFIED** on the host URL; domain-level checks pending with 8 |

## 8. Delivery status

The site is **live** at <https://chessunited.pages.dev> on Cloudflare Pages, with
HTTPS, security headers, a custom 404, the sitemap and the calendar files verified
on the real host. No domain was purchased and nothing was pushed to a Git remote.

- **VERIFIED:** build, type check, static links/anchors, image variants, alt text,
  metadata, JSON-LD, sitemap/robots, calendar files, copy button, QR decode,
  mobile-menu focus trap, lightbox focus return, CSP simulation, live deployment,
  live headers/404/canonical, Lighthouse (local and live).
- **PENDING:** club domain registration and DNS, domain-level TLS and apex/`www`
  behaviour, cross-browser and screen-reader testing, calendar-import testing.
- **MANUAL MAINTENANCE:** event statuses and dates, calendar data, and any poster
  or price change require editing the data files, rebuilding and redeploying.

## 9. Out of scope / not claimed

- No invented history, member counts, rankings, testimonials, or results.
- No online payment or registration flow.
- No custom email address (none supplied).
- No claim that a domain has been purchased or that Cloudflare is connected until
  evidence exists.

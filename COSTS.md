# Costs

Status: **NO PURCHASES MADE**. Recorded spend to date: **$0.00**. No domain,
hosting plan, email mailbox or paid service has been bought. The site is live on a
free Cloudflare-backed host (Freebuff Sites).

This page separates what is actually free from what is still unknown. It does not
quote a domain price, because no Spaceship checkout was performed and prices vary
by TLD, term, renewal date, promotions and taxes.

## Current cost table

| Item | Status | Cost | Notes |
| --- | --- | ---: | --- |
| Hosting (Cloudflare via Freebuff Sites) | **Live** | $0 | Free hosting tier; the panel shows monthly request/CPU allowances |
| Cloudflare DNS | Not configured (host domain only) | $0 | Comes with the host's domain |
| TLS certificate | **Live** | $0 | Managed by the host |
| Domain registration | **Not purchased** | **Unknown** | Spaceship's checkout price at the chosen TLD/term; renewal may differ |
| Domain renewal | Future | **Unknown** | Set a calendar reminder; do not enable auto-renew without approval |
| Custom email mailbox | Not included | **Unknown** | A domain does not automatically include a mailbox; provider pricing applies |
| Fonts (Archivo Black, Manrope) | In use | $0 | SIL OFL 1.1; license files included |
| Astro, sitemap integration | In use | $0 | Open-source packages |
| Puppeteer, TypeScript, Astro Check | Dev only | $0 | Open-source dev dependencies |
| Python, Pillow | Local image pipeline | $0 | Not a runtime/deployment dependency |
| Analytics | Host-injected Cloudflare beacon | $0 | Cookieless, aggregate; no cookies or personal tracking |
| Forms / database / CMS | Not used | $0 | No form backend, no database |
| Payment processing | Not used | $0 | The shop is a price list; orders go through the club |
| Stock photography | Not used | $0 | All imagery was supplied by the club |
| Paid CDN / image host | Not used | $0 | Images are served from Pages |
| Search Console / Bing | Optional | $0 | Free accounts if the club chooses to verify |

## What the free tier must cover

For this site the hosting workload is small:

- 8 HTML pages, about 6.8 MB of deployed files in total (95 assets).
- 15 photos × 3 responsive variants, 8 posters × 2 variants, one cropped QR.
- A handful of fonts, two JS files and two `.ics` files.
- No server-side code, database, cron job, form handler or API.

The free hosting tier is expected to cover this comfortably; the site has no
server-side code, so requests are cheap static responses. The hosting panel
reports the current monthly allowances (site requests, CPU time, storage). Check
them before a high-traffic launch or before adding large media. If the site ever
exceeds the free limits, the options are a paid Cloudflare plan or moving the
static `dist/` to another static host. That decision is **not** budgeted here.

## Domain cost is deliberately unquoted

The domain is the only likely recurring cost. To get a real number:

1. Sign in to Spaceship (or use its public search) and search the exact name.
2. Record the **first-year price**, **renewal price**, **term**, **privacy
   options** and **taxes** at checkout.
3. Get written approval before paying.
4. Add the receipt and renewal date here.

Do not treat a promotional first-year price as the ongoing cost. Do not assume a
particular TLD is available.

## Optional costs the club may encounter

| Option | When it matters | Cost status |
| --- | --- | --- |
| Paid Cloudflare plan | Only if free build/bandwidth limits are exceeded | Not quoted |
| Custom email hosting | If the club wants `name@domain`, not just forwarding | Not quoted |
| Domain privacy / WHOIS protection | If not included by Spaceship | Not quoted |
| Paid stock photos / illustration | Not needed; real assets supplied | $0 |
| Paid Lighthouse/QA tooling | Not needed; CLI and Chrome are free | $0 |
| Transaction fees | Not applicable; no payments on the site | $0 |

## Budget rules for this project

- No purchase, upgrade, auto-renewal or paid add-on without the club's explicit
  approval.
- Keep the site on free tiers unless traffic or a required feature proves
  otherwise.
- Do not store card details, API tokens or receipts in this repository.
- Re-check this file after the domain is chosen and again at renewal time.
- If a cost is unknown, it stays **Unknown** here; it is not estimated as if it
  were a quote.

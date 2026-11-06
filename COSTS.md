# Costs

Status: **NO SPEND RECORDED BY THIS PROJECT**. Recorded spend from work done here:
**$0.00**. The club already owns `chessunitedglobal.com` and runs the site on its own
Cloudflare account; what those cost the club (domain renewal, any Cloudflare plan) is
the club's own bill and is not quoted here — the renewal date in particular is not
known to this repository, and it is the one date that must not lapse.

The site is live on Cloudflare Pages with Cloudflare DNS, Pages Functions and a D1
database, all on Cloudflare's free tier as far as this project can tell. The
Freebuff Sites mirror is a second, older host also serving the same build.

This page separates what is actually free from what is still unknown. It does not
quote a domain price, because no checkout was performed here and prices vary by TLD,
term, renewal date, promotions and taxes.

## Current cost table

| Item | Status | Cost | Notes |
| --- | --- | --- | --- |
| Hosting (Cloudflare Pages, project `chessunited`) | **Live** | $0 to this project | Free tier for the club's own account; the club's plan is not visible from here |
| Cloudflare DNS | **Live** | $0 | `chessunitedglobal.com` zone on Cloudflare; `www` record still missing at no cost |
| TLS certificate | **Live** | $0 | Managed by Cloudflare |
| Domain registration | **Owned by the club** | **Unknown** | Renewal price and date are the club's records, not this repository's |
| Domain renewal | Future | **Unknown** | Confirm the renewal date with the club and set a reminder; do not enable auto-renew without approval |
| Cloudflare D1 database (`chess-united`) | **Live** | $0 expected | Free tier covers a club-scale workload; paid only if the free read/write limits are exceeded |
| Pages Functions | **Live** | $0 expected | Free request allowance; the forms are low-volume writes |
| Custom email mailbox | Not included | **Unknown** | A domain does not automatically include a mailbox; confirmation emails are also not sent yet (`RESEND_API_KEY` is unset) |
| Fonts (Archivo Black, Manrope) | In use | $0 | SIL OFL 1.1; license files included |
| Astro, sitemap integration | In use | $0 | Open-source packages |
| Puppeteer, TypeScript, Astro Check | Dev only | $0 | Open-source dev dependencies |
| Python, Pillow | Local image pipeline | $0 | Not a runtime/deployment dependency |
| Analytics | Host-injected Cloudflare beacon | $0 | Cookieless, aggregate; no cookies or personal tracking |
| Forms / database | **In use** | $0 | Four public forms write to D1; an officer reviews them in `/admin/` |
| Payment processing | Not used | $0 | No gateway, no card data. The buyer sends GCash themselves and pays GCash's own fees, if any |
| Shipping | Paid by the buyer, quoted by the club | **Unknown** | Depends on courier, weight and destination; never priced on the site |
| Stock photography | Not used | $0 | All imagery was supplied by the club |
| Paid CDN / image host | Not used | $0 | Images are served from Pages |
| Search Console / Bing | Optional | $0 | Free accounts if the club chooses to verify |

## What the free tier must cover

For this site the hosting workload is small:

- 8 public HTML pages, plus `/admin/` and a `404.html`.
- 15 photos × 3 responsive variants, 8 posters × 2 variants, one cropped QR, and the
  product photos as the club supplies them.
- A handful of fonts, five JS files and two `.ics` files.
- Pages Functions on the small end: form submissions, one card lookup, one directory
  read, and the officer queue. Reads and writes are single-row D1 statements.
- No cron jobs, queues, workers-for-pay or media transcoding.

The free tier is expected to cover this comfortably. Check the account's usage
readouts (Pages requests, Function CPU time, D1 rows read/written, KV/storage) before
a high-traffic launch or before adding large media. If the site ever exceeds the free
limits, the options are a paid Cloudflare plan or trimming the API. That decision is
**not** budgeted here.

## Domain cost is the club's record

The domain is the one likely recurring cost, and it is already owned. To get a real
number:

1. Ask the club for the registration receipt, or check the registrar's dashboard.
2. Record the **renewal price**, **renewal date** and **term**.
3. Confirm whether auto-renew is on, and who can approve paying it.
4. Add the renewal date here so a future contributor cannot let the domain lapse.

Do not treat a promotional first-year price as the ongoing cost.

## Optional costs the club may encounter

| Option | When it matters | Cost status |
| --- | --- | --- |
| Paid Cloudflare plan | Only if the free Pages/Functions/D1 limits are exceeded | Not quoted |
| Custom email hosting | If the club wants `name@domain`, not just forwarding | Not quoted |
| Domain privacy / WHOIS protection | If not already included with the registration | Not quoted |
| Email confirmation service (Resend) | Only if the club wants automated receipts; the secret is unset and no plan was chosen | Not quoted |
| Paid stock photos / illustration | Not needed; real assets supplied | $0 |
| Paid Lighthouse/QA tooling | Not needed; CLI and Chrome are free | $0 |
| Transaction fees | Not applicable; no payment gateway is integrated | $0 |

## Budget rules for this project

- No purchase, upgrade, auto-renewal or paid add-on without the club's explicit
  approval.
- Keep the site on free tiers unless traffic or a required feature proves
  otherwise.
- Do not store card details, API tokens or receipts in this repository.
- Re-check this file after the domain is chosen and again at renewal time.
- If a cost is unknown, it stays **Unknown** here; it is not estimated as if it
  were a quote.

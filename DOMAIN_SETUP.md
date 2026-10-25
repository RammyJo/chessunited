# Domain setup — Spaceship → Cloudflare

Status: **PENDING**. No domain name, Spaceship account access or DNS permission
was supplied. Nothing has been purchased, transferred or changed.

The site is currently live on Cloudflare's own `pages.dev` domain:
<https://chessunited.pages.dev> (Cloudflare Pages project `chessunited`). A club
domain is the next step, and it does not require rebuilding the site — only a
domain, a DNS change and a new `SITE_URL` build. Because the host is already a
Cloudflare Pages project, attaching a domain later is **Custom domains → Set up a
domain** in that project, not a new deployment.

Two paths exist once a domain is registered at **Spaceship**:

1. **Attach the domain to the current deployment** (recommended). Add the domain
   in the hosting project's domains/custom-domain setting, then create the CNAME
   or nameserver records it shows. The exact UI depends on the hosting panel; use
   what it displays rather than guessing.
2. **Move to Cloudflare Pages on the club's own account**, using the runbook
   below: keep the registration at Spaceship, move only DNS to Cloudflare, then
   connect the Pages project. This gives the club full control of DNS, TLS and
   deployment history.

Either way, keep every existing MX/SPF/DKIM/DMARC record and confirm what email
the domain uses before changing nameservers.

## 0. Decisions to make first

- Final hostname: apex (`example.com`), `www`, or both with one redirecting.
- Whether the domain already has **email** (MX, SPF, DKIM, DMARC). If yes, copy
  every mail record into Cloudflare **before** changing nameservers. Changing
  nameservers without them will break email.
- Whether the club wants Cloudflare's proxy (orange cloud). For Pages, proxying
  is the normal choice.
- Who has authority to change nameservers and add DNS records. Do not proceed
  without that person's explicit approval.

## 1. Add the domain to Cloudflare

1. Sign in to the club's Cloudflare account (enable 2FA).
2. **Add a site** → enter the bare domain, e.g. `example.com`.
3. Choose the Free plan unless the club has a reason to pay for more.
4. Cloudflare scans existing DNS. Review the imported records carefully. Add any
   missing mail, verification or service records from Spaceship.
5. Cloudflare shows two assigned nameservers, usually of the form
   `xxx.ns.cloudflare.com` and `yyy.ns.cloudflare.com`. Copy both exactly.

Do not change anything at Spaceship yet.

## 2. Point Spaceship at Cloudflare

In the Spaceship dashboard:

1. Open the domain → **Nameservers** (the label may vary).
2. Choose custom nameservers.
3. Replace the Spaceship nameservers with the two Cloudflare nameservers.
4. Save.

Propagation is usually minutes but can take up to 24–48 hours. Cloudflare emails
when the zone is active. Check from Windows:

```powershell
Resolve-DnsName example.com -Type NS
Resolve-DnsName www.example.com -Type CNAME
```

The NS answer should show the Cloudflare nameservers, not Spaceship's.

If the domain is new, registration itself must complete at Spaceship first. A
new registration can take time to appear in public DNS.

## 3. Connect the domain to the Pages project

Wait until the Cloudflare zone is **Active**, then:

1. Cloudflare dashboard → **Workers & Pages** → the `chessunited` project →
   **Custom domains**.
2. **Set up a custom domain** → enter the apex, e.g. `example.com`.
3. Cloudflare should offer to create the required DNS record. Accept it. If it
   asks for a CNAME target, use the project's `*.pages.dev` hostname.
4. Add `www.example.com` as a second custom domain if the club wants both.
5. Choose one canonical host and redirect the other. The simplest pattern is
   apex as canonical and `www` → apex, using a Cloudflare Redirect Rule or Bulk
   Redirect. Do not run both hosts with duplicate content and no redirect.

If Cloudflare does not create the records automatically, add them manually in
**DNS**:

| Type | Name | Target | Proxy |
| --- | --- | --- | --- |
| CNAME | `@` (apex) | `<project>.pages.dev` | Proxied |
| CNAME | `www` | `<project>.pages.dev` | Proxied |

Cloudflare supports a CNAME at the apex through CNAME flattening. If the domain
is not on Cloudflare DNS, apex CNAME support depends on the DNS provider; that is
why the nameserver method is recommended.

## 4. TLS and HTTPS

1. **SSL/TLS → Overview** → set encryption mode to **Full (strict)**. Pages
   presents a valid certificate; do not use Flexible.
2. **SSL/TLS → Edge Certificates**:
   - Always Use HTTPS: on.
   - Automatic HTTPS Rewrites: on.
   - Minimum TLS version: 1.2 or higher.
   - Opportunistic Encryption: on if available.
3. Do **not** enable HSTS until the custom domain, `www`, and every subdomain
   the club uses are confirmed HTTPS-only. HSTS is difficult to undo quickly. If
   enabled later, start with a modest `max-age` and include subdomains only when
   certain.
4. Do not enable "Under Attack" mode for a static club site unless there is an
   actual attack; it can challenge ordinary visitors.

## 5. Rebuild with the final URL

The site's canonical links, sitemap, `robots.txt` and calendar files all use
`SITE_URL`.

```powershell
$env:SITE_URL = "https://example.com"
npm.cmd run build
npm.cmd run qa
```

Deploy the new `dist/` (see `DEPLOYMENT.md`). If the site was already deployed,
this is a new deployment, not a DNS-only change.

If both apex and `www` serve the site, use the canonical host in `SITE_URL` and
make the other redirect. Do not canonicalize to a host that immediately
redirects.

## 6. Verify

```powershell
Resolve-DnsName example.com -Type NS
Resolve-DnsName example.com -Type A
Resolve-DnsName www.example.com -Type CNAME
curl.exe -I https://example.com/
curl.exe -I https://www.example.com/
curl.exe https://example.com/robots.txt
curl.exe https://example.com/sitemap-index.xml
```

Check:

- [ ] `https://example.com/` returns 200 with a valid certificate.
- [ ] `www` either serves the same site or redirects once to the canonical host.
- [ ] No redirect loop; `http://` goes to `https://` in one hop.
- [ ] Canonical tag, `og:url`, sitemap URLs and `robots.txt` use the final host.
- [ ] The Messenger link and Maps links still work.
- [ ] The 404 page returns HTTP 404 and is `noindex`.
- [ ] Email still works (send and receive a test message) if the domain has mail.
- [ ] Cloudflare SSL/TLS is Full (strict), not Flexible.

## 7. Optional DNS hygiene

- **DNSSEC:** enable in Cloudflare, then add the DS record at Spaceship if
  Spaceship supports it. This is optional and adds a failure mode if the DS
  record is wrong; do it only if someone will maintain it.
- **CAA:** add a CAA record allowing the certificate authorities Cloudflare uses
  if the club has a CAA policy. Do not guess the set; check Cloudflare's current
  documentation first.
- **Email:** keep MX, SPF, DKIM and DMARC records intact. Cloudflare Email Routing
  is optional and changes MX; do not enable it casually if the club already uses
  Spaceship mail.
- **Search Console:** verify the final domain and submit
  `https://example.com/sitemap-index.xml`. This is optional and requires the
  club's Google account; no verification token is stored in this repository.

## 8. Rollback

- DNS: change the nameservers back at Spaceship to the previous values. Keep a
  screenshot or note of the original nameservers before changing them.
- Pages: use **Deployments → Rollback** to return to the previous build.
- If email breaks, restore the missing MX/SPF/DKIM/DMARC records in Cloudflare
  first; do not wait for propagation if the records are simply absent.

## 9. What has not been done

- No domain was purchased or transferred.
- No nameserver was changed.
- No DNS record was created.
- No Cloudflare zone, Pages custom domain or TLS setting was changed.
- No club domain is attached; the live URL is the `chessunited.pages.dev` host.
  Canonical tags, Open Graph, the sitemap, `robots.txt` and the `.ics` files all
  use that host today. After a domain is attached, change `SITE_URL` in
  `scripts/site-url.mjs`, rebuild and redeploy.

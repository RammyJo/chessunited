# Domain setup — Spaceship → Cloudflare

Status: **Apex live; www DNS repaired on 12 November 2026.** The canonical host is https://chessunitedglobal.com. The www hostname has a proxied originless DNS record and the Pages-specific Bulk Redirect setup. See section 10 for the deployed configuration and verification. The migration runbook below is retained for future maintenance.

The `pages.dev` hostname still answers
(<https://chessunited.pages.dev>) because Cloudflare keeps it for every project. It
is not canonical and does not redirect; the club domain is the address to publish.
Because the host is a Cloudflare Pages project, attaching another domain later is
**Custom domains → Set up a domain** in that project, not a new deployment — but
after any host change, rebuild with the new `SITE_URL` (section 5) or the metadata
will keep pointing at the old host.

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

## 9. What is still open

- **`www` DNS is repaired.** The former missing record was added on 12 November
  2026; the final setup uses a proxied A record and Pages Bulk Redirect. See section 10.
- **`pages.dev` answers without redirecting.** Both hosts serve the same content and
  only the apex is canonical. That is tolerable, but a Redirect Rule from
  `chessunited.pages.dev` to the domain is cleaner if the dashboard offers one.
- The mail records for the domain were not inventoried here. If the club adds email
  on this domain later, keep MX/SPF/DKIM/DMARC intact (section 0).
- No verification token or API key is stored in this repository.

## 10. Production repair — 12 November 2026

Canonical website: **https://chessunitedglobal.com**. Cloudflare zone:
`0e295bc3d4012ebf33c82105960359c2`; account:
`a1535c96f8ebe5df3bbd767a4367914c`; Pages project: `chessunited`.

### DNS and HTTPS

| Name | Type | Target | Proxy | TTL |
| --- | --- | --- | --- | --- |
| `chessunitedglobal.com` | CNAME | `chessunited.pages.dev` | Enabled | Auto |
| `www.chessunitedglobal.com` | A | `192.0.2.1` | Enabled | Auto |

The www address is an **originless, proxied** hostname following
[Cloudflare's Pages www redirect setup](https://developers.cloudflare.com/pages/how-to/www-redirect/).
The reserved address is a placeholder; visitors receive Cloudflare edge IPs,
not this placeholder. Keep it proxied. The existing active Universal SSL
certificate covers the apex and `*.chessunitedglobal.com`.

DNS record ID: `ad8e8f105f928d942c99c747889b18dc`.

### Bulk Redirect

List: `chess_united_www_redirects` (`c4b8329d390a4413ad116a61dd8324c8`).
The list contains only this redirect:

```json
{
  "source_url": "www.chessunitedglobal.com/",
  "target_url": "https://chessunitedglobal.com/",
  "status_code": 308,
  "include_subdomains": false,
  "subpath_matching": true,
  "preserve_path_suffix": true,
  "preserve_query_string": true
}
```

The source omits a scheme to match both HTTP and HTTPS. The account-level
`http_request_redirect` ruleset (`f79c70f73ee64ea988b3cebd951945b8`)
enables the list with rule `434da8eaed11409e8e7f1341325154b2`:

```json
{
  "ref": "chess_united_enable_www_redirects",
  "enabled": true,
  "expression": "http.request.full_uri in $chess_united_www_redirects",
  "action": "redirect",
  "action_parameters": {
    "from_list": {
      "name": "chess_united_www_redirects",
      "key": "http.request.full_uri"
    }
  }
}
```

The previous zone Single Redirect, rule
`42a47190a33044e8ac6a1fd921d0073b` in ruleset
`ee665c90681a455baded4641ce9e9512`, is **disabled**. It did not consistently
redirect Pages traffic in validation. Use the Pages-specific Bulk Redirect
above rather than re-enabling both. No unrelated account lists/rules existed
when this dedicated list and rule were added.

These settings live in Cloudflare DNS and Rules, separately from Pages builds.
Pages `_redirects` does not support domain-level redirects; no catch-all Pages
Function or application deployment was added for this infrastructure repair.

### Verification and client DNS diagnosis

Fresh browsers verified HTTPS www home, Events and Shop returning 308 to the
canonical domain and then loading the site. Event query parameters and the
`#saturday-chess` fragment survived. An HTTP browser can upgrade to HTTPS first;
the network redirect then takes it to the canonical domain. Public Cloudflare
and Google DNS returned valid A and AAAA answers for www.

A previous NXDOMAIN answer may remain cached on a device, router or resolver.
At the time of repair, the negative-cache SOA TTL was 1,800 seconds. A Windows
DNS flush clears the local cache, but does not clear an upstream router or ISP
cache. If a visitor still gets a DNS error, compare their network's answer with
Cloudflare's public resolver before attributing it to browser caching:

```powershell
ipconfig /flushdns
nslookup www.chessunitedglobal.com
nslookup www.chessunitedglobal.com 1.1.1.1
```

Use https://chessunitedglobal.com in new messages. Preserve mail records and
nameservers; neither needed changes for this repair.

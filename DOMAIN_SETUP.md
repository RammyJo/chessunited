# Production domain setup

Canonical website: **https://chessunitedglobal.com**.

The Cloudflare zone is `chessunitedglobal.com` (`0e295bc3d4012ebf33c82105960359c2`),
in account `a1535c96f8ebe5df3bbd767a4367914c`. The existing Pages project is
`chessunited`; application content is served on the canonical domain.

## DNS and HTTPS

| Name | Type | Target | Cloudflare proxy | TTL |
| --- | --- | --- | --- | --- |
| `chessunitedglobal.com` | CNAME | `chessunited.pages.dev` | Enabled | Auto |
| `www.chessunitedglobal.com` | CNAME | `chessunitedglobal.com` | Enabled | Auto |

The active Universal SSL certificate covers the apex and
`*.chessunitedglobal.com`. Keep the `www` record proxied: its redirect runs on
Cloudflare before requests reach Pages.

## Canonical redirect

The zone-level Single Redirect runs in `http_request_dynamic_redirect`:

```json
{
  "ref": "chess_united_www_to_apex",
  "enabled": true,
  "expression": "http.host eq \"www.chessunitedglobal.com\"",
  "action": "redirect",
  "action_parameters": {
    "from_value": {
      "target_url": {
        "expression": "concat(\"https://chessunitedglobal.com\", http.request.uri.path)"
      },
      "status_code": 308,
      "preserve_query_string": true
    }
  }
}
```

Ruleset ID: `ee665c90681a455baded4641ce9e9512`.
Rule ID: `42a47190a33044e8ac6a1fd921d0073b`.
The added `www` DNS record ID is `ad8e8f105f928d942c99c747889b18dc`.

This handles HTTP and HTTPS links, including links shared through Messenger.
Page paths and query parameters are retained; browsers inherit the original
fragment when the redirect does not supply a replacement. Status 308 preserves
the HTTP method. The apex is not matched, so the rule cannot loop back to `www`.

These settings live in Cloudflare DNS and Rules, separately from Pages builds.
A website deployment alone cannot repair a missing DNS hostname.

## Verification and cache behavior

On 12 November 2026, `www` returned NXDOMAIN while the apex worked. Adding its
DNS record and the redirect repaired the shared-link failure. Public Cloudflare
and Google resolvers returned valid addresses after the change. Browser checks
with a Messenger-style user agent retained the page, query and event fragment.

Use the canonical URL in new messages. A device or DNS resolver that cached the
old NXDOMAIN response may need up to 30 minutes to expire it, based on the zone's
negative-cache TTL at the time of repair. The non-`www` address remains usable
while that cache expires.

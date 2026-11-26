# Active website analytics — 27 November 2026

The owner requested live daily, weekly, monthly and yearly reports with dates
only. The former invented 478 fixtures have been removed, not relabeled as real
traffic. Actual Cloudflare Web Analytics history exists from 2 November 2026.
The verified GraphQL query was grouped by UTC hour and converted to Asia/Manila
dates. The only hostname returned is chessunitedglobal.com. Daily estimates total
680 through 26 November. November 25 has 140 versus 60 on November 24 (+133.3%).
The historical dataset has an average sampling interval of 10; its normalized
counts are estimates. See analytics-cloudflare-history.json for the response.
No counts were adjusted to force a spike or total. Do not multiply the counts
by the sampling interval again.

Additive migration 0008 stores daily aggregate counts and coverage dates in D1.
Historical estimates remain separate from new recorded opens. Live tracking
starts 27 November; this first day has partial coverage. Repeat public page loads
and Back/Forward restorations count again. There are no analytics cookies,
visitor identifiers, per-visit timestamps, page URLs, raw IP addresses or user
agents stored in analytics. Existing API abuse budgets keep their usual expiring
hashed IP keys separately. Report/admin/private pages, known bots and browser
automation checks are excluded. Counters increment atomically and ignore client
supplied dates/counts. Origins must match and the public route is validated.
Browser counting can miss blocked requests; it is not proof of unique people.

/analytics/ remains unlisted, noindex/nofollow, without login and public by link.
It shows historical estimates, live coverage, the real November 25 increase,
date filters, Monday-based weeks, monthly/yearly grouping, comparisons between
complete periods, charts, table pagination and visibility-aware automatic
refresh every 30 seconds. The UI displays dates without clock times. Approximate
figures are marked ≈. The current day and first live-tracking day are partial;
they do not receive misleading percentage comparisons against complete days.
No Cloudflare API credential is put in the website, browser or application.

# Launch readiness audit

The audit covers Chess United’s public pages, registration and checkout APIs, officer dashboard, D1 records, Google Sheets sync, GCash QR flow and courier quote adapters. Production payments and customer submissions are not used as test fixtures.

## Fixes

- Protected every API response with no-store caching, MIME sniffing protection, framing restrictions and a restrictive JSON content policy. Unexpected failures return safe messages.
- Added origin and browser request checks, JSON-only writes and a 32 KiB streamed request limit. Cross-site form posts are rejected before they change records.
- Added shared, atomic request budgets, including ten sign-in attempts per client per fifteen minutes. Request counters use hashed client identifiers, have expiry/cleanup and return Retry-After when blocked.
- Reject malformed sign-in cookies, forged/expired sessions, prototype-property names, malformed record IDs, invalid quantities and invalid membership options. Prices and payment status remain server controlled.
- Made website membership, tournament and partner retries idempotent, including simultaneous requests. Submission replies are encrypted with the browser’s random key; only the key hash is stored. Club and tournament submissions save in one transaction. A database constraint prevents duplicate tournament entries for an event/email pair.
- Issued private digital-card links with hashed access keys and eight-digit member numbers. A member number alone cannot retrieve names. Officers can verify cards and issue replacement private links, which revoke the previous link. Existing four-digit numbers remain valid with an officer session or a replacement private link.
- Fixed the populated dashboard table renderer, incorrect partner-table columns and mobile overflow that could hide officer action buttons.
- Stopped cancelled/refunded orders from presenting a payment QR. Payment reports from buyers never mark money received or reopen cancelled orders.
- Stop tournament payment forms after the published event end, on both client and server. Event end times follow the published schedule.
- Added content fingerprints to every website script URL so cached checkout/auth scripts refresh when their code changes.
- Added privacy information and links from public forms. Logs use safe error codes instead of submitted personal data or provider error payloads.

## Validation

- `npm run check`, `npm run build`, `npm run qa`.
- `npm run test:security`: actual Workers/D1 adversarial tests for access control, cookies, CSRF, request size, login throttling and expiry, prototype inputs, basket tampering, concurrent retries, encrypted replies, private-card access/revocation, transaction rollback and cancelled-order payment handling.
- `npm run test:sheets`: seventeen Sheets tests plus actual local Workers/D1 checkout, quote, buyer-claim and officer tests.
- `npm run test:shipping`: thirteen rate, valuation and validation tests.
- `npm run qa:checkout`, `npm run qa:security`: browser fixtures for payment recovery, cancelled orders, HTML injection, lost signup replies, private card keys, all populated dashboard queues and mobile cards.
- Desktop and mobile public-page checks, navigation/touch/focus checks and production-CSP checks.
- `npm audit`: zero reported dependency vulnerabilities at audit time. No matching credential patterns found in tracked files or the 184 historical text blobs scanned; no source maps, SQL, private-key files or source archives found in the public build.
- Live D1 quick check: ok; no foreign-key violations. Migration adds protections without deleting customer records.

## Launch operation

Delivery uses the owner-authorized **minimum small-parcel** pricing policy: one minimum courier charge per order, valued at the full merchandise subtotal, dispatched from San Fernando City, La Union. Checkout prices one 1 kg parcel per order. J&T uses EZ service; LBC uses its official PH calculator and the buyer’s selected package. These are billing assumptions, not measured product weights. The club covers any higher actual carrier charge, so buyers pay the complete total shown before GCash payment. Pickup stays free. Officers can later switch to measured pricing in **Dashboard → Delivery setup**.

All payments use the supplied GCash/InstaPay QR. Officers must match actual receipt in GCash before selecting Paid. The website does not collect PINs or OTPs. A buyer’s payment claim is not automatic verification. Courier quotes do not book a shipment.

In the private spreadsheet, use the paid dropdown after confirming receipt. The five-minute scheduled worker imports sheet edits even while the site is idle; **Sync now** requests an immediate pass. Failed mirrors stay queued in D1. Large queues take multiple passes; dashboard status shows scheduler health.

The owner confirmed there are no existing members to migrate. Members will register through the website; an import can be handled later if supplied. No stored records were deleted. Officers can issue replacement private card links when needed; replacement links invalidate the earlier key.

Keep ADMIN_TOKEN unique and random, with at least 24 characters; changing it revokes existing officer sessions. Keep the Google service-account credential in Cloudflare secrets. Use the Cloudflare D1 recovery tools for operational recovery; do not apply the fresh schema to an existing database instead of migrations.

Audit results and deployment details are recorded after the live checks in the deployment receipt for this workspace.

## Launch follow-through

Unconfirmed officer cards are unpublished until real details arrive. Published names use their initials until photographs are provided. No names or photographs are invented.

The owner selected the supplied GCash QR with manual officer verification for launch. Dashboard Mark paid opens a receipt review showing customer, expected amount and reference; Cancel writes nothing. Direct Paid edits in Google Sheets remain supported and must also reflect actual receipt. No personal-QR webhook is implied.

Submitted orders provide a private `/shop/order/#key=...` status link. The 256-bit capability is hashed in D1 and sent to the API in a POST body, never in a request URL. The page is noindex and excluded from the sitemap; it shows payment, handover and official courier tracking links. Bookmarking the link retains access. Officers enter the actual courier tracking number after booking separately.

Real-money rehearsal remains an owner action: complete one genuine small purchase, confirm its reference and amount in the receiving GCash account, mark Paid and check the private buyer page and spreadsheet. Automated browser tests use fixtures and do not prove settlement of real funds.

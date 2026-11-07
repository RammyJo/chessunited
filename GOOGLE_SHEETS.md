# Google Sheets mirror

D1 remains the source of truth. Orders, tournament entries and membership signups (including officer status/tracking changes) are copied to dedicated **Orders**, **Registrations** (tournaments) and **Memberships** tabs in the private Chess United Merch spreadsheet:

https://docs.google.com/spreadsheets/d/1HyWudE1b-yizLdvrjAwUfx7roC-jLYQZig-VfpoCLbI/edit

## Activation

1. Google Cloud project: `long-grin-510208-j7`. Enable the Sheets API (already done in the original setup).
2. Dedicated account: `chessunited-sheets@long-grin-510208-j7.iam.gserviceaccount.com`. Give it Editor access to this sheet, retaining Restricted general access (already done in the original setup).
3. Create/download a JSON key from that account's Keys tab. Store the complete JSON directly as the Cloudflare Pages **production secret** `GOOGLE_SHEETS_SERVICE_ACCOUNT`. Never put it in chat or Git.
4. Redeploy `chessunited` after setting the secret so the deployed functions receive it.
5. Sign into `/admin/` and select **Check connection**. This authenticates with Google, creates either missing tab, validates the headers, and writes the same column headers to confirm edit access without creating a customer record. Then select **Sync now**.

`GOOGLE_SHEETS_SPREADSHEET_ID` optionally overrides the default destination. Changing it also requires a deliberate resync of previously copied records; do not change it casually.

## Storage and retries

Apply `migrations/0001_google_sheets.sql` and `migrations/0002_sheets_connection_check.sql` and `migrations/0003_membership_sheets.sql`, then `migrations/0004_payment_tracking.sql` and `migrations/0005_checkout.sql`, followed by `migrations/0006_security.sql` and `migrations/0007_scheduled_sheets.sql` to the existing D1 database before deploying the functions. It adds only the sync queue, a lease row, tracking triggers and an initial queue entry for each existing source record. `schema.sql` includes the same migration for new databases.

Triggers commit queue changes atomically with orders/registrations. A global 120-second lease serializes sheet writes. Revision checks keep edits made during a copy queued for the next pass. Remote rows are updated at `D1 id + 1`, so retries after ambiguous network failures cannot append duplicates. Values use Google's RAW input mode to preserve phone/reference strings and avoid evaluating user-entered formulas.

The tabs are managed mirrors: do not sort/move/delete rows, insert rows, or change headers. Use separate tabs for analysis. A different record ID at the destination row or an incompatible header causes the sync to stop rather than overwrite unrelated data. Missing rows from deleted D1 records are not cleared: this integration copies inserts and updates, not deletions. The **paid** dropdown is the one editable field that flows back to D1. Use **Paid** or **Not paid**. Free digital memberships show **Not required**. Payment marks import automatically on the five-minute schedule; select **Sync now** in the dashboard for an immediate update. Other sheet columns remain managed copies. Never mark paid merely because a buyer submits a payment claim: verify actual receipt in GCash. Newer dashboard changes take priority over conflicting sheet edits.

Each background pass has a 22-second network budget and handles up to three jobs. It runs after successful order, membership or tournament submissions, officer updates and dashboard queue loads. Failures remain queued. The `chessunited-sheets-scheduler` Worker requests another pass every five minutes, even while the website is idle. New activity or the officer's **Sync now** button can also retry them. Large queues drain over several passes. The button processes up to 20 batches per click. Reload to see background progress. Google failures never turn a saved D1 order into a failed customer submission.

## Checks

- `npm run test:sheets`: real RSA/JWT verification, Google API fixtures, SQLite triggers/revisions, retry idempotency, row/header conflict protection, RAW preservation and admin access tests; plus an actual Workers/D1 runtime smoke test with a local database.
- `npm run check`, `npm run build`, `npm run qa`: existing project checks.
- `GET /api/admin/sheets`: authenticated status (configuration, pending/failed counts, last copy time, safe error code).
- `POST /api/admin/sheets`: authenticated bounded retry. `?check=1` verifies Google access and prepares tabs.

Tests do not use a real Google credential. End-to-end verification requires the production secret and the connection check above. Error logs/status never include credential contents or customer data.

## Operator activation check

A platform operator with D1 write access can request a one-off check by setting `requested = 1` in the singleton `sheets_connection_check` row. The next public directory GET services that request with `waitUntil`. It cannot request checks or reveal their results; no Google request is made unless an operator has queued a check. Verification prepares headers, creates no customer records, stores a safe result/timestamp in D1, then processes a bounded batch of existing queued records. A lease protects concurrent invocations. This allows activation checks without extracting credentials or bypassing the officer sign-in.

## GCash checkout and delivery

Orders use a server-stored shipping quote, locked draft total and a random private payment-session token (stored hashed in D1). A retry resumes the same draft. After paying, buyers submit the draft for verification; this never marks it paid automatically. Reloading the same browser tab resumes an unfinished payment session. The optional GCash receipt reference helps officers match transfers. QR payment goes to the exact InstaPay payload supplied by the club; the QR is not a checkout URL or a payment verification API.

Delivery currently uses the owner-authorized **minimum small-parcel** policy: one minimum-rate parcel for the whole order, dispatched from San Fernando City, La Union. No product measurements are required in this pricing mode. Checkout prices one 1 kg parcel per order, with no invented product dimensions. J&T uses EZ service. LBC calls its official PH calculator and honors the buyer’s chosen package or selects the lowest available package. The full merchandise subtotal is declared for valuation. The club covers any actual courier charge above the checkout fee. Up to 20 items can be ordered for online delivery; pickup has zero shipping.

Officers may change dispatch locations or switch to measured pricing in `/admin/` → **Delivery setup**. In measured mode, products require their real packed kg/cm and each unit is quoted separately. Config changes invalidate unprepared quotes; saved payment drafts retain the amount already shown.

J&T uses the public EZ calculator at https://www.jtexpress.ph/shipping-rates (backend `ylofficialjw.jtexpress.ph/website/fee/findRates`). LBC uses its current public domestic cargo calculator at https://www.lbcexpress.com/rates/ via `ratecalcapi.lbcapps.com` and its public calculator token. The token refreshes from its official calculator script; no private courier account credential is embedded. These website endpoints can change, so failures stop payment checkout for that courier instead of substituting invented rates. Location IDs were fetched from both calculators on 2026-11-06; refresh the two identical location datasets together when courier coverage changes.

In measured mode, the declared value is the unit catalogue price and each unit is quoted in a separate measured parcel. In minimum mode, valuation covers the full basket in one billing parcel. LBC selects the smallest official package fitting the packed dimensions and weight, allowing rotation, and adds valuation to the returned freight amount. Include outer-box allowance in configured weight. J&T sends the actual configured dimensions and weight and includes returned insurance/service charges. This integration quotes delivery; it does not book shipments. Keep the packing method consistent with these settings.

`node --test tests/shipping.test.mjs` checks both rate adapters, insurance, invalid rates and missing measurements. `npm run test:sheets` checks the real local Workers/D1 draft, quote expiry/revision checks, resume/idempotency, buyer claim versus trusted paid, officer authorization and Sheets payment edits.

## Launch hardening

API routes now enforce request budgets, same-origin browser writes, JSON and body limits, and private response headers. Current membership, tournament and partner forms send random retry keys; their encrypted replies make concurrent retries atomic. Member card names require the private card link or an officer session. Existing number-only links should be replaced with **New private card link** in the dashboard; private access keys are never mirrored into the spreadsheet.

The operator may request a configuration-only check with `UPDATE security_check SET requested=1 WHERE id=1`. A directory GET services it in the background. The boolean findings stay in D1 and never return credential values. `LAUNCH_READINESS.md` records checks, fixes and the active minimum delivery policy.

## Automatic schedule

`workers/sheets-scheduler/wrangler.toml` defines the five-minute Cron. Pages cannot receive Cron events, so the dedicated Worker queues a private D1 wake-up and fetches the existing Pages directory. A public directory GET can consume an already requested job, but cannot request one or see its result. The Google credential stays in Pages; no admin token or Google key is copied to the scheduler. The worker has no public trigger. Both the wake-up and Sheets writes have expiring leases; Google failures retain the durable source queue. Dashboard status shows stale/failed schedules. A pass checks up to 40 payment marks and copies up to three pending rows. The next pass rotates through unchecked records.

Deploy the Pages handler and apply migration 0007 before enabling the Cron worker. Worker source/config are in `workers/sheets-scheduler`; `npm run test:scheduler` tests the real scheduled handler against a temporary D1 with the HTTP wake-up intercepted. Local pinned workerd uses its newest supported compatibility date (2026-10-30); deployed Cron uses 2026-11-07 and must be verified via its actual heartbeat.

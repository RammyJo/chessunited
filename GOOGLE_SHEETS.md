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

Apply `migrations/0001_google_sheets.sql` and `migrations/0002_sheets_connection_check.sql` and `migrations/0003_membership_sheets.sql`, then `migrations/0004_payment_tracking.sql` and `migrations/0005_checkout.sql` to the existing D1 database before deploying the functions. It adds only the sync queue, a lease row, tracking triggers and an initial queue entry for each existing source record. `schema.sql` includes the same migration for new databases.

Triggers commit queue changes atomically with orders/registrations. A global 120-second lease serializes sheet writes. Revision checks keep edits made during a copy queued for the next pass. Remote rows are updated at `D1 id + 1`, so retries after ambiguous network failures cannot append duplicates. Values use Google's RAW input mode to preserve phone/reference strings and avoid evaluating user-entered formulas.

The tabs are managed mirrors: do not sort/move/delete rows, insert rows, or change headers. Use separate tabs for analysis. A different record ID at the destination row or an incompatible header causes the sync to stop rather than overwrite unrelated data. Missing rows from deleted D1 records are not cleared: this integration copies inserts and updates, not deletions. The **paid** dropdown is the one editable field that flows back to D1. Use **Paid** or **Not paid**. Free digital memberships show **Not required**. Payment marks import on the next sync; select **Sync now** in the dashboard and it reloads the queue. Other sheet columns remain managed copies. Never mark paid merely because a buyer submits a payment claim: verify actual receipt in GCash. Newer dashboard changes take priority over conflicting sheet edits.

Each background pass has a 22-second network budget and handles up to three jobs. It runs after successful order, membership or tournament submissions, officer updates and dashboard queue loads. Failures remain queued. New activity or the officer's **Sync now** button retries them; there is no scheduled worker or guaranteed retry while the site/dashboard is idle. The button processes up to 20 batches per click. Reload to see background progress. Google failures never turn a saved D1 order into a failed customer submission.

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

Before delivery checkout can charge any product, open **Delivery setup** in `/admin/`, confirm the real dispatch locations and enter measured packed kg and cm for that product. No weights are fabricated. Products without complete measurements support pickup. Pickup is available immediately at zero shipping. Config changes invalidate unprepared quotes; existing saved payment drafts retain the amount the buyer saw.

J&T uses the public EZ calculator at https://www.jtexpress.ph/shipping-rates (backend `ylofficialjw.jtexpress.ph/website/fee/findRates`). LBC uses its current public domestic cargo calculator at https://www.lbcexpress.com/rates/ and its publicly supplied WordPress request tokens. Tokens refresh from the official page; no account credential is embedded. These website endpoints can change, so failures stop payment checkout for that courier instead of substituting invented rates. Location IDs were fetched from both calculators on 2026-11-06; refresh the two identical location datasets together when courier coverage changes.

The declared value is the unit catalogue price. Each unit is quoted in a separate measured parcel. LBC selects the smallest official package fitting the packed dimensions and weight, allowing rotation, and adds valuation to the returned freight amount. Include outer-box allowance in configured weight. J&T sends the actual configured dimensions and weight and includes returned insurance/service charges. This integration quotes delivery; it does not book shipments. Keep the packing method consistent with these settings.

`node --test tests/shipping.test.mjs` checks both rate adapters, insurance, invalid rates and missing measurements. `npm run test:sheets` checks the real local Workers/D1 draft, quote expiry/revision checks, resume/idempotency, buyer claim versus trusted paid, officer authorization and Sheets payment edits.

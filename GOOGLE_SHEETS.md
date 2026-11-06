# Google Sheets mirror

D1 remains the source of truth. Orders and tournament entries (including officer status/tracking changes) are copied to dedicated **Orders** and **Registrations** tabs in the private Chess United Merch spreadsheet:

https://docs.google.com/spreadsheets/d/1HyWudE1b-yizLdvrjAwUfx7roC-jLYQZig-VfpoCLbI/edit

## Activation

1. Google Cloud project: `long-grin-510208-j7`. Enable the Sheets API (already done in the original setup).
2. Dedicated account: `chessunited-sheets@long-grin-510208-j7.iam.gserviceaccount.com`. Give it Editor access to this sheet, retaining Restricted general access (already done in the original setup).
3. Create/download a JSON key from that account's Keys tab. Store the complete JSON directly as the Cloudflare Pages **production secret** `GOOGLE_SHEETS_SERVICE_ACCOUNT`. Never put it in chat or Git.
4. Redeploy `chessunited` after setting the secret so the deployed functions receive it.
5. Sign into `/admin/` and select **Check connection**. This authenticates with Google, creates either missing tab, validates the headers, and writes the same column headers to confirm edit access without creating a customer record. Then select **Sync now**.

`GOOGLE_SHEETS_SPREADSHEET_ID` optionally overrides the default destination. Changing it also requires a deliberate resync of previously copied records; do not change it casually.

## Storage and retries

Apply `migrations/0001_google_sheets.sql` and `migrations/0002_sheets_connection_check.sql` to the existing D1 database before deploying the functions. It adds only the sync queue, a lease row, tracking triggers and an initial queue entry for each existing source record. `schema.sql` includes the same migration for new databases.

Triggers commit queue changes atomically with orders/registrations. A global 120-second lease serializes sheet writes. Revision checks keep edits made during a copy queued for the next pass. Remote rows are updated at `D1 id + 1`, so retries after ambiguous network failures cannot append duplicates. Values use Google's RAW input mode to preserve phone/reference strings and avoid evaluating user-entered formulas.

The tabs are managed mirrors: do not sort/move/delete rows, insert rows, or change headers. Use separate tabs for analysis. A different record ID at the destination row or an incompatible header causes the sync to stop rather than overwrite unrelated data. Missing rows from deleted D1 records are not cleared: this integration copies inserts and updates, not deletions. Edits in Sheets do not flow back to D1.

Each background pass has a 22-second network budget and handles up to three jobs. It runs after successful order/registration submissions, officer updates and dashboard queue loads. Failures remain queued. New activity or the officer's **Sync now** button retries them; there is no scheduled worker or guaranteed retry while the site/dashboard is idle. The button processes up to 20 batches per click. Reload to see background progress. Google failures never turn a saved D1 order into a failed customer submission.

## Checks

- `npm run test:sheets`: real RSA/JWT verification, Google API fixtures, SQLite triggers/revisions, retry idempotency, row/header conflict protection, RAW preservation and admin access tests; plus an actual Workers/D1 runtime smoke test with a local database.
- `npm run check`, `npm run build`, `npm run qa`: existing project checks.
- `GET /api/admin/sheets`: authenticated status (configuration, pending/failed counts, last copy time, safe error code).
- `POST /api/admin/sheets`: authenticated bounded retry. `?check=1` verifies Google access and prepares tabs.

Tests do not use a real Google credential. End-to-end verification requires the production secret and the connection check above. Error logs/status never include credential contents or customer data.

## Operator activation check

A platform operator with D1 write access can request a one-off check by setting `requested = 1` in the singleton `sheets_connection_check` row. The next public directory GET services that request with `waitUntil`. It cannot request checks or reveal their results; no Google request is made unless an operator has queued a check. Verification prepares headers only, creates no customer records, and stores a safe result/timestamp in D1. A lease protects concurrent invocations. This allows activation checks without extracting credentials or bypassing the officer sign-in.

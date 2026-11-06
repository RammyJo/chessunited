ALTER TABLE members ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE sheets_sync ADD COLUMN paid_snapshot TEXT;
ALTER TABLE sheets_sync ADD COLUMN payment_checked_at INTEGER NOT NULL DEFAULT 0;

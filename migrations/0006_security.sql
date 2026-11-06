-- Expiring, pseudonymous request budgets; no raw IP addresses are retained.
CREATE TABLE IF NOT EXISTS api_rate_limits (
 key TEXT PRIMARY KEY, hits INTEGER NOT NULL, reset_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_api_rate_expiry ON api_rate_limits(reset_at);
-- Browser submission keys make retries atomic without exposing personal data.
CREATE TABLE IF NOT EXISTS form_submissions (
 key_hash TEXT PRIMARY KEY, kind TEXT NOT NULL, fingerprint TEXT NOT NULL,
 encrypted_response TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
ALTER TABLE members ADD COLUMN card_token_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_registration_person ON registrations(event_slug,email);
CREATE INDEX IF NOT EXISTS idx_shipping_quote_expiry ON shipping_quotes(expires_at);
-- Only a platform operator can request a configuration check. Results stay private.
CREATE TABLE IF NOT EXISTS security_check (
 id INTEGER PRIMARY KEY CHECK(id=1), requested INTEGER NOT NULL DEFAULT 0,
 checks_json TEXT, checked_at TEXT
);
INSERT OR IGNORE INTO security_check(id) VALUES(1);

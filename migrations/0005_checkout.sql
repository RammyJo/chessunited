CREATE TABLE IF NOT EXISTS shipping_settings (
 id INTEGER PRIMARY KEY CHECK (id = 1), config_json TEXT NOT NULL DEFAULT '{}', revision INTEGER NOT NULL DEFAULT 1
);
INSERT OR IGNORE INTO shipping_settings(id) VALUES(1);
CREATE TABLE IF NOT EXISTS shipping_quotes (
 id TEXT PRIMARY KEY, basket_json TEXT NOT NULL, courier TEXT NOT NULL, destination_id TEXT NOT NULL,
 shipping_fee REAL NOT NULL, subtotal REAL NOT NULL, details_json TEXT NOT NULL, config_revision INTEGER NOT NULL,
 expires_at INTEGER NOT NULL
);
ALTER TABLE orders ADD COLUMN shipping_fee REAL;
ALTER TABLE orders ADD COLUMN total REAL;
ALTER TABLE orders ADD COLUMN shipping_quote_json TEXT;
ALTER TABLE orders ADD COLUMN payment_token_hash TEXT;
ALTER TABLE orders ADD COLUMN payment_claimed_at TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_token ON orders(payment_token_hash) WHERE payment_token_hash IS NOT NULL;

-- Chess United — Cloudflare D1 schema
--
-- Apply locally:  npx wrangler d1 execute chess-united --local --file=./schema.sql
-- Apply remotely: npx wrangler d1 execute chess-united --remote --file=./schema.sql
--
-- Money is stored in whole pesos. Timestamps are ISO-ish UTC strings.

CREATE TABLE IF NOT EXISTS members (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  member_no      TEXT    NOT NULL UNIQUE,
  first_name     TEXT    NOT NULL,
  last_name      TEXT    NOT NULL,
  email          TEXT    NOT NULL,
  phone          TEXT    NOT NULL,
  city           TEXT,
  province       TEXT,
  birth_year     INTEGER,
  division       TEXT    NOT NULL DEFAULT 'open',      -- open | kiddies
  photo_url      TEXT,
  -- The printed ID + lanyard is a paid option at PHP 200.
  printed_id     INTEGER NOT NULL DEFAULT 0,
  gcash_ref      TEXT,
  status         TEXT    NOT NULL DEFAULT 'active',    -- active | pending | rejected
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS registrations (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  event_slug     TEXT    NOT NULL,
  full_name      TEXT    NOT NULL,
  email          TEXT    NOT NULL,
  phone          TEXT    NOT NULL,
  division       TEXT    NOT NULL,                     -- "Open Division" | "Kiddies Division"
  club           TEXT,
  member_no      TEXT,
  gcash_ref      TEXT    NOT NULL,
  amount         INTEGER NOT NULL,
  payment_status TEXT    NOT NULL DEFAULT 'pending',   -- pending | verified | rejected
  notes          TEXT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no          TEXT    NOT NULL UNIQUE,
  full_name         TEXT    NOT NULL,
  email             TEXT    NOT NULL,
  phone             TEXT    NOT NULL,
  ship_address      TEXT    NOT NULL,
  ship_city         TEXT    NOT NULL,
  ship_province     TEXT    NOT NULL,
  ship_postcode     TEXT,
  ship_country      TEXT    NOT NULL DEFAULT 'Philippines',
  courier           TEXT    NOT NULL,                  -- lbc | jt | fedex | ups | dhl | phlpost
  items_json        TEXT    NOT NULL,
  subtotal          INTEGER NOT NULL,
  shipping_note     TEXT,
  payment_method    TEXT    NOT NULL DEFAULT 'gcash',
  gcash_ref         TEXT,
  payment_status    TEXT    NOT NULL DEFAULT 'pending',
  fulfilment_status TEXT    NOT NULL DEFAULT 'new',    -- new | packed | shipped | delivered
  tracking_no       TEXT,
  created_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS partner_clubs (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  club_name        TEXT    NOT NULL,
  city             TEXT    NOT NULL,
  province         TEXT,
  country          TEXT    NOT NULL DEFAULT 'Philippines',
  meeting_place    TEXT,
  meeting_schedule TEXT,
  contact_name     TEXT    NOT NULL,
  contact_email    TEXT    NOT NULL,
  contact_phone    TEXT,
  facebook         TEXT,
  notes            TEXT,
  status           TEXT    NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Tournament/event listings posted by partner clubs (item 5, phase two).
CREATE TABLE IF NOT EXISTS partner_events (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_club_id INTEGER NOT NULL REFERENCES partner_clubs(id),
  title           TEXT    NOT NULL,
  event_date      TEXT    NOT NULL,
  venue           TEXT,
  details         TEXT,
  status          TEXT    NOT NULL DEFAULT 'pending',
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_members_no        ON members(member_no);
CREATE INDEX IF NOT EXISTS idx_reg_event         ON registrations(event_slug);
CREATE INDEX IF NOT EXISTS idx_orders_no         ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_partner_status    ON partner_clubs(status);
CREATE INDEX IF NOT EXISTS idx_partner_event     ON partner_events(partner_club_id);

-- Google Sheets mirror queue and transactional change tracking.
-- Durable mirror queue. Triggers commit atomically with the source record.
CREATE TABLE IF NOT EXISTS sheets_sync (
  kind TEXT NOT NULL CHECK (kind IN ('order', 'registration')),
  record_id INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  pending INTEGER NOT NULL DEFAULT 1,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  synced_at TEXT,
  PRIMARY KEY (kind, record_id)
);
CREATE INDEX IF NOT EXISTS idx_sheets_pending ON sheets_sync(pending, kind, record_id);
CREATE TABLE IF NOT EXISTS sheets_sync_lock (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  owner TEXT,
  expires_at INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO sheets_sync_lock(id) VALUES (1);

CREATE TRIGGER IF NOT EXISTS sheets_orders_insert
AFTER INSERT ON orders
BEGIN
  INSERT INTO sheets_sync(kind, record_id) VALUES ('order', NEW.id)
  ON CONFLICT(kind, record_id) DO UPDATE SET version = version + 1, pending = 1, last_error = NULL;
END;

CREATE TRIGGER IF NOT EXISTS sheets_orders_update
AFTER UPDATE ON orders
BEGIN
  INSERT INTO sheets_sync(kind, record_id) VALUES ('order', NEW.id)
  ON CONFLICT(kind, record_id) DO UPDATE SET version = version + 1, pending = 1, last_error = NULL;
END;

INSERT OR IGNORE INTO sheets_sync(kind, record_id) SELECT 'order', id FROM orders;

CREATE TRIGGER IF NOT EXISTS sheets_registrations_insert
AFTER INSERT ON registrations
BEGIN
  INSERT INTO sheets_sync(kind, record_id) VALUES ('registration', NEW.id)
  ON CONFLICT(kind, record_id) DO UPDATE SET version = version + 1, pending = 1, last_error = NULL;
END;

CREATE TRIGGER IF NOT EXISTS sheets_registrations_update
AFTER UPDATE ON registrations
BEGIN
  INSERT INTO sheets_sync(kind, record_id) VALUES ('registration', NEW.id)
  ON CONFLICT(kind, record_id) DO UPDATE SET version = version + 1, pending = 1, last_error = NULL;
END;

INSERT OR IGNORE INTO sheets_sync(kind, record_id) SELECT 'registration', id FROM registrations;

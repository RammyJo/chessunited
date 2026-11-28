-- Chess United — Cloudflare D1 schema
--
-- Apply locally:  npx wrangler d1 execute chess-united --local --file=./schema.sql
-- Apply remotely: npx wrangler d1 execute chess-united --remote --file=./schema.sql
--
-- Prices are in Philippine pesos; delivery totals may include centavos. Timestamps are ISO-ish UTC strings.

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
  card_token_hash TEXT,
  -- The printed ID + lanyard is a paid option at PHP 200.
  printed_id     INTEGER NOT NULL DEFAULT 0,
  gcash_ref      TEXT,
  payment_status TEXT    NOT NULL DEFAULT 'pending',
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
  courier           TEXT    NOT NULL,                  -- lbc | jt | pickup (older orders may use other couriers)
  items_json        TEXT    NOT NULL,
  subtotal          INTEGER NOT NULL,
  shipping_note     TEXT,
  payment_method    TEXT    NOT NULL DEFAULT 'gcash',
  gcash_ref         TEXT,
  payment_status    TEXT    NOT NULL DEFAULT 'pending',
  fulfilment_status TEXT    NOT NULL DEFAULT 'new',    -- new | packed | shipped | delivered
  tracking_no       TEXT,
  shipping_fee      REAL,
  total             REAL,
  shipping_quote_json TEXT,
  payment_token_hash TEXT,
  payment_claimed_at TEXT,
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
  kind TEXT NOT NULL CHECK (kind IN ('order', 'registration', 'member')),
  record_id INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  pending INTEGER NOT NULL DEFAULT 1,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  synced_at TEXT,
  paid_snapshot TEXT,
  payment_checked_at INTEGER NOT NULL DEFAULT 0,
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

-- Operator-requested connection checks. Only D1/admin access can request one.
CREATE TABLE IF NOT EXISTS sheets_connection_check (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  requested INTEGER NOT NULL DEFAULT 0,
  owner TEXT,
  lease_until INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT,
  last_error TEXT
);
INSERT OR IGNORE INTO sheets_connection_check(id) VALUES (1);

-- Membership signups have their own private spreadsheet tab.
CREATE TRIGGER IF NOT EXISTS sheets_members_insert
AFTER INSERT ON members
BEGIN
  INSERT INTO sheets_sync(kind, record_id) VALUES ('member', NEW.id)
  ON CONFLICT(kind, record_id) DO UPDATE SET version = version + 1, pending = 1, last_error = NULL;
END;
CREATE TRIGGER IF NOT EXISTS sheets_members_update
AFTER UPDATE ON members
BEGIN
  INSERT INTO sheets_sync(kind, record_id) VALUES ('member', NEW.id)
  ON CONFLICT(kind, record_id) DO UPDATE SET version = version + 1, pending = 1, last_error = NULL;
END;

INSERT OR IGNORE INTO sheets_sync(kind, record_id) SELECT 'member', id FROM members;
CREATE TABLE IF NOT EXISTS shipping_settings (
 id INTEGER PRIMARY KEY CHECK (id = 1), config_json TEXT NOT NULL DEFAULT '{}', revision INTEGER NOT NULL DEFAULT 1
);
INSERT OR IGNORE INTO shipping_settings(id) VALUES(1);
CREATE TABLE IF NOT EXISTS shipping_quotes (
 id TEXT PRIMARY KEY, basket_json TEXT NOT NULL, courier TEXT NOT NULL, destination_id TEXT NOT NULL,
 shipping_fee REAL NOT NULL, subtotal REAL NOT NULL, details_json TEXT NOT NULL, config_revision INTEGER NOT NULL,
 expires_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_token ON orders(payment_token_hash) WHERE payment_token_hash IS NOT NULL;

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
CREATE UNIQUE INDEX IF NOT EXISTS idx_registration_person ON registrations(event_slug,email);
CREATE INDEX IF NOT EXISTS idx_shipping_quote_expiry ON shipping_quotes(expires_at);
CREATE TABLE IF NOT EXISTS security_check (
 id INTEGER PRIMARY KEY CHECK(id=1), requested INTEGER NOT NULL DEFAULT 0,
 checks_json TEXT, checked_at TEXT
);
INSERT OR IGNORE INTO security_check(id) VALUES(1);
-- A private, durable wake-up for the five-minute scheduler. No customer data.
CREATE TABLE IF NOT EXISTS sheets_schedule (
 id INTEGER PRIMARY KEY CHECK(id=1),
 requested_at INTEGER NOT NULL DEFAULT 0,
 last_tick_at INTEGER,
 completed_at INTEGER NOT NULL DEFAULT 0,
 finished_at INTEGER,
 owner TEXT,
 lease_until INTEGER NOT NULL DEFAULT 0,
 last_error TEXT
);
INSERT OR IGNORE INTO sheets_schedule(id) VALUES(1);

-- Aggregated site opens only. No visitor IDs, page URLs or per-visit timestamps.
CREATE TABLE IF NOT EXISTS analytics_daily (
 date TEXT PRIMARY KEY CHECK(length(date)=10),
 historical_opens INTEGER NOT NULL DEFAULT 0 CHECK(historical_opens>=0),
 recorded_opens INTEGER NOT NULL DEFAULT 0 CHECK(recorded_opens>=0)
);
CREATE TABLE IF NOT EXISTS analytics_config (
 id INTEGER PRIMARY KEY CHECK(id=1),
 history_from TEXT NOT NULL,
 history_through TEXT NOT NULL,
 live_from TEXT NOT NULL
);
INSERT OR IGNORE INTO analytics_config VALUES(1,'2026-11-02','2026-11-26','2026-11-27');
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-02',10) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-03',20) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-04',0) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-05',30) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-06',0) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-07',150) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-08',20) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-09',0) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-10',0) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-11',10) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-12',10) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-13',20) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-14',10) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-15',0) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-16',20) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-17',10) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-18',0) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-19',30) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-20',20) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-21',0) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-22',20) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-23',40) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-24',60) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-25',140) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;
INSERT INTO analytics_daily(date,historical_opens) VALUES('2026-11-26',60) ON CONFLICT(date) DO UPDATE SET historical_opens=excluded.historical_opens;

-- New club signup records; public responses and Sheet rows contain no member number.
CREATE TABLE IF NOT EXISTS club_registrations (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 identity_key TEXT NOT NULL UNIQUE,
 payload_fingerprint TEXT NOT NULL,
 full_name TEXT NOT NULL,
 age INTEGER NOT NULL CHECK(age BETWEEN 0 AND 120),
 date_of_birth TEXT NOT NULL,
 barangay TEXT NOT NULL,
 city TEXT NOT NULL,
 province TEXT NOT NULL,
 chess_club TEXT NOT NULL,
 chess_level TEXT NOT NULL CHECK(chess_level IN ('Beginner','Intermediate','Advanced')),
 ranking_source TEXT NOT NULL,
 chess_ranking TEXT NOT NULL,
 tournaments_played TEXT NOT NULL,
 guest_count INTEGER NOT NULL CHECK(guest_count BETWEEN 0 AND 100),
 guest_names TEXT NOT NULL,
 pending INTEGER NOT NULL DEFAULT 1,
 attempts INTEGER NOT NULL DEFAULT 0,
 last_error TEXT,
 synced_at TEXT,
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS club_registration_setup (
 id INTEGER PRIMARY KEY CHECK(id=1),
 enabled INTEGER NOT NULL DEFAULT 0,
 reset_requested INTEGER NOT NULL DEFAULT 0,
 reset_completed INTEGER NOT NULL DEFAULT 0,
 completed_at TEXT,
 last_error TEXT,
 result_json TEXT
);
INSERT OR IGNORE INTO club_registration_setup(id) VALUES(1);
CREATE INDEX IF NOT EXISTS idx_club_registration_pending ON club_registrations(pending,id);
CREATE TRIGGER IF NOT EXISTS club_registration_edit
AFTER UPDATE OF full_name,age,date_of_birth,barangay,city,province,chess_club,chess_level,ranking_source,chess_ranking,tournaments_played,guest_count,guest_names ON club_registrations
BEGIN
 UPDATE club_registrations SET pending=1,last_error=NULL WHERE id=NEW.id;
END;
-- Additive engagement tracking. Public reports expose aggregates only.
CREATE TABLE IF NOT EXISTS analytics_detail_config (
 id INTEGER PRIMARY KEY CHECK(id=1), live_from TEXT NOT NULL,
 history_from TEXT NOT NULL DEFAULT '2026-11-02', history_through TEXT NOT NULL DEFAULT '2026-11-26'
);
INSERT OR IGNORE INTO analytics_detail_config(id,live_from) VALUES(1,date('now','+8 hours'));
CREATE TABLE IF NOT EXISTS analytics_visitors (
 hash TEXT PRIMARY KEY, first_date TEXT NOT NULL, last_seen INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS analytics_visits (
 hash TEXT PRIMARY KEY, browser_hash TEXT, visitor_type TEXT NOT NULL CHECK(visitor_type IN ('new','returning','unidentified')),
 date TEXT NOT NULL, source TEXT NOT NULL, started_at INTEGER NOT NULL, last_activity INTEGER NOT NULL, last_page TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS analytics_visits_date ON analytics_visits(date);
CREATE TABLE IF NOT EXISTS analytics_pageviews (
 hash TEXT PRIMARY KEY, visit_hash TEXT NOT NULL REFERENCES analytics_visits(hash),
 date TEXT NOT NULL, path TEXT NOT NULL, opened_at INTEGER NOT NULL, last_activity INTEGER NOT NULL,
 opens INTEGER NOT NULL DEFAULT 1, active_ms INTEGER NOT NULL DEFAULT 0, scroll_depth INTEGER NOT NULL DEFAULT 0,
 form_started INTEGER NOT NULL DEFAULT 0, form_completed INTEGER NOT NULL DEFAULT 0, form_error INTEGER NOT NULL DEFAULT 0,
 outbound INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS analytics_pageviews_date ON analytics_pageviews(date,path);
CREATE INDEX IF NOT EXISTS analytics_pageviews_visit ON analytics_pageviews(visit_hash);
CREATE TABLE IF NOT EXISTS analytics_history_dimensions (
 date TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('source','page')), key TEXT NOT NULL, opens INTEGER NOT NULL,
 PRIMARY KEY(date,kind,key)
);

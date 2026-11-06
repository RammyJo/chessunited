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

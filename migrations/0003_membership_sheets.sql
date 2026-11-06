-- Expand the mirror queue without resetting existing sync history. Apply as one batch.
DROP TRIGGER IF EXISTS sheets_orders_insert;
DROP TRIGGER IF EXISTS sheets_orders_update;
DROP TRIGGER IF EXISTS sheets_registrations_insert;
DROP TRIGGER IF EXISTS sheets_registrations_update;
DROP TRIGGER IF EXISTS sheets_members_insert;
DROP TRIGGER IF EXISTS sheets_members_update;
CREATE TABLE sheets_sync_v2 (
  kind TEXT NOT NULL CHECK (kind IN ('order', 'registration', 'member')),
  record_id INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  pending INTEGER NOT NULL DEFAULT 1,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  synced_at TEXT,
  PRIMARY KEY (kind, record_id)
);
INSERT INTO sheets_sync_v2(kind,record_id,version,pending,attempts,last_error,synced_at) SELECT kind,record_id,version,pending,attempts,last_error,synced_at FROM sheets_sync;
DROP TABLE sheets_sync;
ALTER TABLE sheets_sync_v2 RENAME TO sheets_sync;
CREATE INDEX idx_sheets_pending ON sheets_sync(pending, kind, record_id);

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

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

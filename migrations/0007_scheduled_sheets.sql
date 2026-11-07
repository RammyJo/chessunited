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

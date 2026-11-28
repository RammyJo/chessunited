-- Private, one-time cleanup requested by the owner. No public reset endpoint.
CREATE TABLE IF NOT EXISTS sheets_cleanup (
 id INTEGER PRIMARY KEY CHECK(id=1), requested INTEGER NOT NULL DEFAULT 0,
 member_max INTEGER NOT NULL DEFAULT 0, order_max INTEGER NOT NULL DEFAULT 0,
 registration_max INTEGER NOT NULL DEFAULT 0, club_max INTEGER NOT NULL DEFAULT 0,
 submission_keys_json TEXT NOT NULL DEFAULT '[]', quote_ids_json TEXT NOT NULL DEFAULT '[]',
 requested_at TEXT, completed_at TEXT, last_error TEXT, result_json TEXT
);
INSERT OR IGNORE INTO sheets_cleanup(id) VALUES(1);

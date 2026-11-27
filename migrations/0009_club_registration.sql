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

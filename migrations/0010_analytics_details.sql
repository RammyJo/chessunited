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

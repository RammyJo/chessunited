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

-- Aggregate-only, no visitor/session identifiers; date is UTC.
CREATE TABLE IF NOT EXISTS conversion_daily (
  day TEXT NOT NULL,
  event TEXT NOT NULL,
  action TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  PRIMARY KEY (day, event, action)
) WITHOUT ROWID;

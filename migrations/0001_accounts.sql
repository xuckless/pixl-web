-- DRAFT: accounts, licences and devices for the account system (not applied;
-- no D1 database is bound yet). Lemon Squeezy stays the source of truth for
-- orders, keys and activation limits; these tables tie them to an account and
-- mirror what the website shows, filled by the webhook (worker/api.ts) and by
-- calls to Lemon Squeezy's API with the store's API key.
--   wrangler d1 create pixl-accounts
--   wrangler d1 migrations apply pixl-accounts --remote

CREATE TABLE users (
  id          TEXT PRIMARY KEY,               -- our id (uuid)
  email       TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name        TEXT,
  ls_customer_id INTEGER UNIQUE,              -- Lemon Squeezy customer
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- One row per licence key (one per purchase of a product).
CREATE TABLE licences (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  product         TEXT NOT NULL,              -- 'playroom', 'space'
  ls_order_id     INTEGER NOT NULL,
  ls_license_key_id INTEGER NOT NULL UNIQUE,
  key_hint        TEXT NOT NULL,              -- last four characters; the key itself stays in Lemon Squeezy
  status          TEXT NOT NULL,              -- active, inactive, expired, disabled
  activation_limit INTEGER NOT NULL DEFAULT 3,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX licences_user ON licences (user_id);

-- Active devices (Lemon Squeezy "instances"); a deactivated one is deleted.
CREATE TABLE devices (
  instance_id   TEXT PRIMARY KEY,             -- Lemon Squeezy instance id
  licence_id    TEXT NOT NULL REFERENCES licences (id) ON DELETE CASCADE,
  name          TEXT NOT NULL,                -- "Studio (macOS)"
  activated_at  TEXT NOT NULL,
  last_seen_at  TEXT
);
CREATE INDEX devices_licence ON devices (licence_id);

-- Every webhook, once: Lemon Squeezy retries, so handling must be idempotent.
CREATE TABLE webhook_events (
  id          TEXT PRIMARY KEY,               -- event name + data id + updated_at
  event_name  TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  payload     TEXT NOT NULL
);

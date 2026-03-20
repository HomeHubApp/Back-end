-- ── 1. HOMES ─────────────────────────────────────────────────────────────────
-- A user can have multiple homes (house, office, studio etc.)
CREATE TABLE IF NOT EXISTS homes (
  id          SERIAL PRIMARY KEY,
  user_id     INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,                -- e.g. "My House", "Office"
  type        VARCHAR(50)  NOT NULL DEFAULT 'residential', -- 'residential', 'office', 'studio'
  address     VARCHAR(255),
  city        VARCHAR(100),
  country     VARCHAR(100),
  is_primary  BOOLEAN      NOT NULL DEFAULT FALSE,  -- user's main home
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homes_user ON homes (user_id);

-- ── 2. DEVICES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS devices (
  id            SERIAL PRIMARY KEY,
  home_id       INT          NOT NULL REFERENCES homes(id)  ON DELETE CASCADE,
  room_id       INT,                                         -- nullable until assigned
  name          VARCHAR(100) NOT NULL,
  category      VARCHAR(50)  NOT NULL,  -- 'light','door','ac','camera','sensor','alarm'
  mac_address   VARCHAR(17),            -- e.g. AA:BB:CC:DD:EE:FF
  ip_address    VARCHAR(45),
  is_online     BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,  -- FALSE = soft deleted
  last_seen     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_home     ON devices (home_id);
CREATE INDEX IF NOT EXISTS idx_devices_category ON devices (category);
CREATE INDEX IF NOT EXISTS idx_devices_online   ON devices (is_online);

-- ── 3. DEVICE_STATUS ─────────────────────────────────────────────────────────
-- Stores current state of each device.
-- One device can have multiple status rows (on_off + brightness + color etc.)
CREATE TABLE IF NOT EXISTS device_status (
  id           SERIAL PRIMARY KEY,
  device_id    INT          NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  status_type  VARCHAR(50)  NOT NULL,  -- 'on_off', 'brightness', 'temperature', 'locked'
  status_value VARCHAR(100) NOT NULL,  -- '1', '0', '75', '22', 'locked', 'unlocked'
  status_unit  VARCHAR(20),            -- '%', '°C' — nullable
  recorded_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (device_id, status_type)      -- one row per status type per device
);

CREATE INDEX IF NOT EXISTS idx_device_status_device ON device_status (device_id);
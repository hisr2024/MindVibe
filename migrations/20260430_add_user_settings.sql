-- Add the user_settings table backing /api/profile/settings.
--
-- One row per user. The columns are an exact 1:1 mirror of the
-- SettingsOut Pydantic model in backend/routes/profile.py so the GET
-- handler can SELECT into it without a translation layer.
--
-- Defaults match the SettingsOut() defaults so an INSERT with only
-- (user_id) yields the canonical first-launch experience.

CREATE TABLE IF NOT EXISTS user_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE
    REFERENCES users(id) ON DELETE CASCADE,

  notifications_enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  daily_verse_enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  weekly_reflection_enabled   BOOLEAN NOT NULL DEFAULT TRUE,

  voice_persona  VARCHAR(32) NOT NULL DEFAULT 'guidance',
  voice_language VARCHAR(16) NOT NULL DEFAULT 'en-IN',
  sakha_tone     VARCHAR(32) NOT NULL DEFAULT 'warm',

  theme           VARCHAR(16) NOT NULL DEFAULT 'system',
  haptics_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- Soft-delete + audit timestamps; mirror the SoftDeleteMixin shape
  -- used by every other domain table.
  deleted_at  TIMESTAMPTZ NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS user_settings_user_id_idx
  ON user_settings (user_id)
  WHERE deleted_at IS NULL;

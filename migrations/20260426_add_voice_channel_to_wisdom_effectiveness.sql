ALTER TABLE wisdom_effectiveness
  ADD COLUMN IF NOT EXISTS delivery_channel VARCHAR(32) NOT NULL DEFAULT 'text';

ALTER TABLE wisdom_effectiveness
  ADD COLUMN IF NOT EXISTS voice_specific_outcomes JSON;

CREATE INDEX IF NOT EXISTS ix_wisdom_effectiveness_delivery_channel
  ON wisdom_effectiveness (delivery_channel);

CREATE INDEX IF NOT EXISTS ix_wisdom_effectiveness_channel_delivered_at
  ON wisdom_effectiveness (delivery_channel, delivered_at DESC);

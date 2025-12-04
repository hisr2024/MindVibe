-- Migration: Add mental health columns to gita_verses table
-- Date: 2025-12-07
-- Description: Adds mental health application tags to gita_verses for KIAAN wisdom engine integration

-- Add mental_health_applications column as JSON array (nullable)
ALTER TABLE gita_verses 
ADD COLUMN IF NOT EXISTS mental_health_applications JSON NULL;

-- Add primary_domain column for emotional categorization (nullable)
ALTER TABLE gita_verses 
ADD COLUMN IF NOT EXISTS primary_domain VARCHAR(64) NULL;

-- Add secondary_domains column as JSON array (nullable)
ALTER TABLE gita_verses 
ADD COLUMN IF NOT EXISTS secondary_domains JSON NULL;

-- Create index on primary_domain for faster filtering
CREATE INDEX IF NOT EXISTS idx_gita_verses_primary_domain 
ON gita_verses(primary_domain);

-- Add comments explaining the columns
COMMENT ON COLUMN gita_verses.mental_health_applications IS 'JSON array of mental health application tags (e.g., anxiety_management, stress_reduction)';
COMMENT ON COLUMN gita_verses.primary_domain IS 'Primary emotional/mental health domain (e.g., anxiety, grief, anger)';
COMMENT ON COLUMN gita_verses.secondary_domains IS 'JSON array of secondary emotional domains this verse applies to';

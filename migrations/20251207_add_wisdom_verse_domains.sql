-- Migration: Add primary_domain and secondary_domains columns to wisdom_verses
-- Date: 2025-12-07
-- Description: Adds domain categorization columns to wisdom_verses table for better verse filtering

-- Add primary_domain column (nullable for existing verses)
ALTER TABLE wisdom_verses 
ADD COLUMN IF NOT EXISTS primary_domain VARCHAR(64) NULL;

-- Add secondary_domains column as JSON array (nullable)
ALTER TABLE wisdom_verses 
ADD COLUMN IF NOT EXISTS secondary_domains JSON NULL;

-- Create index on primary_domain for faster filtering
CREATE INDEX IF NOT EXISTS idx_wisdom_verses_primary_domain 
ON wisdom_verses(primary_domain);

-- Optional: Add comment explaining the columns
COMMENT ON COLUMN wisdom_verses.primary_domain IS 'Primary thematic domain of the verse (e.g., anxiety, grief, anger)';
COMMENT ON COLUMN wisdom_verses.secondary_domains IS 'JSON array of secondary domains this verse applies to';

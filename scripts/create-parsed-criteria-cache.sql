-- Create parsed_criteria_cache table for persistent caching
-- This improves performance by caching AI-parsed eligibility criteria

CREATE TABLE IF NOT EXISTS parsed_criteria_cache (
  "nctId" TEXT PRIMARY KEY,
  criteria JSON NOT NULL,
  "rawText" TEXT NOT NULL,
  version VARCHAR(10) NOT NULL DEFAULT '1.0',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on createdAt for cleanup queries
CREATE INDEX IF NOT EXISTS idx_parsed_criteria_cache_created 
ON parsed_criteria_cache("createdAt");

-- Add comment to table
COMMENT ON TABLE parsed_criteria_cache IS 'Cache for AI-parsed eligibility criteria to avoid redundant API calls';
COMMENT ON COLUMN parsed_criteria_cache."nctId" IS 'NCT ID of the clinical trial';
COMMENT ON COLUMN parsed_criteria_cache.criteria IS 'Array of InterpretedCriterion objects';
COMMENT ON COLUMN parsed_criteria_cache."rawText" IS 'Original eligibility criteria text';
COMMENT ON COLUMN parsed_criteria_cache.version IS 'Schema version for future migrations';
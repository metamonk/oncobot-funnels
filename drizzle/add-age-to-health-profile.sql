-- Add age field to health_profile table
ALTER TABLE health_profile ADD COLUMN IF NOT EXISTS age INTEGER;

-- Add index for age queries (useful for eligibility filtering)
CREATE INDEX IF NOT EXISTS idx_health_profile_age ON health_profile(age);
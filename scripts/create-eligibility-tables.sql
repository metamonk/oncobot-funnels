-- Create eligibility_check table
CREATE TABLE IF NOT EXISTS eligibility_check (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "trialId" TEXT NOT NULL,
  "nctId" TEXT NOT NULL,
  "trialTitle" TEXT NOT NULL,
  "healthProfileId" TEXT,
  status VARCHAR DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  "eligibilityStatus" VARCHAR CHECK ("eligibilityStatus" IN ('LIKELY_ELIGIBLE', 'POSSIBLY_ELIGIBLE', 'UNCERTAIN', 'LIKELY_INELIGIBLE', 'INELIGIBLE')),
  "eligibilityScore" INTEGER,
  confidence VARCHAR CHECK (confidence IN ('high', 'medium', 'low')),
  criteria JSON,
  questions JSON,
  responses JSON,
  assessment JSON,
  "matchedCriteria" JSON,
  "unmatchedCriteria" JSON,
  "uncertainCriteria" JSON,
  visibility VARCHAR NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
  "shareToken" TEXT,
  "emailRequested" BOOLEAN NOT NULL DEFAULT false,
  "emailAddress" TEXT,
  "emailSentAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  duration INTEGER,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  "consentGiven" BOOLEAN NOT NULL DEFAULT false,
  "disclaimerAccepted" BOOLEAN NOT NULL DEFAULT false,
  "dataRetentionConsent" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create eligibility_response table
CREATE TABLE IF NOT EXISTS eligibility_response (
  id TEXT PRIMARY KEY,
  "checkId" TEXT NOT NULL REFERENCES eligibility_check(id) ON DELETE CASCADE,
  "questionId" TEXT NOT NULL,
  "criterionId" TEXT NOT NULL,
  response JSON NOT NULL,
  confidence VARCHAR CHECK (confidence IN ('HIGH', 'MEDIUM', 'LOW')),
  notes TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_eligibility_check_user_id ON eligibility_check("userId");
CREATE INDEX IF NOT EXISTS idx_eligibility_check_nct_id ON eligibility_check("nctId");
CREATE INDEX IF NOT EXISTS idx_eligibility_check_share_token ON eligibility_check("shareToken");
CREATE INDEX IF NOT EXISTS idx_eligibility_response_check_id ON eligibility_response("checkId");
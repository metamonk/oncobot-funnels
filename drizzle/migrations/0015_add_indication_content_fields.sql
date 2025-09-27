-- Add content fields to indications table for old landing page design
ALTER TABLE "indications" ADD COLUMN "supportingText" json;
ALTER TABLE "indications" ADD COLUMN "valueProps" json;
ALTER TABLE "indications" ADD COLUMN "ctaPrimaryText" text;
ALTER TABLE "indications" ADD COLUMN "ctaSecondaryText" text;

-- Update existing indications with default content
UPDATE "indications"
SET
  "supportingText" = '["See potential trial options near your ZIP", "Talk to a coordinator about next steps", "No cost. No obligation"]'::json,
  "valueProps" = '["Access to investigational treatments in clinical trials", "Close monitoring by cancer specialists", "All trial costs covered by sponsors", "Participation in research studying new approaches"]'::json,
  "ctaPrimaryText" = 'Start Eligibility Check',
  "ctaSecondaryText" = 'Takes ~2 minutes'
WHERE "slug" = 'lung-cancer';

UPDATE "indications"
SET
  "supportingText" = '["See potential trial options near your ZIP", "Talk to a coordinator about next steps", "No cost. No obligation"]'::json,
  "valueProps" = '["Access to investigational treatments", "Expert oncology team monitoring", "No cost for trial medications", "Contribute to advancing cancer care"]'::json,
  "ctaPrimaryText" = 'Start Eligibility Check',
  "ctaSecondaryText" = 'Takes ~2 minutes'
WHERE "slug" = 'prostate-cancer';

UPDATE "indications"
SET
  "supportingText" = '["See potential trial options near your ZIP", "Talk to a coordinator about next steps", "No cost. No obligation"]'::json,
  "valueProps" = '["First access to innovative treatments", "Comprehensive care from specialists", "All study-related costs covered", "Additional options to explore with your doctor"]'::json,
  "ctaPrimaryText" = 'Start Eligibility Check',
  "ctaSecondaryText" = 'Takes ~2 minutes'
WHERE "slug" = 'colorectal-cancer';
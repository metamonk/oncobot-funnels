-- Add new columns to indications table
ALTER TABLE "indications" ADD COLUMN IF NOT EXISTS "isFeatured" boolean DEFAULT false NOT NULL;
ALTER TABLE "indications" ADD COLUMN IF NOT EXISTS "heroHeadline" text;
ALTER TABLE "indications" ADD COLUMN IF NOT EXISTS "heroSubheadline" text;

-- Add new columns to landing_pages table (without unique constraint initially)
ALTER TABLE "landing_pages" ADD COLUMN IF NOT EXISTS "slug" varchar(100);
ALTER TABLE "landing_pages" ADD COLUMN IF NOT EXISTS "indicationId" text;

-- Update existing landing pages with slugs based on path
UPDATE "landing_pages" SET "slug" =
  CASE
    WHEN "path" = '/' THEN 'home'
    WHEN "path" = '/contact' THEN 'contact'
    WHEN "path" = '/membership' THEN 'membership'
    WHEN "path" = '/about' THEN 'about'
    ELSE LOWER(REPLACE(REPLACE("path", '/', ''), ' ', '-'))
  END
WHERE "slug" IS NULL;

-- Now add unique constraint after setting values
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_slug_unique" UNIQUE ("slug");
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_indicationId_fkey" FOREIGN KEY ("indicationId") REFERENCES "indications"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Create ad_campaigns table
CREATE TABLE IF NOT EXISTS "ad_campaigns" (
  "id" text PRIMARY KEY NOT NULL,
  "name" varchar(100) NOT NULL,
  "indicationId" text,
  "status" varchar(20) DEFAULT 'draft' NOT NULL,
  "utmCampaign" varchar(100),
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ad_campaigns_indicationId_fkey" FOREIGN KEY ("indicationId") REFERENCES "indications"("id") ON DELETE SET NULL ON UPDATE NO ACTION
);

-- Create ads table
CREATE TABLE IF NOT EXISTS "ads" (
  "id" text PRIMARY KEY NOT NULL,
  "campaignId" text NOT NULL,
  "headlineId" text,
  "landingPageId" text,
  "finalUrl" text,
  "isActive" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ads_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "ads_headlineId_fkey" FOREIGN KEY ("headlineId") REFERENCES "ad_headlines"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT "ads_landingPageId_fkey" FOREIGN KEY ("landingPageId") REFERENCES "landing_pages"("id") ON DELETE SET NULL ON UPDATE NO ACTION
);

-- Create indexes for better performance (these are at the end after all tables are created)
CREATE INDEX IF NOT EXISTS "ad_campaigns_indicationId_idx" ON "ad_campaigns"("indicationId");
CREATE INDEX IF NOT EXISTS "ads_campaignId_idx" ON "ads"("campaignId");
CREATE INDEX IF NOT EXISTS "ads_headlineId_idx" ON "ads"("headlineId");
CREATE INDEX IF NOT EXISTS "ads_landingPageId_idx" ON "ads"("landingPageId");
CREATE INDEX IF NOT EXISTS "landing_pages_indicationId_idx" ON "landing_pages"("indicationId");
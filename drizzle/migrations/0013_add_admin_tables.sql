-- Create indications table for cancer types
CREATE TABLE IF NOT EXISTS "indications" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "slug" text UNIQUE NOT NULL,
  "isActive" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

-- Create landing pages registry table
CREATE TABLE IF NOT EXISTS "landing_pages" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "path" text NOT NULL,
  "description" text,
  "isActive" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

-- Create ad headlines table (main content management)
CREATE TABLE IF NOT EXISTS "ad_headlines" (
  "id" text PRIMARY KEY NOT NULL,
  "indicationId" text REFERENCES "indications"("id") ON DELETE CASCADE,

  -- Google Ads text components with character limits
  "headline" varchar(30) NOT NULL,
  "longHeadline" varchar(90) NOT NULL,
  "description" varchar(90) NOT NULL,

  -- Configuration
  "landingPageId" text REFERENCES "landing_pages"("id") ON DELETE SET NULL,
  "category" text,
  "isActive" boolean DEFAULT false NOT NULL,

  -- Performance metrics (updated from analytics)
  "impressions" integer DEFAULT 0 NOT NULL,
  "clicks" integer DEFAULT 0 NOT NULL,
  "conversions" integer DEFAULT 0 NOT NULL,

  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "ad_headlines_indication_idx" ON "ad_headlines"("indicationId");
CREATE INDEX IF NOT EXISTS "ad_headlines_landing_page_idx" ON "ad_headlines"("landingPageId");
CREATE INDEX IF NOT EXISTS "ad_headlines_active_idx" ON "ad_headlines"("isActive");

-- Seed initial indications
INSERT INTO "indications" ("id", "name", "slug") VALUES
  ('ind_lung', 'Lung Cancer', 'lung-cancer'),
  ('ind_prostate', 'Prostate Cancer', 'prostate-cancer'),
  ('ind_gi', 'GI Cancer', 'gi-cancer'),
  ('ind_breast', 'Breast Cancer', 'breast-cancer'),
  ('ind_colorectal', 'Colorectal Cancer', 'colorectal-cancer')
ON CONFLICT DO NOTHING;

-- Seed initial landing pages
INSERT INTO "landing_pages" ("id", "name", "path", "description") VALUES
  ('lp_home', 'Homepage', '/', 'Main landing page with general information'),
  ('lp_contact', 'Contact Form', '/contact', 'Patient information submission form'),
  ('lp_membership', 'Site Membership', '/membership', 'Clinical trial site partnership page'),
  ('lp_about', 'About Us', '/about', 'Information about our services')
ON CONFLICT DO NOTHING;
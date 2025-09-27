-- Drop the old ads table
DROP TABLE IF EXISTS ads;

-- Add Performance Max fields to ad_campaigns
ALTER TABLE ad_campaigns
ADD COLUMN IF NOT EXISTS campaign_type VARCHAR(50) DEFAULT 'performance_max' NOT NULL,
ADD COLUMN IF NOT EXISTS budget INTEGER,
ADD COLUMN IF NOT EXISTS target_roas INTEGER;

-- Create asset_groups table
CREATE TABLE IF NOT EXISTS asset_groups (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  theme VARCHAR(100),
  audience_signal JSONB,
  landing_page_id TEXT REFERENCES landing_pages(id) ON DELETE SET NULL,
  final_url TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  impressions INTEGER DEFAULT 0 NOT NULL,
  clicks INTEGER DEFAULT 0 NOT NULL,
  conversions INTEGER DEFAULT 0 NOT NULL,
  cost INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create asset_group_assets table
CREATE TABLE IF NOT EXISTS asset_group_assets (
  id TEXT PRIMARY KEY,
  asset_group_id TEXT NOT NULL REFERENCES asset_groups(id) ON DELETE CASCADE,
  asset_type VARCHAR(50) NOT NULL,
  asset_id TEXT,
  text_content TEXT,
  performance_rating VARCHAR(20),
  impressions INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_asset_groups_campaign_id ON asset_groups(campaign_id);
CREATE INDEX IF NOT EXISTS idx_asset_group_assets_group_id ON asset_group_assets(asset_group_id);
CREATE INDEX IF NOT EXISTS idx_asset_group_assets_asset_id ON asset_group_assets(asset_id);
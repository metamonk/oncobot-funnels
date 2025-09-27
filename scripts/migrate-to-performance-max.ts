import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';

async function migrateToPerformanceMax() {
  console.log('Migrating to Performance Max structure...');

  try {
    // Drop the old ads table
    console.log('Dropping old ads table...');
    await db.execute(sql`DROP TABLE IF EXISTS ads CASCADE`);
    console.log('✅ Dropped ads table');

    // Add Performance Max fields to ad_campaigns
    console.log('Adding Performance Max fields to campaigns...');
    await db.execute(sql`
      ALTER TABLE ad_campaigns
      ADD COLUMN IF NOT EXISTS campaign_type VARCHAR(50) DEFAULT 'performance_max' NOT NULL,
      ADD COLUMN IF NOT EXISTS budget INTEGER,
      ADD COLUMN IF NOT EXISTS target_roas INTEGER
    `);
    console.log('✅ Added Performance Max fields to campaigns');

    // Create asset_groups table
    console.log('Creating asset_groups table...');
    await db.execute(sql`
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
      )
    `);
    console.log('✅ Created asset_groups table');

    // Create asset_group_assets table
    console.log('Creating asset_group_assets table...');
    await db.execute(sql`
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
      )
    `);
    console.log('✅ Created asset_group_assets table');

    // Create indexes for performance
    console.log('Creating indexes...');
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_asset_groups_campaign_id ON asset_groups(campaign_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_asset_group_assets_group_id ON asset_group_assets(asset_group_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_asset_group_assets_asset_id ON asset_group_assets(asset_id)`);
    console.log('✅ Created indexes');

    console.log('🎉 Performance Max migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migrateToPerformanceMax();
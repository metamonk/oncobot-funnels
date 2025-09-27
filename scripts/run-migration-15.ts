import { db } from '@/lib/db/drizzle';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('Running migration 0015...');

  try {
    // Add content fields to indications table
    await db.execute(sql`ALTER TABLE "indications" ADD COLUMN IF NOT EXISTS "supportingText" json`);
    await db.execute(sql`ALTER TABLE "indications" ADD COLUMN IF NOT EXISTS "valueProps" json`);
    await db.execute(sql`ALTER TABLE "indications" ADD COLUMN IF NOT EXISTS "ctaPrimaryText" text`);
    await db.execute(sql`ALTER TABLE "indications" ADD COLUMN IF NOT EXISTS "ctaSecondaryText" text`);

    console.log('✅ Added columns to indications table');

    // Update existing indications with default content
    await db.execute(sql`
      UPDATE "indications"
      SET
        "supportingText" = '["See potential trial options near your ZIP", "Talk to a coordinator about next steps", "No cost. No obligation"]'::json,
        "valueProps" = '["Access to investigational treatments in clinical trials", "Close monitoring by cancer specialists", "All trial costs covered by sponsors", "Participation in research studying new approaches"]'::json,
        "ctaPrimaryText" = 'Start Eligibility Check',
        "ctaSecondaryText" = 'Takes ~2 minutes'
      WHERE "slug" = 'lung-cancer' AND "supportingText" IS NULL
    `);

    await db.execute(sql`
      UPDATE "indications"
      SET
        "supportingText" = '["See potential trial options near your ZIP", "Talk to a coordinator about next steps", "No cost. No obligation"]'::json,
        "valueProps" = '["Access to investigational treatments", "Expert oncology team monitoring", "No cost for trial medications", "Contribute to advancing cancer care"]'::json,
        "ctaPrimaryText" = 'Start Eligibility Check',
        "ctaSecondaryText" = 'Takes ~2 minutes'
      WHERE "slug" = 'prostate-cancer' AND "supportingText" IS NULL
    `);

    await db.execute(sql`
      UPDATE "indications"
      SET
        "supportingText" = '["See potential trial options near your ZIP", "Talk to a coordinator about next steps", "No cost. No obligation"]'::json,
        "valueProps" = '["First access to innovative treatments", "Comprehensive care from specialists", "All study-related costs covered", "Additional options to explore with your doctor"]'::json,
        "ctaPrimaryText" = 'Start Eligibility Check',
        "ctaSecondaryText" = 'Takes ~2 minutes'
      WHERE "slug" = 'colorectal-cancer' AND "supportingText" IS NULL
    `);

    console.log('✅ Updated existing indications with content');
    console.log('🎉 Migration 0015 completed successfully!');

  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }

  process.exit(0);
}

runMigration();
import 'dotenv/config';
import { db } from '@/lib/db/drizzle';
import { sql } from 'drizzle-orm';

async function applySchemaUpdates() {
  try {
    console.log('Applying schema updates...');

    // Update indications table
    try {
      await db.execute(sql`ALTER TABLE "indications" ADD COLUMN IF NOT EXISTS "isFeatured" boolean DEFAULT false NOT NULL`);
      console.log('✅ Added isFeatured column to indications');
    } catch (e) {
      console.log('⚠️ isFeatured column may already exist');
    }

    try {
      await db.execute(sql`ALTER TABLE "indications" ADD COLUMN IF NOT EXISTS "heroHeadline" text`);
      console.log('✅ Added heroHeadline column to indications');
    } catch (e) {
      console.log('⚠️ heroHeadline column may already exist');
    }

    try {
      await db.execute(sql`ALTER TABLE "indications" ADD COLUMN IF NOT EXISTS "heroSubheadline" text`);
      console.log('✅ Added heroSubheadline column to indications');
    } catch (e) {
      console.log('⚠️ heroSubheadline column may already exist');
    }

    // Update landing_pages table
    try {
      await db.execute(sql`ALTER TABLE "landing_pages" ADD COLUMN IF NOT EXISTS "slug" varchar(100)`);
      console.log('✅ Added slug column to landing_pages');
    } catch (e) {
      console.log('⚠️ slug column may already exist');
    }

    try {
      await db.execute(sql`ALTER TABLE "landing_pages" ADD COLUMN IF NOT EXISTS "indicationId" text`);
      console.log('✅ Added indicationId column to landing_pages');
    } catch (e) {
      console.log('⚠️ indicationId column may already exist');
    }

    // Update existing landing pages with slugs
    await db.execute(sql`
      UPDATE "landing_pages" SET "slug" =
        CASE
          WHEN "path" = '/' THEN 'home'
          WHEN "path" = '/contact' THEN 'contact'
          WHEN "path" = '/membership' THEN 'membership'
          WHEN "path" = '/about' THEN 'about'
          ELSE LOWER(REPLACE(REPLACE("path", '/', ''), ' ', '-'))
        END
      WHERE "slug" IS NULL
    `);
    console.log('✅ Updated existing landing pages with slugs');

    // Create ad_campaigns table
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "ad_campaigns" (
          "id" text PRIMARY KEY NOT NULL,
          "name" varchar(100) NOT NULL,
          "indicationId" text,
          "status" varchar(20) DEFAULT 'draft' NOT NULL,
          "utmCampaign" varchar(100),
          "createdAt" timestamp DEFAULT now() NOT NULL,
          "updatedAt" timestamp DEFAULT now() NOT NULL,
          CONSTRAINT "ad_campaigns_indicationId_fkey" FOREIGN KEY ("indicationId") REFERENCES "indications"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        )
      `);
      console.log('✅ Created ad_campaigns table');
    } catch (e) {
      console.log('⚠️ ad_campaigns table may already exist');
    }

    // Create ads table
    try {
      await db.execute(sql`
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
        )
      `);
      console.log('✅ Created ads table');
    } catch (e) {
      console.log('⚠️ ads table may already exist');
    }

    console.log('🎉 Schema updates completed successfully!');
  } catch (error) {
    console.error('❌ Schema update failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

applySchemaUpdates();
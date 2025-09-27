import { db } from '@/lib/db/drizzle';
import { adHeadlines, indications, landingPages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import HeadlinesClient from './HeadlinesClient';

async function getHeadlines() {
  const results = await db
    .select()
    .from(adHeadlines)
    .leftJoin(indications, eq(adHeadlines.indicationId, indications.id))
    .leftJoin(landingPages, eq(adHeadlines.landingPageId, landingPages.id))
    .orderBy(adHeadlines.createdAt);

  // Transform the results to match the expected interface
  const headlines = results.map(row => ({
    ...row.ad_headlines,
    indication: row.indications || null,
    landingPage: row.landing_pages || null,
  }));

  return headlines;
}

async function getStats() {
  const totalHeadlines = await db.select().from(adHeadlines);
  const activeHeadlines = totalHeadlines.filter(h => h.isActive);
  const totalClicks = totalHeadlines.reduce((sum, h) => sum + h.clicks, 0);
  const totalConversions = totalHeadlines.reduce((sum, h) => sum + h.conversions, 0);

  return {
    total: totalHeadlines.length,
    active: activeHeadlines.length,
    clicks: totalClicks,
    conversions: totalConversions,
  };
}

export default async function HeadlinesPage() {
  const headlines = await getHeadlines();
  const stats = await getStats();
  const allIndications = await db.select().from(indications).orderBy(indications.name);
  const allLandingPages = await db.select().from(landingPages).orderBy(landingPages.name);

  return (
    <HeadlinesClient
      initialHeadlines={headlines}
      indications={allIndications}
      landingPages={allLandingPages}
      stats={stats}
    />
  );
}
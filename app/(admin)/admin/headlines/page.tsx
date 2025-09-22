import { db } from '@/lib/db/drizzle';
import { adHeadlines, indications, landingPages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import HeadlinesClient from './HeadlinesClient';

async function getHeadlines() {
  const headlines = await db
    .select({
      id: adHeadlines.id,
      headline: adHeadlines.headline,
      longHeadline: adHeadlines.longHeadline,
      description: adHeadlines.description,
      isActive: adHeadlines.isActive,
      category: adHeadlines.category,
      clicks: adHeadlines.clicks,
      conversions: adHeadlines.conversions,
      indication: {
        id: indications.id,
        name: indications.name,
        slug: indications.slug,
      },
      landingPage: {
        id: landingPages.id,
        name: landingPages.name,
        path: landingPages.path,
      },
    })
    .from(adHeadlines)
    .leftJoin(indications, eq(adHeadlines.indicationId, indications.id))
    .leftJoin(landingPages, eq(adHeadlines.landingPageId, landingPages.id))
    .orderBy(adHeadlines.createdAt);

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
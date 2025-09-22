import { db } from '@/lib/db/drizzle';
import { landingPages, adHeadlines } from '@/lib/db/schema';
import LandingPagesClient from './LandingPagesClient';

async function getLandingPagesWithCounts() {
  const allPages = await db.select().from(landingPages).orderBy(landingPages.name);
  const headlines = await db.select().from(adHeadlines);

  return allPages.map(page => {
    const headlineCount = headlines.filter(h => h.landingPageId === page.id).length;
    return {
      ...page,
      headlineCount,
    };
  });
}

export default async function LandingPagesPage() {
  const pagesWithCounts = await getLandingPagesWithCounts();

  return (
    <LandingPagesClient initialPages={pagesWithCounts} />
  );
}
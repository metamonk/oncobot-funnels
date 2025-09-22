import { db } from '@/lib/db/drizzle';
import { indications, adHeadlines } from '@/lib/db/schema';
import IndicationsClient from './IndicationsClient';

async function getIndicationsWithCounts() {
  const allIndications = await db.select().from(indications).orderBy(indications.name);
  const headlines = await db.select().from(adHeadlines);

  return allIndications.map(indication => {
    const headlineCount = headlines.filter(h => h.indicationId === indication.id).length;
    return {
      ...indication,
      headlineCount,
    };
  });
}

export default async function IndicationsPage() {
  const indicationsWithCounts = await getIndicationsWithCounts();

  return (
    <IndicationsClient initialIndications={indicationsWithCounts} />
  );
}
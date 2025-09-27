import { Suspense } from 'react';
import { getTrialCounts } from '@/lib/clinical-trials-count';
import { db } from '@/lib/db/drizzle';
import { indications } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import HomePageClient from './HomePageClient';

/**
 * Home page server component
 * Fetches trial counts and featured indications, passes them to client component
 */
export default async function HomePage() {
  // Fetch trial counts on the server (cached for 24 hours)
  let trialCounts: Record<string, string> = {};

  try {
    trialCounts = await getTrialCounts();
  } catch (error) {
    console.warn('Failed to fetch trial counts, using fallbacks:', error);
    // Fallbacks are handled in the client component
  }

  // Fetch featured indications from database
  const featuredIndications = await db
    .select({
      id: indications.id,
      name: indications.name,
      slug: indications.slug,
      heroHeadline: indications.heroHeadline,
      heroSubheadline: indications.heroSubheadline,
    })
    .from(indications)
    .where(
      and(
        eq(indications.isActive, true),
        eq(indications.isFeatured, true)
      )
    )
    .limit(3);

  return (
    <Suspense fallback={<HomePageClient />}>
      <HomePageClient
        trialCounts={trialCounts}
        featuredIndications={featuredIndications}
      />
    </Suspense>
  );
}
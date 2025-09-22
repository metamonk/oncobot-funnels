import { Suspense } from 'react';
import { getTrialCounts } from '@/lib/clinical-trials-count';
import HomePageClient from './HomePageClient';

/**
 * Home page server component
 * Fetches trial counts and passes them to client component
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

  return (
    <Suspense fallback={<HomePageClient />}>
      <HomePageClient trialCounts={trialCounts} />
    </Suspense>
  );
}
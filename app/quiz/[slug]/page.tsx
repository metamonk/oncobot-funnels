import { notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { indications, landingPages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Suspense } from 'react';
import { QuizPageClient } from './QuizPageClient';

// Force dynamic rendering to capture query params
export const dynamic = 'force-dynamic';

interface QuizPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    hid?: string; // headline ID from ads
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
}

export default async function QuizPage({ params, searchParams }: QuizPageProps) {
  // Await params as required in Next.js 15
  const awaitedParams = await params;
  const awaitedSearchParams = await searchParams;

  // Fetch the landing page and indication data
  const landingPage = await db
    .select({
      id: landingPages.id,
      name: landingPages.name,
      slug: landingPages.slug,
      indicationId: landingPages.indicationId,
      indication: {
        id: indications.id,
        name: indications.name,
        slug: indications.slug,
      }
    })
    .from(landingPages)
    .leftJoin(indications, eq(landingPages.indicationId, indications.id))
    .where(
      and(
        eq(landingPages.slug, awaitedParams.slug),
        eq(landingPages.isActive, true)
      )
    )
    .limit(1);

  if (!landingPage.length || !landingPage[0].indication) {
    notFound();
  }

  const pageData = landingPage[0];
  const indication = pageData.indication!; // We've already checked it's not null

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <QuizPageClient
        indication={indication}
        landingPage={{
          id: pageData.id,
          name: pageData.name,
          slug: pageData.slug,
        }}
        utmParams={{
          utm_source: awaitedSearchParams.utm_source,
          utm_medium: awaitedSearchParams.utm_medium,
          utm_campaign: awaitedSearchParams.utm_campaign,
          utm_term: awaitedSearchParams.utm_term,
          utm_content: awaitedSearchParams.utm_content,
          hid: awaitedSearchParams.hid,
        }}
      />
    </Suspense>
  );
}
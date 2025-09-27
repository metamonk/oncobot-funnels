import { notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { indications, landingPages, adHeadlines } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Suspense } from 'react';
import { IndicationPageClient } from './IndicationPageClient';

// Force dynamic rendering to capture query params
export const dynamic = 'force-dynamic';

interface IndicationPageProps {
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

export default async function IndicationPage({ params, searchParams }: IndicationPageProps) {
  // Await params as required in Next.js 15
  const awaitedParams = await params;
  const awaitedSearchParams = await searchParams;

  // Fetch the landing page and indication data with all content fields
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
        heroHeadline: indications.heroHeadline,
        heroSubheadline: indications.heroSubheadline,
        supportingText: indications.supportingText,
        valueProps: indications.valueProps,
        ctaPrimaryText: indications.ctaPrimaryText,
        ctaSecondaryText: indications.ctaSecondaryText,
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

  // If there's a headline ID, fetch the specific headline
  let adHeadline = null;
  if (awaitedSearchParams.hid) {
    const headlines = await db
      .select()
      .from(adHeadlines)
      .where(
        and(
          eq(adHeadlines.id, awaitedSearchParams.hid),
          eq(adHeadlines.isActive, true)
        )
      )
      .limit(1);

    if (headlines.length) {
      adHeadline = headlines[0];
    }
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <IndicationPageClient
        indication={indication}
        landingPage={{
          id: pageData.id,
          name: pageData.name,
          slug: pageData.slug,
        }}
        adHeadline={adHeadline}
        utmParams={{
          utm_source: awaitedSearchParams.utm_source,
          utm_medium: awaitedSearchParams.utm_medium,
          utm_campaign: awaitedSearchParams.utm_campaign,
          utm_term: awaitedSearchParams.utm_term,
          utm_content: awaitedSearchParams.utm_content,
        }}
      />
    </Suspense>
  );
}
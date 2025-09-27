'use client';

import { useState, useEffect, Suspense } from 'react';
import { Hero } from './_components/Hero';
import { ValueProposition } from './_components/ValueProposition';
import { VideoTestimonials } from './_components/VideoTestimonials';
import { QuizCTA } from './_components/QuizCTA';
import { FAQ } from './_components/FAQ';
import { ContactForm } from './ContactForm';
import { useFunnelAnalytics } from '@/hooks/use-funnel-analytics';
import type { AdHeadline, Indication, LandingPage } from '@/lib/db/schema';

interface IndicationPageClientProps {
  indication: Pick<Indication, 'id' | 'name' | 'slug' | 'heroHeadline' | 'heroSubheadline' | 'supportingText' | 'valueProps' | 'ctaPrimaryText' | 'ctaSecondaryText'>;
  landingPage: Pick<LandingPage, 'id' | 'name' | 'slug'>;
  adHeadline: AdHeadline | null;
  utmParams: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
}

export function IndicationPageClient({
  indication,
  landingPage,
  adHeadline,
  utmParams
}: IndicationPageClientProps) {
  const { track } = useFunnelAnalytics();

  // Track page view with UTM params and headline info
  useEffect(() => {
    track('indication_page_viewed', {
      indication: indication.slug,
      indicationName: indication.name,
      landingPageId: landingPage.id,
      headlineId: adHeadline?.id,
      headlineType: adHeadline?.category,
      ...utmParams
    });
  }, [indication, landingPage, adHeadline, utmParams, track]);

  // Use value props from database or defaults
  const valueProps = (indication.valueProps as string[] | null) || [
    "Access to investigational treatments in clinical trials",
    "Close monitoring by cancer specialists",
    "All trial costs covered by sponsors",
    "Participation in research studying new approaches"
  ];

  const ctaPrimaryText = indication.ctaPrimaryText || 'Start Eligibility Check';
  const ctaSecondaryText = indication.ctaSecondaryText || 'Takes ~2 minutes';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with dynamic content */}
      <Hero
        indication={indication}
        adHeadline={adHeadline}
        utmParams={utmParams}
      />

      {/* Value Propositions */}
      <ValueProposition points={valueProps} />

      {/* Full Video Testimonials */}
      <VideoTestimonials variant="full" />

      {/* Quiz CTA */}
      <Suspense fallback={<div className="py-12 sm:py-16 lg:py-20 bg-primary/5" />}>
        <QuizCTA
          primaryText={ctaPrimaryText}
          secondaryText={ctaSecondaryText}
          indication={indication.slug}
        />
      </Suspense>

      {/* Contact Form Section */}
      <section id="contact-form" className="py-12 sm:py-16 lg:py-20">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Get Your Personalized Trial Matches
            </h2>
            <p className="text-lg text-muted-foreground">
              Fill out this quick form and our team will contact you within 48 hours
            </p>
          </div>
          <ContactForm
            indication={indication}
            adHeadline={adHeadline}
            utmParams={utmParams}
          />
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ />
    </div>
  );
}
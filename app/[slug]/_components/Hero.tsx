'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Shield, Clock, Users } from 'lucide-react';
import { TextShimmer } from '@/components/core/text-shimmer';
import { CountdownTimer } from '@/components/core/countdown-timer';
import { VideoTestimonials } from './VideoTestimonials';
import { useFunnelAnalytics } from '@/hooks/use-funnel-analytics';
import type { AdHeadline, Indication } from '@/lib/db/schema';

interface HeroProps {
  indication: Pick<Indication, 'id' | 'name' | 'slug' | 'heroHeadline' | 'heroSubheadline' | 'supportingText' | 'ctaPrimaryText' | 'ctaSecondaryText'>;
  adHeadline?: AdHeadline | null;
  utmParams?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
}

export function Hero({ indication, adHeadline, utmParams }: HeroProps) {
  const router = useRouter();
  const { track } = useFunnelAnalytics();
  const [currentSupportText, setCurrentSupportText] = useState(0);

  // Use headline from ad if available, otherwise use indication hero headline
  const headline = adHeadline?.longHeadline || indication.heroHeadline || `Do you qualify for a ${indication.name} clinical trial near you?`;
  const subheadline = adHeadline?.description || indication.heroSubheadline || 'Check eligibility in 2 minutes. Free and HIPAA-secure.';

  // Use supporting text from database or defaults
  const supportingTexts = (indication.supportingText as string[] | null) || [
    "See potential trial options near your ZIP",
    "Talk to a coordinator about next steps",
    "No cost. No obligation"
  ];

  // Rotate through supporting text every 5 seconds
  useEffect(() => {
    if (supportingTexts.length > 1) {
      const interval = setInterval(() => {
        setCurrentSupportText((prev) => (prev + 1) % supportingTexts.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [supportingTexts.length]);

  const handleCTAClick = () => {
    // Track CTA click with all context
    track('hero_cta_clicked', {
      location: 'hero',
      indication: indication.slug,
      indicationName: indication.name,
      headline,
      supporting_text: supportingTexts[currentSupportText],
      headlineId: adHeadline?.id,
      ...utmParams
    });

    // Navigate to quiz page with UTM params preserved
    const params = new URLSearchParams();
    if (utmParams?.utm_source) params.set('utm_source', utmParams.utm_source);
    if (utmParams?.utm_medium) params.set('utm_medium', utmParams.utm_medium);
    if (utmParams?.utm_campaign) params.set('utm_campaign', utmParams.utm_campaign);
    if (utmParams?.utm_term) params.set('utm_term', utmParams.utm_term);
    if (utmParams?.utm_content) params.set('utm_content', utmParams.utm_content);
    if (adHeadline?.id) params.set('hid', adHeadline.id);

    const queryString = params.toString();
    const quizUrl = `/quiz/${indication.slug}${queryString ? `?${queryString}` : ''}`;
    router.push(quizUrl);
  };

  const ctaPrimaryText = indication.ctaPrimaryText || 'Check Your Eligibility Now';
  const ctaSecondaryText = indication.ctaSecondaryText || 'Takes ~2 minutes';

  return (
    <section className="relative py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center space-y-5">
          {/* Main Headline - Dynamic from database */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-balance max-w-4xl mx-auto leading-tight">
            {headline}
          </h1>

          {/* Supporting Text - Rotates for additional value props */}
          {supportingTexts.length > 0 && (
            <div className="h-12 flex items-center justify-center">
              <div
                key={currentSupportText}
                className="text-base sm:text-lg text-muted-foreground animate-in fade-in-0 duration-200"
              >
                <TextShimmer as="span" className="font-medium">
                  {supportingTexts[currentSupportText]}
                </TextShimmer>
              </div>
            </div>
          )}

          {/* Prominent Countdown Timer - Above the fold for maximum impact */}
          <div className="flex justify-center h-10">
            <CountdownTimer
              cycleType="weekly"
              urgencyThresholdHours={72}
            />
          </div>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            {subheadline}
          </p>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">HIPAA-secure</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">100% free</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">{ctaSecondaryText}</span>
            </div>
          </div>

          {/* Primary CTA - High priority interactive element */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-1">
            <Button
              size="lg"
              onClick={handleCTAClick}
              className="group text-base sm:text-lg px-8 py-6"
              aria-label="Start eligibility check for clinical trials"
            >
              {ctaPrimaryText}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Connecting patients</span> with clinical trials nationwide
            </p>
          </div>

          {/* Compact Video Testimonial - Above the Fold */}
          <div className="pt-6">
            <VideoTestimonials variant="hero" />
          </div>

          {/* Micro-disclaimer */}
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto pt-4">
            We don&apos;t provide medical advice. Always consult your doctor.
          </p>
        </div>
      </div>
    </section>
  );
}
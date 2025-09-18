'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowRight, CheckCircle2, Shield, Clock, Users } from 'lucide-react';
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';
import { TextShimmer } from '@/components/core/text-shimmer';
import { CountdownTimer } from '@/components/core/countdown-timer';
import { VideoTestimonials } from './VideoTestimonials';
import { getDynamicHeadline, parseUTMData, SUPPORTING_TEXT_ROTATION } from '@/lib/hooks/dynamic-headlines';

interface HeroProps {
  headline: string; // Default headline if no UTM match
  subheadline: string;
  hooks: string[]; // Legacy - will be replaced with SUPPORTING_TEXT_ROTATION
  indication: string;
}

export function Hero({ headline, subheadline, hooks, indication }: HeroProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentSupportText, setCurrentSupportText] = useState(0);
  const { track } = useUnifiedAnalytics();

  // Get dynamic headline based on UTM parameters for ad-to-landing-page continuity
  const utmContent = searchParams.get('utm_content');
  const placeholderData = {
    indication,
    ...parseUTMData(searchParams)
  };
  const dynamicHeadline = getDynamicHeadline(utmContent, placeholderData);

  // Use SUPPORTING_TEXT_ROTATION or fallback to legacy hooks
  const supportingTexts = SUPPORTING_TEXT_ROTATION.length > 0 ? SUPPORTING_TEXT_ROTATION : hooks;

  // Rotate through supporting text every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSupportText((prev) => (prev + 1) % supportingTexts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [supportingTexts.length]);

  const handleCTAClick = () => {
    // Track CTA click with dynamic headline and supporting text
    track('cta_clicked', {
      location: 'hero',
      indication,
      headline: dynamicHeadline,
      supporting_text: supportingTexts[currentSupportText],
      utm_content: utmContent || 'direct',
      utm_source: searchParams.get('utm_source') || 'direct',
      utm_campaign: searchParams.get('utm_campaign') || 'none'
    });

    router.push(`/eligibility/${indication}/quiz`);
  };

  return (
    <section className="relative py-12 sm:py-16 lg:py-20">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center space-y-5">
          {/* Main Headline - Dynamic to match ad campaigns for continuity */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-balance max-w-4xl mx-auto leading-tight">
            {dynamicHeadline}
          </h1>

          {/* Supporting Text - Rotates for additional value props */}
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

          {/* Trust strip - updated copy from COPY.md */}
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
              <span className="text-sm font-medium">Takes ~2 minutes</span>
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
              Check Your Eligibility Now
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
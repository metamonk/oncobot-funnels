'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowRight, CheckCircle2, Shield, Clock, Users } from 'lucide-react';
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';
import { TextShimmer } from '@/components/core/text-shimmer';
import { CountdownTimer } from '@/components/core/countdown-timer';
import { VideoTestimonials } from './VideoTestimonials';
import {
  getContextAwareHeadline,
  getContextAwareSubheadline,
  getValueProps,
  detectUserContext,
  type UserContext
} from '@/lib/hooks/context-aware-headlines';

interface HeroContextAwareProps {
  indication: string;
}

/**
 * Context-aware Hero component that uses internal routing and user behavior
 * instead of UTM parameters for dynamic content
 */
export function HeroContextAware({ indication }: HeroContextAwareProps) {
  const router = useRouter();
  const [currentValueProp, setCurrentValueProp] = useState(0);
  const [userContext, setUserContext] = useState<UserContext>({ indication });
  const { track } = useUnifiedAnalytics();

  // Detect user context on mount
  useEffect(() => {
    const context = detectUserContext(indication);
    setUserContext(context);

    // Track page view with context
    track('hero_viewed', {
      indication,
      deviceType: context.deviceType,
      timeOfDay: context.timeOfDay,
      isReturning: context.visitCount ? context.visitCount > 1 : false
    });
  }, [indication, track]);

  // Get context-aware content
  const headline = getContextAwareHeadline(userContext);
  const subheadline = getContextAwareSubheadline(userContext);
  const valueProps = getValueProps(indication);

  // Rotate through value propositions
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentValueProp((prev) => (prev + 1) % valueProps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [valueProps.length]);

  const handleCTAClick = () => {
    track('cta_clicked', {
      location: 'hero',
      indication,
      headline,
      context: userContext
    });
    router.push(`/eligibility/${indication}/quiz`);
  };

  return (
    <section className="relative py-12 sm:py-16 lg:py-20">
      {/* Urgency banner for returning visitors */}
      {userContext.visitCount && userContext.visitCount > 1 && (
        <div className="absolute top-0 left-0 right-0 bg-primary/10 py-2 text-center">
          <p className="text-sm font-medium">
            Welcome back! New trials have been added since your last visit.
          </p>
        </div>
      )}

      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center space-y-5">
          {/* Dynamic headline based on context */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-balance max-w-4xl mx-auto leading-tight">
            {headline}
          </h1>

          {/* Context-aware subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            {subheadline}
          </p>

          {/* Rotating value propositions */}
          <div className="h-12 flex items-center justify-center">
            <div className="flex items-center gap-2 text-primary font-medium">
              <CheckCircle2 className="h-5 w-5" />
              <TextShimmer
                key={currentValueProp}
                className="text-base sm:text-lg"
                duration={0.5}
              >
                {valueProps[currentValueProp]}
              </TextShimmer>
            </div>
          </div>

          {/* Trust indicators - adapt to device */}
          <div className={cn(
            "flex items-center gap-4 sm:gap-8 text-sm text-muted-foreground",
            userContext.deviceType === 'mobile' ? 'justify-center flex-wrap' : 'justify-center'
          )}>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span>HIPAA Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span>10,000+ Helped</span>
            </div>
            {userContext.deviceType !== 'mobile' && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span>2-Min Check</span>
              </div>
            )}
          </div>

          {/* CTA section with urgency for certain contexts */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              onClick={handleCTAClick}
              className={cn(
                "group text-base sm:text-lg px-8",
                userContext.timeOfDay === 'evening' || userContext.timeOfDay === 'night'
                  ? "animate-pulse"
                  : ""
              )}
            >
              {userContext.deviceType === 'mobile'
                ? 'Check Eligibility'
                : 'Start Eligibility Check'
              }
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>

            {userContext.deviceType !== 'mobile' && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  track('secondary_cta_clicked', { location: 'hero', indication });
                  router.push('#how-it-works');
                }}
                className="text-base sm:text-lg px-8"
              >
                Learn How It Works
              </Button>
            )}
          </div>

          {/* Countdown timer for urgency (evening/night visitors) */}
          {(userContext.timeOfDay === 'evening' || userContext.timeOfDay === 'night') && (
            <div className="pt-4">
              <CountdownTimer
                className="justify-center"
                urgencyThresholdHours={24}
                cycleType="weekly"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Coordinator availability refreshes weekly
              </p>
            </div>
          )}
        </div>

        {/* Video testimonials - show on desktop only for performance */}
        {userContext.deviceType === 'desktop' && (
          <div className="mt-12">
            <VideoTestimonials variant="hero" />
          </div>
        )}
      </div>
    </section>
  );
}
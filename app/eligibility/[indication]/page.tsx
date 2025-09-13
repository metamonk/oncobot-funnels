'use client';

import { Hero } from '../_components/Hero';
import { ValueProposition } from '../_components/ValueProposition';
import { VideoTestimonials } from '../_components/VideoTestimonials';
import { QuizCTA } from '../_components/QuizCTA';
import { FAQ } from '../_components/FAQ';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';

// Configuration for each indication following copy guidelines from COPY.md
const indicationConfig = {
  lung: {
    hero: {
      headline: "Do you qualify for a Lung clinical trial near you?",
      subheadline: "Check eligibility in 2 minutes. Free and HIPAA-secure.",
      hooks: [
        "See potential trial options near your ZIP",
        "Talk to a coordinator about next steps",
        "No cost. No obligation"
      ]
    },
    value: {
      points: [
        "Access cutting-edge treatments before FDA approval",
        "Close monitoring by cancer specialists",
        "All trial costs covered by sponsors",
        "Potential for better outcomes than standard care"
      ]
    },
    cta: {
      primary: "Start Eligibility Check",
      secondary: "Takes ~2 minutes"
    }
  },
  prostate: {
    hero: {
      headline: "Do you qualify for a Prostate clinical trial near you?",
      subheadline: "Check eligibility in 2 minutes. Free and HIPAA-secure.",
      hooks: [
        "See potential trial options near your ZIP",
        "Talk to a coordinator about next steps",
        "No cost. No obligation"
      ]
    },
    value: {
      points: [
        "Access tomorrow's treatments today",
        "Expert oncology team monitoring",
        "No cost for trial medications",
        "Contribute to advancing cancer care"
      ]
    },
    cta: {
      primary: "Start Eligibility Check",
      secondary: "Takes ~2 minutes"
    }
  },
  gi: {
    hero: {
      headline: "Do you qualify for a GI clinical trial near you?",
      subheadline: "Check eligibility in 2 minutes. Free and HIPAA-secure.",
      hooks: [
        "See potential trial options near your ZIP",
        "Talk to a coordinator about next steps",
        "No cost. No obligation"
      ]
    },
    value: {
      points: [
        "First access to innovative treatments",
        "Comprehensive care from specialists",
        "All study-related costs covered",
        "Hope when standard options are limited"
      ]
    },
    cta: {
      primary: "Start Eligibility Check",
      secondary: "Takes ~2 minutes"
    }
  }
};

export default function LandingPage() {
  const params = useParams();
  const indication = params.indication as keyof typeof indicationConfig;
  const config = indicationConfig[indication] || indicationConfig.lung;
  
  const { track } = useUnifiedAnalytics();

  useEffect(() => {
    // Track page view with indication
    track('Page Viewed', {
      page: 'landing',
      indication,
      source: 'google_ads',
      step: 'landing_page'
    });
    
    // Track eligibility flow entry
    track('Eligibility Step', {
      step_name: 'landing_view',
      indication,
      timestamp: new Date().toISOString()
    });
  }, [indication, track]);

  return (
    <div className="min-h-screen bg-background">
      <Hero 
        headline={config.hero.headline}
        subheadline={config.hero.subheadline}
        hooks={config.hero.hooks}
        indication={indication}
      />
      <ValueProposition points={config.value.points} />
      <VideoTestimonials variant="full" />
      <QuizCTA 
        primaryText={config.cta.primary}
        secondaryText={config.cta.secondary}
        indication={indication}
      />
      <FAQ />
    </div>
  );
}
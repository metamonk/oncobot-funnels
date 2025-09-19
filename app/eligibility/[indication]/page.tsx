'use client';

import { HeroWrapper } from '../_components/HeroWrapper';
import { ValueProposition } from '../_components/ValueProposition';
import { VideoTestimonials } from '../_components/VideoTestimonials';
import { QuizCTA } from '../_components/QuizCTA';
import { FAQ } from '../_components/FAQ';
import { useParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { useFunnelAnalytics } from '@/hooks/use-funnel-analytics';

// Configuration for each indication following copy guidelines from COPY.md
const indicationConfig = {
  lung: {
    hero: {
      headline: "Do you qualify for a Lung Cancer clinical trial near you?",
      subheadline: "Check eligibility in 2 minutes. Free and HIPAA-secure.",
      hooks: [
        "See potential trial options near your ZIP",
        "Talk to a coordinator about next steps",
        "No cost. No obligation"
      ]
    },
    value: {
      points: [
        "Access to investigational treatments in clinical trials",
        "Close monitoring by cancer specialists",
        "All trial costs covered by sponsors",
        "Participation in research studying new approaches"
      ]
    },
    cta: {
      primary: "Start Eligibility Check",
      secondary: "Takes ~2 minutes"
    }
  },
  prostate: {
    hero: {
      headline: "Do you qualify for a Prostate Cancer clinical trial near you?",
      subheadline: "Check eligibility in 2 minutes. Free and HIPAA-secure.",
      hooks: [
        "See potential trial options near your ZIP",
        "Talk to a coordinator about next steps",
        "No cost. No obligation"
      ]
    },
    value: {
      points: [
        "Access to investigational treatments",
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
      headline: "Do you qualify for a GI Cancer clinical trial near you?",
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
        "Additional options to explore with your doctor"
      ]
    },
    cta: {
      primary: "Start Eligibility Check",
      secondary: "Takes ~2 minutes"
    }
  },
  other: {
    hero: {
      headline: "Find clinical trials for your cancer type",
      subheadline: "Check eligibility for 50+ cancer types. Free and HIPAA-secure.",
      hooks: [
        "Access trials for rare and common cancers",
        "Personalized matching based on your diagnosis",
        "Connect with specialized coordinators"
      ]
    },
    value: {
      points: [
        "Coverage for 50+ cancer types including rare cancers",
        "Access to 1,847+ active clinical trials nationwide",
        "Specialized coordinators for your cancer type",
        "Same-day eligibility results"
      ]
    },
    cta: {
      primary: "Find Trials for My Cancer",
      secondary: "All cancer types welcome"
    }
  }
};

function LandingPageContent() {
  const params = useParams();
  const indication = params.indication as keyof typeof indicationConfig;
  const config = indicationConfig[indication] || indicationConfig.lung;
  
  const { trackPatientLandingPageView, getHeadlineVariant } = useFunnelAnalytics();

  useEffect(() => {
    // Track landing page view with indication
    trackPatientLandingPageView(indication);
    
    // Get A/B test variant for headline (for future implementation)
    // const headlineVariant = getHeadlineVariant();
  }, [indication, trackPatientLandingPageView]);

  return (
    <div className="min-h-screen bg-background">
      <HeroWrapper
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

// Main export wrapped in Suspense to handle useSearchParams properly
export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <LandingPageContent />
    </Suspense>
  );
}
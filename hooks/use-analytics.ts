'use client';

import { useCallback } from 'react';
import { usePostHog } from 'posthog-js/react';

declare global {
  interface Window {
    plausible?: (event: string, options?: { 
      props?: Record<string, any>;
      revenue?: { currency: string; amount: number };
    }) => void;
  }
}

interface TrialAnalytics {
  trial_id: string;
  phase?: string;
  condition?: string;
  recruitment_status?: string;
}

// Revenue values for different events (in USD)
const REVENUE_VALUES = {
  'Contact Initiated': 75,
  'Eligibility Check': 25,
  'Health Profile Completed': 20,
  'Contact Info Viewed': 15,
  'External Trial View': 10,
  'Trial View': 5,
  'Contact Method Clicked': 50,
} as const;

export function useAnalytics() {
  const posthog = usePostHog();

  const trackEvent = useCallback((eventName: string, props?: Record<string, any>) => {
    // Track in Plausible with revenue
    if (typeof window !== 'undefined' && window.plausible) {
      const options: any = props ? { props } : {};
      
      // Add revenue if this is a revenue-tracked event
      if (eventName in REVENUE_VALUES) {
        options.revenue = {
          currency: 'USD',
          amount: REVENUE_VALUES[eventName as keyof typeof REVENUE_VALUES]
        };
      }
      
      window.plausible(eventName, Object.keys(options).length > 0 ? options : undefined);
    }

    // Also track in PostHog for deeper analysis
    if (posthog) {
      posthog.capture(eventName, {
        ...props,
        timestamp: new Date().toISOString(),
        // Add revenue context for PostHog too
        ...(eventName in REVENUE_VALUES && {
          revenue_value: REVENUE_VALUES[eventName as keyof typeof REVENUE_VALUES],
          revenue_currency: 'USD'
        })
      });
    }
  }, [posthog]);

  const trackTrialView = useCallback((analytics: TrialAnalytics) => {
    trackEvent('Trial View', analytics);
  }, [trackEvent]);

  const trackTrialCopy = useCallback((trialId: string) => {
    trackEvent('Trial ID Copied', { trial_id: trialId });
  }, [trackEvent]);

  const trackExternalView = useCallback((trialId: string) => {
    trackEvent('External Trial View', { 
      trial_id: trialId,
      destination: 'clinicaltrials.gov'
    });
  }, [trackEvent]);

  const trackContactView = useCallback((trialId: string, contactType: 'phone' | 'email') => {
    trackEvent('Contact Info Viewed', {
      trial_id: trialId,
      contact_type: contactType
    });
  }, [trackEvent]);

  const trackContactInitiated = useCallback((trialId: string, method: 'phone' | 'email', facility?: string, contactValue?: string) => {
    trackEvent('Contact Initiated', {
      trial_id: trialId,
      method,
      ...(facility && { facility }),
      ...(contactValue && { contact_value: contactValue })
    });
  }, [trackEvent]);

  const trackEligibilityCheck = useCallback((trialId: string, likelyEligible: boolean, matchScore?: number) => {
    trackEvent('Eligibility Check', {
      trial_id: trialId,
      likely_eligible: likelyEligible,
      ...(matchScore !== undefined && { match_score: matchScore })
    });
  }, [trackEvent]);

  const trackHealthProfileCompleted = useCallback((cancerRegion?: string, stage?: string) => {
    trackEvent('Health Profile Completed', {
      ...(cancerRegion && { cancer_region: cancerRegion }),
      ...(stage && { stage })
    });
  }, [trackEvent]);

  const trackHealthProfileSkipped = useCallback(() => {
    trackEvent('Health Profile Skipped', {
      timestamp: new Date().toISOString()
    });
  }, [trackEvent]);

  const trackTrialSearch = useCallback((searchType: string, hasProfile: boolean, resultsCount: number) => {
    trackEvent('Trial Search', {
      search_type: searchType,
      has_profile: hasProfile,
      results_count: resultsCount
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackTrialView,
    trackTrialCopy,
    trackExternalView,
    trackContactView,
    trackContactInitiated,
    trackEligibilityCheck,
    trackHealthProfileCompleted,
    trackHealthProfileSkipped,
    trackTrialSearch
  };
}
'use client';

import { useCallback } from 'react';

declare global {
  interface Window {
    plausible?: (event: string, options?: { props: Record<string, any> }) => void;
  }
}

interface TrialAnalytics {
  trial_id: string;
  phase?: string;
  condition?: string;
  recruitment_status?: string;
}

export function useAnalytics() {
  const trackEvent = useCallback((eventName: string, props?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible(eventName, props ? { props } : undefined);
    }
  }, []);

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

  const trackContactInitiated = useCallback((trialId: string, method: 'phone' | 'email', facility?: string) => {
    trackEvent('Contact Initiated', {
      trial_id: trialId,
      method,
      ...(facility && { facility })
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
    trackTrialSearch
  };
}
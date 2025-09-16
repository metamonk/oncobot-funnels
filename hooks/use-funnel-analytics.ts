/**
 * Funnel Analytics Hook
 * 
 * Specialized hook for funnel tracking with Hormozi-style conversion optimization
 */

'use client';

import { useCallback, useEffect } from 'react';
import { useUnifiedAnalytics } from './use-unified-analytics';
import { 
  PatientFunnelEvents, 
  SiteFunnelEvents, 
  ConversionGoals,
  PatientFunnelProperties,
  SiteFunnelProperties,
  getUTMParams,
  getSessionId,
  calculateLeadScore,
  getRandomVariant,
  ABTestVariants
} from '@/lib/analytics/funnel-events';

export function useFunnelAnalytics() {
  const analytics = useUnifiedAnalytics();

  // Initialize session and UTM tracking
  useEffect(() => {
    const sessionId = getSessionId();
    const utmParams = getUTMParams();
    
    if (sessionId && Object.keys(utmParams).length > 0) {
      analytics.setUserProperties({
        session_id: sessionId,
        ...utmParams
      });
    }
  }, [analytics]);

  // ============================================================================
  // PATIENT FUNNEL TRACKING
  // ============================================================================

  const trackPatientLandingPageView = useCallback(
    (indication: string, variant?: string) => {
      const utmParams = getUTMParams();
      return analytics.track(PatientFunnelEvents.LANDING_PAGE_VIEW, {
        indication,
        variant,
        session_id: getSessionId(),
        ...utmParams
      } as PatientFunnelProperties);
    },
    [analytics]
  );

  const trackHookVariant = useCallback(
    (variant: string, experiment: string) => {
      return analytics.track(PatientFunnelEvents.HOOK_VARIANT_SHOWN, {
        variant,
        experiment,
        session_id: getSessionId()
      } as PatientFunnelProperties);
    },
    [analytics]
  );

  const trackQuizStart = useCallback(
    (indication: string) => {
      return analytics.track(PatientFunnelEvents.QUIZ_STARTED, {
        indication,
        session_id: getSessionId(),
        ...getUTMParams()
      } as PatientFunnelProperties);
    },
    [analytics]
  );

  const trackQuizQuestion = useCallback(
    (questionId: string, questionText: string, answer: any, questionNumber: number, totalQuestions: number) => {
      return analytics.track(PatientFunnelEvents.QUIZ_QUESTION_ANSWERED, {
        question_id: questionId,
        question_text: questionText,
        answer,
        question_number: questionNumber,
        total_questions: totalQuestions,
        session_id: getSessionId()
      } as PatientFunnelProperties);
    },
    [analytics]
  );

  const trackQuizComplete = useCallback(
    (indication: string, properties: Partial<PatientFunnelProperties>) => {
      const leadScore = calculateLeadScore(properties);
      return analytics.track(PatientFunnelEvents.QUIZ_COMPLETED, {
        indication,
        leadScore,
        session_id: getSessionId(),
        ...properties
      } as PatientFunnelProperties, {
        revenue: { currency: 'USD', amount: ConversionGoals.PATIENT_QUIZ_COMPLETION.value }
      });
    },
    [analytics]
  );

  const trackQuizAbandoned = useCallback(
    (indication: string, lastQuestion: number, totalQuestions: number) => {
      return analytics.track(PatientFunnelEvents.QUIZ_ABANDONED, {
        indication,
        last_question: lastQuestion,
        total_questions: totalQuestions,
        session_id: getSessionId()
      } as PatientFunnelProperties);
    },
    [analytics]
  );

  const trackLeadFormStart = useCallback(
    (indication: string) => {
      return analytics.track(PatientFunnelEvents.LEAD_FORM_STARTED, {
        indication,
        session_id: getSessionId()
      } as PatientFunnelProperties);
    },
    [analytics]
  );

  const trackLeadFormSubmit = useCallback(
    (properties: PatientFunnelProperties) => {
      const leadScore = calculateLeadScore(properties);
      return analytics.track(PatientFunnelEvents.LEAD_FORM_SUBMITTED, {
        ...properties,
        leadScore,
        session_id: getSessionId()
      } as PatientFunnelProperties, {
        revenue: { currency: 'USD', amount: ConversionGoals.PATIENT_LEAD_CAPTURE.value }
      });
    },
    [analytics]
  );

  const trackTrialSearchInitiated = useCallback(
    (indication: string, searchCriteria: any) => {
      return analytics.track(PatientFunnelEvents.TRIAL_SEARCH_INITIATED, {
        indication,
        search_criteria: searchCriteria,
        session_id: getSessionId()
      } as PatientFunnelProperties);
    },
    [analytics]
  );

  const trackTrialResultsShown = useCallback(
    (count: number, indication: string) => {
      return analytics.track(PatientFunnelEvents.TRIAL_RESULTS_SHOWN, {
        results_count: count,
        indication,
        session_id: getSessionId()
      } as PatientFunnelProperties);
    },
    [analytics]
  );

  const trackTrialClicked = useCallback(
    (trialId: string, trialTitle: string, position: number) => {
      return analytics.track(PatientFunnelEvents.TRIAL_CLICKED, {
        trialId,
        trialTitle,
        position,
        session_id: getSessionId()
      } as PatientFunnelProperties);
    },
    [analytics]
  );

  const trackTrialSiteContacted = useCallback(
    (trialId: string, trialTitle: string, contactMethod: string) => {
      return analytics.track(PatientFunnelEvents.TRIAL_SITE_CONTACTED, {
        trialId,
        trialTitle,
        contact_method: contactMethod,
        session_id: getSessionId()
      } as PatientFunnelProperties, {
        revenue: { currency: 'USD', amount: ConversionGoals.PATIENT_TRIAL_CONTACT.value }
      });
    },
    [analytics]
  );

  const trackEligibilityCheckStarted = useCallback(
    (trialId: string) => {
      return analytics.track(PatientFunnelEvents.ELIGIBILITY_CHECK_STARTED, {
        trialId,
        session_id: getSessionId()
      } as PatientFunnelProperties);
    },
    [analytics]
  );

  const trackEligibilityQuestionAnswered = useCallback(
    (trialId: string, questionId: string, answer: any) => {
      return analytics.track(PatientFunnelEvents.ELIGIBILITY_QUESTION_ANSWERED, {
        trialId,
        question_id: questionId,
        answer,
        session_id: getSessionId()
      } as PatientFunnelProperties);
    },
    [analytics]
  );

  const trackEligibilityCheckCompleted = useCallback(
    (trialId: string, isEligible: boolean) => {
      return analytics.track(PatientFunnelEvents.ELIGIBILITY_CHECK_COMPLETED, {
        trialId,
        is_eligible: isEligible,
        session_id: getSessionId()
      } as PatientFunnelProperties);
    },
    [analytics]
  );

  // ============================================================================
  // SITE FUNNEL TRACKING
  // ============================================================================

  const trackSiteHomepageView = useCallback(
    () => {
      const utmParams = getUTMParams();
      return analytics.track(SiteFunnelEvents.HOMEPAGE_VIEWED, {
        session_id: getSessionId(),
        ...utmParams
      } as SiteFunnelProperties);
    },
    [analytics]
  );

  const trackMembershipPageView = useCallback(
    () => {
      return analytics.track(SiteFunnelEvents.MEMBERSHIP_PAGE_VIEWED, {
        session_id: getSessionId(),
        ...getUTMParams()
      } as SiteFunnelProperties);
    },
    [analytics]
  );

  const trackBookingPageView = useCallback(
    () => {
      return analytics.track(SiteFunnelEvents.BOOKING_PAGE_VIEWED, {
        session_id: getSessionId()
      } as SiteFunnelProperties);
    },
    [analytics]
  );

  const trackBookingFormStart = useCallback(
    () => {
      return analytics.track(SiteFunnelEvents.BOOKING_FORM_STARTED, {
        session_id: getSessionId()
      } as SiteFunnelProperties);
    },
    [analytics]
  );

  const trackBookingFormSubmit = useCallback(
    (properties: SiteFunnelProperties) => {
      return analytics.track(SiteFunnelEvents.BOOKING_FORM_SUBMITTED, {
        ...properties,
        session_id: getSessionId()
      } as SiteFunnelProperties, {
        revenue: { currency: 'USD', amount: ConversionGoals.SITE_BOOKING_SCHEDULED.value }
      });
    },
    [analytics]
  );

  const trackThankYouPageView = useCallback(
    () => {
      return analytics.track(SiteFunnelEvents.THANK_YOU_PAGE_VIEWED, {
        session_id: getSessionId()
      } as SiteFunnelProperties);
    },
    [analytics]
  );

  const trackSampleProfilesView = useCallback(
    () => {
      return analytics.track(SiteFunnelEvents.SAMPLE_PROFILES_VIEWED, {
        session_id: getSessionId()
      } as SiteFunnelProperties);
    },
    [analytics]
  );

  const trackSampleProfileExpanded = useCallback(
    (profileId: string) => {
      return analytics.track(SiteFunnelEvents.SAMPLE_PROFILE_EXPANDED, {
        profile_id: profileId,
        session_id: getSessionId()
      } as SiteFunnelProperties);
    },
    [analytics]
  );

  // ============================================================================
  // A/B TESTING HELPERS
  // ============================================================================

  const getHeadlineVariant = useCallback(() => {
    const variant = getRandomVariant(ABTestVariants.HEADLINES);
    trackHookVariant(variant as string, 'headline_test');
    return ABTestVariants.HEADLINES[variant];
  }, [trackHookVariant]);

  const getCTAVariant = useCallback(() => {
    const variant = getRandomVariant(ABTestVariants.CTA_BUTTONS);
    trackHookVariant(variant as string, 'cta_test');
    return ABTestVariants.CTA_BUTTONS[variant];
  }, [trackHookVariant]);

  const getUrgencyVariant = useCallback(() => {
    const variant = getRandomVariant(ABTestVariants.URGENCY);
    trackHookVariant(variant as string, 'urgency_test');
    return ABTestVariants.URGENCY[variant];
  }, [trackHookVariant]);

  return {
    // Patient Funnel Events
    trackPatientLandingPageView,
    trackHookVariant,
    trackQuizStart,
    trackQuizQuestion,
    trackQuizComplete,
    trackQuizAbandoned,
    trackLeadFormStart,
    trackLeadFormSubmit,
    trackTrialSearchInitiated,
    trackTrialResultsShown,
    trackTrialClicked,
    trackTrialSiteContacted,
    trackEligibilityCheckStarted,
    trackEligibilityQuestionAnswered,
    trackEligibilityCheckCompleted,

    // Site Funnel Events
    trackSiteHomepageView,
    trackMembershipPageView,
    trackBookingPageView,
    trackBookingFormStart,
    trackBookingFormSubmit,
    trackThankYouPageView,
    trackSampleProfilesView,
    trackSampleProfileExpanded,

    // A/B Testing
    getHeadlineVariant,
    getCTAVariant,
    getUrgencyVariant,

    // Utilities
    getSessionId,
    getUTMParams,
    calculateLeadScore,

    // Core analytics methods (pass through)
    track: analytics.track,
    identify: analytics.identify,
    setUserProperties: analytics.setUserProperties,
    flush: analytics.flush
  };
}
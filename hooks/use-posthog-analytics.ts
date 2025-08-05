'use client';

import { usePostHog } from 'posthog-js/react';
import { useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// PostHog-specific tracking for deeper insights
export function usePostHogAnalytics() {
  const posthog = usePostHog();
  const pathname = usePathname();

  // Track page views with more context
  useEffect(() => {
    if (posthog) {
      posthog.capture('$pageview', {
        $current_url: pathname,
      });
    }
  }, [pathname, posthog]);

  // Track clinical trial interactions with rich data
  const trackTrialInteraction = useCallback((action: string, trialData: any) => {
    if (!posthog) return;

    posthog.capture(`Trial ${action}`, {
      trial_id: trialData.trial_id,
      trial_phase: trialData.phase,
      trial_condition: trialData.condition,
      trial_status: trialData.recruitment_status,
      facility_name: trialData.facility,
      location_city: trialData.city,
      location_state: trialData.state,
      has_contact_info: Boolean(trialData.has_contact),
      user_has_profile: Boolean(trialData.user_has_profile),
      timestamp: new Date().toISOString(),
    });

    // Set user properties for cohort analysis
    if (action === 'Contact Initiated') {
      posthog.capture('$set', {
        $set: {
          has_contacted_trial: true,
          last_contact_date: new Date().toISOString(),
          total_contacts: (posthog.get_property('total_contacts') || 0) + 1,
        },
      });
    }
  }, [posthog]);

  // Track user journey milestones
  const trackJourneyMilestone = useCallback((milestone: string, properties?: any) => {
    if (!posthog) return;

    posthog.capture(`Journey: ${milestone}`, {
      ...properties,
      journey_stage: milestone,
      time_since_first_visit: posthog.get_property('$initial_referrer_domain') ? 
        Date.now() - new Date(posthog.get_property('$initial_person_created_at')).getTime() : 0,
    });

    // Update user journey stage
    posthog.capture('$set', {
      $set: {
        current_journey_stage: milestone,
        [`reached_${milestone.toLowerCase().replace(/\s+/g, '_')}`]: true,
      },
    });
  }, [posthog]);

  // Track search behavior for optimization
  const trackSearchBehavior = useCallback((searchData: {
    query: string;
    filters: any;
    results_count: number;
    clicked_result?: any;
  }) => {
    if (!posthog) return;

    posthog.capture('Search Performed', {
      search_query: searchData.query,
      search_filters: searchData.filters,
      results_count: searchData.results_count,
      has_results: searchData.results_count > 0,
      clicked_position: searchData.clicked_result?.position,
      clicked_trial_id: searchData.clicked_result?.trial_id,
    });

    // Track search success rate
    if (searchData.clicked_result) {
      posthog.capture('Search Success', {
        query_to_click_time: searchData.clicked_result.time_to_click,
        result_position: searchData.clicked_result.position,
      });
    }
  }, [posthog]);

  // Track feature usage for product development
  const trackFeatureUsage = useCallback((feature: string, properties?: any) => {
    if (!posthog) return;

    posthog.capture(`Feature Used: ${feature}`, {
      feature_name: feature,
      ...properties,
    });

    // Increment feature usage count
    const featureKey = `feature_usage_${feature.toLowerCase().replace(/\s+/g, '_')}`;
    posthog.capture('$set', {
      $set_once: {
        [`first_used_${featureKey}`]: new Date().toISOString(),
      },
      $set: {
        [featureKey]: (posthog.get_property(featureKey) || 0) + 1,
      },
    });
  }, [posthog]);

  // Track AI response quality
  const trackAIResponseQuality = useCallback((responseData: {
    query: string;
    response_time: number;
    tokens_used: number;
    user_action: 'helpful' | 'not_helpful' | 'copied' | 'shared';
    content_type?: string;
  }) => {
    if (!posthog) return;

    posthog.capture('AI Response Feedback', {
      ...responseData,
      response_speed: responseData.response_time < 1000 ? 'fast' : 
                      responseData.response_time < 3000 ? 'normal' : 'slow',
    });
  }, [posthog]);

  // Track conversion funnel with timing
  const trackFunnelStep = useCallback((step: string, previousStep?: string) => {
    if (!posthog) return;

    const stepTime = Date.now();
    const previousStepTime = previousStep ? 
      posthog.get_property(`funnel_step_${previousStep}_time`) : null;

    posthog.capture('Funnel Step Completed', {
      step_name: step,
      previous_step: previousStep,
      time_since_previous: previousStepTime ? stepTime - previousStepTime : null,
      total_funnel_time: posthog.get_property('funnel_start_time') ? 
        stepTime - posthog.get_property('funnel_start_time') : null,
    });

    // Store step completion time
    posthog.capture('$set', {
      $set: {
        [`funnel_step_${step}_time`]: stepTime,
        last_funnel_step: step,
      },
    });
  }, [posthog]);

  // Identify user for better tracking
  const identifyUser = useCallback((userId: string, traits?: any) => {
    if (!posthog) return;

    posthog.identify(userId, {
      ...traits,
      identified_at: new Date().toISOString(),
    });
  }, [posthog]);

  // Track session quality metrics
  const trackSessionQuality = useCallback(() => {
    if (!posthog) return;

    const sessionStart = posthog.get_property('session_start_time') || Date.now();
    const sessionDuration = Date.now() - sessionStart;

    posthog.capture('Session Quality', {
      session_duration: sessionDuration,
      pages_viewed: posthog.get_property('pages_viewed_count') || 1,
      searches_performed: posthog.get_property('searches_count') || 0,
      trials_viewed: posthog.get_property('trials_viewed_count') || 0,
      contacts_initiated: posthog.get_property('contacts_count') || 0,
      engagement_score: calculateEngagementScore(posthog),
    });
  }, [posthog]);

  return {
    posthog,
    trackTrialInteraction,
    trackJourneyMilestone,
    trackSearchBehavior,
    trackFeatureUsage,
    trackAIResponseQuality,
    trackFunnelStep,
    identifyUser,
    trackSessionQuality,
  };
}

// Helper function to calculate engagement score
function calculateEngagementScore(posthog: any): number {
  const factors = {
    pages_viewed: (posthog.get_property('pages_viewed_count') || 1) * 10,
    searches_performed: (posthog.get_property('searches_count') || 0) * 20,
    trials_viewed: (posthog.get_property('trials_viewed_count') || 0) * 30,
    contacts_initiated: (posthog.get_property('contacts_count') || 0) * 100,
    profile_completed: posthog.get_property('has_health_profile') ? 50 : 0,
  };

  return Object.values(factors).reduce((sum, val) => sum + val, 0);
}
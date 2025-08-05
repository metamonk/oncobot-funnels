'use client';

import { usePostHog } from 'posthog-js/react';
import { useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// PostHog-specific tracking for deeper insights
export function usePostHogAnalytics() {
  const posthog = usePostHog();
  const pathname = usePathname();

  // Initialize session tracking
  useEffect(() => {
    if (posthog && !posthog.get_property('session_start_time')) {
      posthog.capture('$set', {
        $set_once: {
          session_start_time: Date.now(),
          initial_page: pathname,
        },
      });
    }
  }, [posthog, pathname]);

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
      // Enhanced properties for better insights
      distance_from_user: trialData.distance,
      eligibility_score: trialData.eligibility_score,
      trial_sponsor: trialData.sponsor,
      estimated_completion: trialData.completion_date,
      enrollment_count: trialData.enrollment,
      // User context
      user_search_query: trialData.search_query,
      results_position: trialData.position_in_results,
      time_to_action: trialData.time_since_search,
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
    
    // Track trial view count
    if (action === 'View') {
      const currentTrialViews = posthog.get_property('trials_viewed_count') || 0;
      const newTrialViews = currentTrialViews + 1;
      
      posthog.capture('$set', {
        $set: {
          trials_viewed_count: newTrialViews,
          last_trial_viewed: new Date().toISOString(),
        },
      });
      
      // Trigger milestone event when user views 3+ trials
      if (newTrialViews === 3) {
        posthog.capture('High Intent User - 3+ Trials Viewed', {
          trials_viewed: newTrialViews,
          milestone: '3_trials_viewed',
        });
      }
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

    // Increment search count
    const currentSearches = posthog.get_property('searches_count') || 0;
    posthog.capture('$set', {
      $set: {
        searches_count: currentSearches + 1,
        last_search_query: searchData.query,
        last_search_time: new Date().toISOString(),
      },
    });

    posthog.capture('Search Performed', {
      search_query: searchData.query,
      search_filters: searchData.filters,
      results_count: searchData.results_count,
      has_results: searchData.results_count > 0,
      clicked_position: searchData.clicked_result?.position,
      clicked_trial_id: searchData.clicked_result?.trial_id,
      search_number: currentSearches + 1,
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
      // Performance context
      device_type: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
      connection_type: (navigator as any).connection?.effectiveType || 'unknown',
      viewport_width: window.innerWidth,
      // Quality metrics
      response_length: responseData.query.length,
      complexity_score: calculateQueryComplexity(responseData.query),
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
    const engagementScore = calculateEngagementScore(posthog);

    posthog.capture('Session Quality', {
      session_duration: sessionDuration,
      pages_viewed: posthog.get_property('pages_viewed_count') || 1,
      searches_performed: posthog.get_property('searches_count') || 0,
      trials_viewed: posthog.get_property('trials_viewed_count') || 0,
      contacts_initiated: posthog.get_property('contacts_count') || 0,
      engagement_score: engagementScore,
    });
    
    // Update user property with engagement score
    posthog.capture('$set', {
      $set: {
        current_engagement_score: engagementScore,
        last_engagement_update: new Date().toISOString(),
      },
    });
    
    // Fire event when user reaches high engagement threshold
    if (engagementScore >= 200 && !posthog.get_property('high_engagement_triggered')) {
      posthog.capture('High Engagement User - Score 200+', {
        engagement_score: engagementScore,
        milestone: 'high_engagement_reached',
      });
      
      posthog.capture('$set', {
        $set: {
          high_engagement_triggered: true,
          high_engagement_reached_at: new Date().toISOString(),
        },
      });
    }
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

// Helper function to calculate query complexity
function calculateQueryComplexity(query: string): string {
  const wordCount = query.split(' ').length;
  const hasLocation = /\b(near|in|at)\s+\w+/i.test(query);
  const hasMedicalTerms = /\b(cancer|trial|treatment|therapy|stage)\b/i.test(query);
  const hasEligibility = /\b(eligible|qualify|criteria)\b/i.test(query);
  
  const complexityScore = 
    wordCount * 0.1 + 
    (hasLocation ? 1 : 0) + 
    (hasMedicalTerms ? 2 : 0) + 
    (hasEligibility ? 2 : 0);
  
  if (complexityScore > 4) return 'complex';
  if (complexityScore > 2) return 'moderate';
  return 'simple';
}
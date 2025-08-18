/**
 * Unified Analytics Hook
 * 
 * Single hook for all analytics tracking needs
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getAnalytics, AnalyticsClient } from '@/lib/analytics/core/analytics-client';
import { EventCategory } from '@/lib/analytics/core/types';
import { PlausibleProvider } from '@/lib/analytics/providers/plausible-provider';
import { PostHogClientProvider } from '@/lib/analytics/providers/posthog-client-provider';

// Initialize analytics client with default config
let analyticsInitialized = false;

function initializeAnalytics(): AnalyticsClient {
  if (analyticsInitialized) {
    return getAnalytics();
  }

  const analytics = getAnalytics({
    providers: [
      { name: 'plausible', enabled: true },
      { name: 'posthog', enabled: true },
    ],
    debug: process.env.NODE_ENV === 'development',
    batchSize: 10,
    flushInterval: 5000,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    enableAutoTracking: true,
    enableErrorTracking: true,
    enablePerformanceTracking: true,
  });

  // Add providers - only client-side providers in hooks
  analytics.addProvider(new PlausibleProvider());
  analytics.addProvider(new PostHogClientProvider());

  analyticsInitialized = true;
  return analytics;
}

/**
 * Unified analytics hook
 */
export function useUnifiedAnalytics() {
  const analytics = useRef<AnalyticsClient | null>(null);

  useEffect(() => {
    analytics.current = initializeAnalytics();
  }, []);

  // ============================================================================
  // Core Tracking Methods
  // ============================================================================

  const track = useCallback(
    async (
      eventName: string,
      properties?: Record<string, any>,
      options?: {
        category?: EventCategory;
        revenue?: { currency: string; amount: number };
        immediate?: boolean;
      }
    ) => {
      if (!analytics.current) return;
      await analytics.current.track(eventName, properties, options);
    },
    []
  );

  const identify = useCallback(
    async (userId: string, traits?: Record<string, any>) => {
      if (!analytics.current) return;
      await analytics.current.identify(userId, traits);
    },
    []
  );

  const setUserProperties = useCallback(
    async (properties: Record<string, any>) => {
      if (!analytics.current) return;
      await analytics.current.setUserProperties(properties);
    },
    []
  );

  // ============================================================================
  // Domain-Specific Methods
  // ============================================================================

  const trackSearch = useCallback(
    (query: string, mode: string, results: number) => {
      return track('Search Performed', {
        query,
        search_mode: mode,
        results_count: results,
        has_results: results > 0,
      }, {
        category: EventCategory.SEARCH,
      });
    },
    [track]
  );

  const trackTrialView = useCallback(
    (trialId: string, matchScore?: number, position?: number) => {
      return track('Trial Viewed', {
        trial_id: trialId,
        match_score: matchScore,
        position,
      }, {
        category: EventCategory.CLINICAL_TRIALS,
        revenue: { currency: 'USD', amount: 10 },
      });
    },
    [track]
  );

  const trackTrialContact = useCallback(
    (trialId: string, method: string, action: 'view' | 'click') => {
      const eventName = action === 'view' ? 'Trial Contact Viewed' : 'Trial Contact Clicked';
      const revenue = action === 'view' ? 50 : 100;
      
      return track(eventName, {
        trial_id: trialId,
        contact_method: method,
      }, {
        category: EventCategory.CLINICAL_TRIALS,
        revenue: { currency: 'USD', amount: revenue },
      });
    },
    [track]
  );

  const trackHealthProfile = useCallback(
    (action: 'start' | 'question' | 'complete' | 'abandon', data: Record<string, any>) => {
      const eventMap = {
        start: 'Health Profile Started',
        question: 'Health Profile Question Answered',
        complete: 'Health Profile Completed',
        abandon: 'Health Profile Abandoned',
      };
      
      const revenueMap = {
        start: 0,
        question: 0,
        complete: 30,
        abandon: 0,
      };
      
      return track(eventMap[action], data, {
        category: EventCategory.HEALTH_PROFILE,
        revenue: revenueMap[action] > 0 ? {
          currency: 'USD',
          amount: revenueMap[action],
        } : undefined,
      });
    },
    [track]
  );

  const trackFeatureDiscovery = useCallback(
    (featureId: string, featureName: string, value: number, metadata?: Record<string, any>) => {
      return track('Feature Discovered', {
        feature_id: featureId,
        feature_name: featureName,
        feature_value: value,
        ...metadata
      }, {
        category: EventCategory.FEATURE_DISCOVERY,
      });
    },
    [track]
  );

  const trackConversion = useCallback(
    (eventId: string, value: number, metadata?: Record<string, any>) => {
      return track('Conversion', {
        event_id: eventId,
        event_value: value,
        ...metadata,
      }, {
        category: EventCategory.CONVERSION,
        revenue: { currency: 'USD', amount: value },
        immediate: true, // Send conversions immediately
      });
    },
    [track]
  );

  const trackError = useCallback(
    (error: Error | string, context?: Record<string, any>) => {
      const errorMessage = typeof error === 'string' ? error : error.message;
      const errorStack = typeof error === 'object' ? error.stack : undefined;
      
      return track('Error Occurred', {
        error_message: errorMessage,
        error_type: typeof error === 'object' ? error.name : 'Error',
        stack_trace: errorStack,
        ...context,
      }, {
        category: EventCategory.ERROR,
        immediate: true, // Send errors immediately
      });
    },
    [track]
  );

  const trackPerformance = useCallback(
    (metricName: string, value: number, rating?: string) => {
      return track('Web Vital', {
        metric_name: metricName,
        value,
        rating,
      }, {
        category: EventCategory.PERFORMANCE,
      });
    },
    [track]
  );

  // ============================================================================
  // Session Management
  // ============================================================================

  const getSession = useCallback(() => {
    return analytics.current?.getSession();
  }, []);

  const resetSession = useCallback(async () => {
    if (!analytics.current) return;
    await analytics.current.reset();
  }, []);

  const flush = useCallback(async () => {
    if (!analytics.current) return;
    await analytics.current.flush();
  }, []);

  // ============================================================================
  // Time Tracking
  // ============================================================================

  const startTimer = useCallback((name: string) => {
    if (typeof window === 'undefined') return;
    performance.mark(`${name}_start`);
  }, []);

  const endTimer = useCallback((name: string, metadata?: Record<string, any>) => {
    if (typeof window === 'undefined') return;
    
    try {
      performance.mark(`${name}_end`);
      performance.measure(name, `${name}_start`, `${name}_end`);
      
      const entries = performance.getEntriesByName(name, 'measure');
      const latestEntry = entries[entries.length - 1];
      
      if (latestEntry) {
        track('Performance Measure', {
          measure_name: name,
          duration: Math.round(latestEntry.duration),
          ...metadata,
        }, {
          category: EventCategory.PERFORMANCE,
        });
      }
    } catch (error) {
      console.error('Failed to measure performance:', error);
    }
  }, [track]);

  return {
    // Core methods
    track,
    identify,
    setUserProperties,
    
    // Domain-specific methods
    trackSearch,
    trackTrialView,
    trackTrialContact,
    trackHealthProfile,
    trackFeatureDiscovery,
    trackConversion,
    trackError,
    trackPerformance,
    
    // Session management
    getSession,
    resetSession,
    flush,
    
    // Time tracking
    startTimer,
    endTimer,
  };
}
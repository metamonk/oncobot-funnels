/**
 * Analytics wrapper for Clinical Trials searches
 * Tracks errors, no results, and search patterns
 */

interface SearchAnalytics {
  trackSearch: (params: {
    query: string;
    hasProfile: boolean;
    resultsCount: number;
    hasError: boolean;
    errorMessage?: string;
  }) => void;
  
  trackNoResults: (params: {
    query: string;
    hasProfile: boolean;
    searchType: string;
  }) => void;
  
  trackError: (params: {
    query: string;
    errorType: string;
    errorMessage: string;
  }) => void;
}

// Create a server-side compatible analytics tracker
// This will be called from the tool execution context
export function trackClinicalTrialSearch(params: {
  query: string;
  hasProfile: boolean;
  resultsCount: number;
  success: boolean;
  error?: string;
}) {
  // Log to console for now - in production this would send to analytics service
  // We can't use client hooks on the server side
  
  if (!params.success && params.error) {
    // Track error
    console.log('[Analytics] Clinical Trial Search Error', {
      event: 'Clinical Trial Search Error',
      query_length: params.query.length,
      has_profile: params.hasProfile,
      error_type: params.error.includes('API') ? 'api_error' : 'processing_error',
      error_message: params.error
    });
  } else if (params.resultsCount === 0) {
    // Track no results
    console.log('[Analytics] Clinical Trial No Results', {
      event: 'Clinical Trial No Results',
      query_length: params.query.length,
      has_profile: params.hasProfile,
      query_complexity: params.query.split(' ').length
    });
  } else {
    // Track successful search
    console.log('[Analytics] Clinical Trial Search', {
      event: 'Clinical Trial Search',
      query_length: params.query.length,
      has_profile: params.hasProfile,
      results_count: params.resultsCount,
      has_results: params.resultsCount > 0
    });
  }
}

// Track feature discovery when users use advanced features
export function trackFeatureDiscovery(feature: string, context?: any) {
  console.log('[Analytics] Feature Discovered', {
    event: 'Feature Discovered',
    feature_name: feature,
    ...context
  });
}

// Track time to value metrics
export function trackTimeToValue(metric: string, duration: number, context?: any) {
  console.log('[Analytics] Time to Value', {
    event: `Time to ${metric}`,
    duration_seconds: duration,
    ...context
  });
}
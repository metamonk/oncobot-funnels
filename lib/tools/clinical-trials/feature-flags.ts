/**
 * Feature flags for Clinical Trials system
 * Used for gradual rollout of new features and A/B testing
 */

/**
 * Feature flag configuration
 */
export const FEATURE_FLAGS = {
  /**
   * Enable new three-layer eligibility assessment system
   * When enabled:
   * - Properly separates search relevance, trial criteria, and user assessment
   * - Shows actual trial eligibility requirements
   * - Only calculates scores when user profile exists
   * 
   * Default: false (using legacy system)
   */
  USE_NEW_ELIGIBILITY_SYSTEM: process.env.NEXT_PUBLIC_USE_NEW_ELIGIBILITY_SYSTEM === 'true' || false,

  /**
   * Enable eligibility criteria parsing
   * When enabled:
   * - Attempts to parse unstructured eligibility text into structured criteria
   * - Shows parsed inclusion/exclusion criteria in UI
   * 
   * Default: false
   */
  PARSE_ELIGIBILITY_CRITERIA: process.env.NEXT_PUBLIC_PARSE_ELIGIBILITY_CRITERIA === 'true' || false,

  /**
   * Enable debug logging for eligibility assessment
   * When enabled:
   * - Logs detailed assessment steps
   * - Shows confidence scores and reasoning
   * 
   * Default: false in production
   */
  DEBUG_ELIGIBILITY: process.env.NODE_ENV === 'development' && 
                     process.env.NEXT_PUBLIC_DEBUG_ELIGIBILITY === 'true',
} as const;

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Get all active feature flags (for debugging)
 */
export function getActiveFeatures(): string[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .map(([flag]) => flag);
}
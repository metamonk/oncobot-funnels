/**
 * A/B Testing System
 * Following CLAUDE.md - comprehensive, internal A/B testing without UTM dependency
 */

import { clientCookies, getUserSession, updateUserSession } from './cookie-manager';

export interface ABTestVariant {
  variant: 'A' | 'B' | 'C';
  headline: string;
  subheadline: string;
  ctaText: string;
  urgencyLevel: 'none' | 'low' | 'medium' | 'high';
  showTestimonials: boolean;
  showTrialCounts: boolean;
}

/**
 * A/B Test configurations for different indications
 */
const AB_TEST_CONFIGS: Record<string, Record<'A' | 'B' | 'C', ABTestVariant>> = {
  lung: {
    A: {
      variant: 'A',
      headline: 'Do you qualify for a Lung Cancer clinical trial near you?',
      subheadline: 'Check eligibility in 2 minutes. Free and HIPAA-secure.',
      ctaText: 'Start Eligibility Check',
      urgencyLevel: 'none',
      showTestimonials: true,
      showTrialCounts: false,
    },
    B: {
      variant: 'B',
      headline: 'Find Lung Cancer trials accepting patients now',
      subheadline: 'Get matched with 347+ active trials. Coordinator callback in 24-48 hours.',
      ctaText: 'Get Matched Now',
      urgencyLevel: 'medium',
      showTestimonials: false,
      showTrialCounts: true,
    },
    C: {
      variant: 'C',
      headline: 'Lung Cancer trials are enrolling — check eligibility today',
      subheadline: 'Our coordinators monitor 1,847 studies 24/7 to find your match.',
      ctaText: 'Check My Eligibility',
      urgencyLevel: 'high',
      showTestimonials: true,
      showTrialCounts: true,
    },
  },
  prostate: {
    A: {
      variant: 'A',
      headline: 'Do you qualify for a Prostate Cancer clinical trial near you?',
      subheadline: 'Check eligibility in 2 minutes. Free and HIPAA-secure.',
      ctaText: 'Start Eligibility Check',
      urgencyLevel: 'none',
      showTestimonials: true,
      showTrialCounts: false,
    },
    B: {
      variant: 'B',
      headline: 'Prostate Cancer trials accepting patients this month',
      subheadline: 'Access 218+ trials nationwide. Personal coordinator assigned.',
      ctaText: 'Find My Trials',
      urgencyLevel: 'medium',
      showTestimonials: false,
      showTrialCounts: true,
    },
    C: {
      variant: 'C',
      headline: 'New Prostate Cancer trials opening weekly — get matched first',
      subheadline: 'We monitor trials you cannot find online. Free coordinator service.',
      ctaText: 'Start Monitoring',
      urgencyLevel: 'high',
      showTestimonials: true,
      showTrialCounts: true,
    },
  },
  // Default for other indications
  default: {
    A: {
      variant: 'A',
      headline: 'Do you qualify for a clinical trial near you?',
      subheadline: 'Check eligibility in 2 minutes. Free and HIPAA-secure.',
      ctaText: 'Start Eligibility Check',
      urgencyLevel: 'none',
      showTestimonials: true,
      showTrialCounts: false,
    },
    B: {
      variant: 'B',
      headline: 'Find clinical trials accepting patients now',
      subheadline: 'Get matched with relevant trials. Coordinator support included.',
      ctaText: 'Get Matched',
      urgencyLevel: 'medium',
      showTestimonials: false,
      showTrialCounts: true,
    },
    C: {
      variant: 'C',
      headline: 'Clinical trials are enrolling — check eligibility today',
      subheadline: 'We monitor 1,847 studies 24/7 to find your match.',
      ctaText: 'Check Eligibility',
      urgencyLevel: 'high',
      showTestimonials: true,
      showTrialCounts: true,
    },
  },
};

/**
 * Generate deterministic A/B test variant based on session ID
 * This ensures consistent experience for the same user
 */
export function generateABVariant(sessionId: string): 'A' | 'B' | 'C' {
  // Create a hash from the session ID
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    const char = sessionId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Distribute evenly across variants
  const distribution = Math.abs(hash) % 100;

  if (distribution < 33) return 'A';
  if (distribution < 66) return 'B';
  return 'C';
}

/**
 * Get A/B test variant for server components
 */
export async function getABTestVariant(indication: string): Promise<ABTestVariant> {
  const session = await getUserSession();

  // Check if variant already assigned
  if (!session.abVariant) {
    // Generate and store variant
    session.abVariant = generateABVariant(session.sessionId);
    await updateUserSession({ abVariant: session.abVariant });
  }

  const config = AB_TEST_CONFIGS[indication] || AB_TEST_CONFIGS.default;
  return config[session.abVariant];
}

/**
 * Get A/B test variant for client components
 */
export function getClientABTestVariant(indication: string): ABTestVariant {
  const session = clientCookies.getSession();

  if (!session) {
    // Return default variant A if no session
    const config = AB_TEST_CONFIGS[indication] || AB_TEST_CONFIGS.default;
    return config.A;
  }

  // Generate variant if not set
  if (!session.abVariant) {
    session.abVariant = generateABVariant(session.sessionId);
    clientCookies.updateSession({ abVariant: session.abVariant });
  }

  const config = AB_TEST_CONFIGS[indication] || AB_TEST_CONFIGS.default;
  return config[session.abVariant];
}

/**
 * Track A/B test conversion
 */
export async function trackABConversion(
  indication: string,
  conversionType: 'cta_click' | 'quiz_start' | 'quiz_complete'
): Promise<void> {
  const session = await getUserSession();
  const variant = session.abVariant || 'A';

  // This would typically send to your analytics system
  // For now, we'll just log it
  console.log('A/B Test Conversion:', {
    sessionId: session.sessionId,
    variant,
    indication,
    conversionType,
    timestamp: new Date().toISOString(),
  });

  // You could also store this in a database for analysis
  // await db.abTestConversions.create({ ... });
}

/**
 * Get A/B test performance metrics (for admin dashboard)
 */
export interface ABTestMetrics {
  variant: 'A' | 'B' | 'C';
  impressions: number;
  ctaClicks: number;
  quizStarts: number;
  quizCompletions: number;
  ctaClickRate: number;
  quizStartRate: number;
  completionRate: number;
}

export async function getABTestMetrics(
  indication: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<ABTestMetrics[]> {
  // This would query your analytics database
  // For now, return mock data
  return [
    {
      variant: 'A',
      impressions: 1000,
      ctaClicks: 120,
      quizStarts: 100,
      quizCompletions: 45,
      ctaClickRate: 0.12,
      quizStartRate: 0.10,
      completionRate: 0.045,
    },
    {
      variant: 'B',
      impressions: 1000,
      ctaClicks: 150,
      quizStarts: 130,
      quizCompletions: 60,
      ctaClickRate: 0.15,
      quizStartRate: 0.13,
      completionRate: 0.06,
    },
    {
      variant: 'C',
      impressions: 1000,
      ctaClicks: 140,
      quizStarts: 115,
      quizCompletions: 52,
      ctaClickRate: 0.14,
      quizStartRate: 0.115,
      completionRate: 0.052,
    },
  ];
}

/**
 * Determine winning variant based on metrics
 */
export function determineWinningVariant(metrics: ABTestMetrics[]): 'A' | 'B' | 'C' | null {
  if (metrics.length === 0) return null;

  // Sort by completion rate (primary success metric)
  const sorted = [...metrics].sort((a, b) => b.completionRate - a.completionRate);
  const winner = sorted[0];
  const secondPlace = sorted[1];

  // Check if winner is statistically significant (simple check)
  // In production, you'd use proper statistical testing
  const improvementRate = (winner.completionRate - secondPlace.completionRate) / secondPlace.completionRate;

  // Require at least 10% improvement and minimum sample size
  if (improvementRate >= 0.1 && winner.impressions >= 100) {
    return winner.variant;
  }

  return null;
}
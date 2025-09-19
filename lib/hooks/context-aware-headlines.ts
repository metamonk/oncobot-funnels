/**
 * Context-Aware Headlines System
 *
 * Following CLAUDE.md principles - uses internal routing and context
 * instead of relying on UTM parameters
 */

import { getCancerConfig } from '@/lib/cancer-config';

interface UserContext {
  indication: string;
  visitCount?: number;
  referrer?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  hasCompletedQuiz?: boolean;
  previousPage?: string;
}

// Indication-specific headline variations
const INDICATION_HEADLINES = {
  lung: {
    default: "Do you qualify for a Lung Cancer clinical trial near you?",
    urgent: "Lung Cancer trials are enrolling now — check eligibility",
    specific: "Find targeted therapy trials for Lung Cancer",
    returning: "Continue your Lung Cancer trial search",
    mobile: "Quick Lung Cancer trial check",
  },
  prostate: {
    default: "Do you qualify for a Prostate Cancer clinical trial near you?",
    urgent: "Prostate Cancer trials accepting patients this month",
    specific: "Find advanced Prostate Cancer trials",
    returning: "Continue your Prostate Cancer trial search",
    mobile: "Quick Prostate Cancer trial check",
  },
  gi: {
    default: "Do you qualify for a GI Cancer clinical trial near you?",
    urgent: "GI/Colorectal trials enrolling now",
    specific: "Find targeted GI Cancer trials",
    returning: "Continue your GI Cancer trial search",
    mobile: "Quick GI Cancer trial check",
  },
  other: {
    default: "Find clinical trials for your cancer type",
    urgent: "Cancer trials enrolling now — all types",
    specific: "Find trials for rare and common cancers",
    returning: "Continue your cancer trial search",
    mobile: "Quick cancer trial eligibility check",
  }
};

// Supporting text that provides value props
const SUPPORTING_VALUE_PROPS = {
  trust: [
    "HIPAA-secure and confidential",
    "Trusted by 10,000+ patients",
    "100% free service"
  ],
  speed: [
    "2-minute eligibility check",
    "Coordinator callback in 24-48 hours",
    "Get matched in 48 hours"
  ],
  scale: [
    "Access to 1,847+ active trials",
    "Nationwide trial coverage",
    "50+ cancer types covered"
  ],
  human: [
    "Real coordinators, not algorithms",
    "Personal trial navigator assigned",
    "Human-powered matching"
  ]
};

/**
 * Get context-aware headline based on internal routing and user behavior
 */
export function getContextAwareHeadline(context: UserContext): string {
  const { indication = 'other' } = context;
  const headlines = INDICATION_HEADLINES[indication as keyof typeof INDICATION_HEADLINES]
    || INDICATION_HEADLINES.other;

  // Returning visitor
  if (context.visitCount && context.visitCount > 1) {
    return headlines.returning;
  }

  // Mobile user - shorter headline
  if (context.deviceType === 'mobile') {
    return headlines.mobile;
  }

  // Time-based urgency (evening/night visitors may be researching)
  if (context.timeOfDay === 'evening' || context.timeOfDay === 'night') {
    return headlines.urgent;
  }

  // Coming from specific content (blog, etc.)
  if (context.referrer?.includes('treatment') || context.referrer?.includes('therapy')) {
    return headlines.specific;
  }

  // Default headline
  return headlines.default;
}

/**
 * Get rotating value propositions based on indication
 */
export function getValueProps(indication: string): string[] {
  const config = getCancerConfig(indication);
  const { nationwide, regional, nearby } = config.trialCounts;

  // Create indication-specific value props
  const specificProps = [
    `${nationwide}+ ${config.name} trials nationwide`,
    `${regional} trials in your region`,
    `${nearby} trials near you`,
  ];

  // Combine with generic trust signals
  return [
    ...specificProps,
    ...SUPPORTING_VALUE_PROPS.trust,
    ...SUPPORTING_VALUE_PROPS.speed,
    ...SUPPORTING_VALUE_PROPS.human,
  ];
}

/**
 * Get subheadline based on context
 */
export function getContextAwareSubheadline(context: UserContext): string {
  const { indication = 'other' } = context;
  const config = getCancerConfig(indication);

  if (context.deviceType === 'mobile') {
    return "Free • 2 minutes • HIPAA-secure";
  }

  if (context.visitCount && context.visitCount > 1) {
    return "Welcome back. Let's continue finding the right trial for you.";
  }

  // Default with trial counts
  return `Check eligibility for ${config.trialCounts.nationwide}+ active trials. Free coordinator support.`;
}

/**
 * Detect user context from various signals
 */
export function detectUserContext(
  indication: string,
  searchParams?: URLSearchParams,
  cookies?: { [key: string]: string }
): UserContext {
  const context: UserContext = { indication };

  // Get visit count from cookie
  if (cookies?.visitCount) {
    context.visitCount = parseInt(cookies.visitCount);
  }

  // Get referrer
  if (typeof window !== 'undefined') {
    context.referrer = document.referrer;

    // Detect device type
    const width = window.innerWidth;
    if (width < 768) {
      context.deviceType = 'mobile';
    } else if (width < 1024) {
      context.deviceType = 'tablet';
    } else {
      context.deviceType = 'desktop';
    }

    // Detect time of day
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      context.timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 17) {
      context.timeOfDay = 'afternoon';
    } else if (hour >= 17 && hour < 21) {
      context.timeOfDay = 'evening';
    } else {
      context.timeOfDay = 'night';
    }
  }

  return context;
}

/**
 * Get A/B test variant (deterministic based on session)
 */
export function getABTestVariant(sessionId: string): 'A' | 'B' | 'C' {
  // Simple hash to determine variant
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    const char = sessionId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const variant = Math.abs(hash) % 3;
  return variant === 0 ? 'A' : variant === 1 ? 'B' : 'C';
}

// Export configuration for testing different approaches
export const HEADLINE_STRATEGIES = {
  CONTEXT_AWARE: 'context_aware',
  A_B_TEST: 'ab_test',
  STATIC: 'static',
  TIME_BASED: 'time_based',
  JOURNEY_STAGE: 'journey_stage'
} as const;

export type HeadlineStrategy = typeof HEADLINE_STRATEGIES[keyof typeof HEADLINE_STRATEGIES];
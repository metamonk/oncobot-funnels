/**
 * Enhanced Tracking System
 * Following CLAUDE.md - comprehensive tracking with context awareness
 */

import { getUserSession, updateUserSession } from './cookie-manager';
import { trackABConversion } from './ab-testing';

export interface TrackingEvent {
  eventName: string;
  sessionId: string;
  timestamp: string;
  properties: Record<string, any>;
  context: {
    indication?: string;
    abVariant?: 'A' | 'B' | 'C';
    journeyStage?: 'awareness' | 'consideration' | 'decision';
    visitCount?: number;
    deviceType?: 'mobile' | 'desktop' | 'tablet';
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    referrer?: string;
    userAgent?: string;
    screenResolution?: string;
    timezone?: string;
  };
}

/**
 * Enhanced tracking that includes all context
 */
export async function trackEvent(
  eventName: string,
  properties: Record<string, any> = {},
  indication?: string
): Promise<void> {
  const session = await getUserSession();

  const context = {
    indication,
    abVariant: session.abVariant,
    journeyStage: session.journeyStage,
    visitCount: session.visitCount,
    deviceType: getDeviceType(),
    timeOfDay: getTimeOfDay(),
    referrer: getReferrer(),
    userAgent: getUserAgent(),
    screenResolution: getScreenResolution(),
    timezone: getTimezone(),
  };

  const event: TrackingEvent = {
    eventName,
    sessionId: session.sessionId,
    timestamp: new Date().toISOString(),
    properties,
    context,
  };

  // Send to analytics providers
  await sendToAnalytics(event);

  // Track specific conversion events for A/B testing
  if (eventName === 'cta_clicked' && indication) {
    await trackABConversion(indication, 'cta_click');
  } else if (eventName === 'quiz_started' && indication) {
    await trackABConversion(indication, 'quiz_start');
  } else if (eventName === 'quiz_completed' && indication) {
    await trackABConversion(indication, 'quiz_complete');
  }

  // Update journey stage based on events
  await updateJourneyStageFromEvent(eventName);
}

/**
 * Send event to analytics providers (Google Analytics, Plausible, PostHog)
 */
async function sendToAnalytics(event: TrackingEvent): Promise<void> {
  // Google Analytics 4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event.eventName, {
      ...event.properties,
      ...event.context,
      session_id: event.sessionId,
    });
  }

  // Plausible Analytics
  if (typeof window !== 'undefined' && (window as any).plausible) {
    (window as any).plausible(event.eventName, {
      props: {
        ...event.properties,
        variant: event.context.abVariant,
        stage: event.context.journeyStage,
      },
    });
  }

  // PostHog
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture(event.eventName, {
      ...event.properties,
      $session_id: event.sessionId,
      ...event.context,
    });
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Tracking Event:', event);
  }
}

/**
 * Update journey stage based on user actions
 */
async function updateJourneyStageFromEvent(eventName: string): Promise<void> {
  const session = await getUserSession();
  let newStage = session.journeyStage;

  // Progress through stages based on engagement
  if (eventName === 'quiz_started' || eventName === 'cta_clicked') {
    newStage = 'decision';
  } else if (
    eventName === 'how_it_works_viewed' ||
    eventName === 'faq_expanded' ||
    eventName === 'testimonial_played'
  ) {
    if (session.journeyStage === 'awareness') {
      newStage = 'consideration';
    }
  }

  if (newStage !== session.journeyStage) {
    await updateUserSession({ journeyStage: newStage });
  }
}

/**
 * Track page view with enhanced context
 */
export async function trackPageView(
  page: string,
  indication?: string,
  title?: string
): Promise<void> {
  await trackEvent('page_viewed', {
    page,
    title: title || document.title,
    url: typeof window !== 'undefined' ? window.location.href : page,
  }, indication);

  // Update session with page view
  const session = await getUserSession();
  await updateUserSession({
    lastPage: page,
    indicationsViewed: indication && !session.indicationsViewed?.includes(indication)
      ? [...(session.indicationsViewed || []), indication]
      : session.indicationsViewed,
  });
}

/**
 * Track CTA interactions with context
 */
export async function trackCTA(
  action: 'clicked' | 'hovered' | 'viewed',
  location: string,
  text: string,
  indication?: string
): Promise<void> {
  await trackEvent(`cta_${action}`, {
    location,
    text,
    action,
  }, indication);
}

/**
 * Track quiz events
 */
export async function trackQuizEvent(
  action: 'started' | 'step_completed' | 'abandoned' | 'completed',
  indication: string,
  step?: number,
  data?: Record<string, any>
): Promise<void> {
  await trackEvent(`quiz_${action}`, {
    step,
    ...data,
  }, indication);

  // Update quiz status in session
  if (action === 'started') {
    await updateUserSession({ quizStarted: true });
  } else if (action === 'completed') {
    await updateUserSession({ quizCompleted: true });
  }
}

/**
 * Track scroll depth
 */
export async function trackScrollDepth(
  depth: number,
  page: string,
  indication?: string
): Promise<void> {
  // Only track significant scroll milestones
  const milestones = [25, 50, 75, 90, 100];
  const milestone = milestones.find(m => depth >= m && depth < m + 10);

  if (milestone) {
    await trackEvent('scroll_depth', {
      depth: milestone,
      page,
    }, indication);
  }
}

/**
 * Track time on page
 */
export async function trackTimeOnPage(
  seconds: number,
  page: string,
  indication?: string
): Promise<void> {
  // Track at specific intervals
  const intervals = [10, 30, 60, 120, 300]; // seconds

  if (intervals.includes(seconds)) {
    await trackEvent('time_on_page', {
      seconds,
      page,
    }, indication);
  }
}

// Utility functions for getting context
function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getReferrer(): string {
  if (typeof document === 'undefined') return '';
  return document.referrer;
}

function getUserAgent(): string {
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent;
}

function getScreenResolution(): string {
  if (typeof window === 'undefined') return '';
  return `${window.screen.width}x${window.screen.height}`;
}

function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Unknown';
  }
}
/**
 * Cookie Manager for User Context
 * Following CLAUDE.md - comprehensive, context-aware cookie management
 */

import { cookies } from 'next/headers';

export interface UserSessionData {
  sessionId: string;
  visitCount: number;
  firstVisit: string;
  lastVisit: string;
  abVariant?: 'A' | 'B' | 'C';
  journeyStage?: 'awareness' | 'consideration' | 'decision';
  indicationsViewed?: string[];
  quizStarted?: boolean;
  quizCompleted?: boolean;
  lastPage?: string;
  utmSource?: string; // Store original source for attribution
}

const COOKIE_NAME = 'oncobot_session';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

/**
 * Generate a session ID if none exists
 */
function generateSessionId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get or create user session from cookies
 */
export async function getUserSession(): Promise<UserSessionData> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);

  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie.value) as UserSessionData;

      // Update visit count and last visit
      session.visitCount = (session.visitCount || 0) + 1;
      session.lastVisit = new Date().toISOString();

      // Save updated session
      await setUserSession(session);

      return session;
    } catch (error) {
      console.error('Error parsing session cookie:', error);
    }
  }

  // Create new session
  const newSession: UserSessionData = {
    sessionId: generateSessionId(),
    visitCount: 1,
    firstVisit: new Date().toISOString(),
    lastVisit: new Date().toISOString(),
    journeyStage: 'awareness',
    indicationsViewed: [],
  };

  await setUserSession(newSession);
  return newSession;
}

/**
 * Set user session in cookies
 */
export async function setUserSession(session: UserSessionData): Promise<void> {
  const cookieStore = cookies();

  cookieStore.set(COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

/**
 * Update specific session properties
 */
export async function updateUserSession(updates: Partial<UserSessionData>): Promise<UserSessionData> {
  const session = await getUserSession();
  const updatedSession = { ...session, ...updates };
  await setUserSession(updatedSession);
  return updatedSession;
}

/**
 * Track page view and update journey stage
 */
export async function trackPageView(page: string, indication?: string): Promise<void> {
  const session = await getUserSession();

  // Update last page
  session.lastPage = page;

  // Track indication views
  if (indication && !session.indicationsViewed?.includes(indication)) {
    session.indicationsViewed = [...(session.indicationsViewed || []), indication];
  }

  // Update journey stage based on pages viewed
  if (page.includes('/quiz')) {
    session.journeyStage = 'decision';
    session.quizStarted = true;
  } else if (page.includes('/thank-you')) {
    session.quizCompleted = true;
  } else if (session.visitCount > 2 || (session.indicationsViewed?.length || 0) > 1) {
    session.journeyStage = 'consideration';
  }

  await setUserSession(session);
}

/**
 * Get visit count from session
 */
export async function getVisitCount(): Promise<number> {
  const session = await getUserSession();
  return session.visitCount;
}

/**
 * Get journey stage from session
 */
export async function getJourneyStage(): Promise<'awareness' | 'consideration' | 'decision'> {
  const session = await getUserSession();
  return session.journeyStage || 'awareness';
}

/**
 * Client-side cookie utilities (for use in client components)
 */
export const clientCookies = {
  get(name: string): string | undefined {
    if (typeof document === 'undefined') return undefined;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift();
    }
    return undefined;
  },

  set(name: string, value: string, days: number = 30): void {
    if (typeof document === 'undefined') return;

    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
  },

  getSession(): UserSessionData | null {
    const sessionStr = this.get(COOKIE_NAME);
    if (!sessionStr) return null;

    try {
      return JSON.parse(decodeURIComponent(sessionStr));
    } catch {
      return null;
    }
  },

  updateSession(updates: Partial<UserSessionData>): void {
    const current = this.getSession() || {
      sessionId: generateSessionId(),
      visitCount: 0,
      firstVisit: new Date().toISOString(),
      lastVisit: new Date().toISOString(),
      journeyStage: 'awareness' as const,
      indicationsViewed: [],
    };

    const updated = { ...current, ...updates };
    this.set(COOKIE_NAME, JSON.stringify(updated));
  }
};
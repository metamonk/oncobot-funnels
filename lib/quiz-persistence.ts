/**
 * Quiz Persistence and Abandonment Recovery
 * Following CLAUDE.md principles for comprehensive solution
 */

import { ghlClient, type LeadData } from '@/lib/gohighlevel/client';

interface PartialQuizData {
  indication?: string;
  cancerType?: string;
  zipCode?: string;
  email?: string;
  phone?: string;
  fullName?: string;
  forWhom?: string;
  stage?: string;
  biomarkers?: string;
  priorTherapy?: string;
  currentStep?: number;
  lastUpdated?: string;
  sessionId?: string;
}

const STORAGE_KEY = 'oncobot_quiz_progress';
const STORAGE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Save quiz progress to localStorage
 */
export function saveQuizProgress(data: PartialQuizData): void {
  try {
    const sessionData = {
      ...data,
      lastUpdated: new Date().toISOString(),
      sessionId: getOrCreateSessionId()
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    }
  } catch (error) {
    console.error('Failed to save quiz progress:', error);
  }
}

/**
 * Load saved quiz progress
 */
export function loadQuizProgress(indication: string): PartialQuizData | null {
  try {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored) as PartialQuizData;

    // Check if data is expired
    if (data.lastUpdated) {
      const age = Date.now() - new Date(data.lastUpdated).getTime();
      if (age > STORAGE_EXPIRY) {
        clearQuizProgress();
        return null;
      }
    }

    // Only return if it matches current indication path
    if (data.indication !== indication && !(indication === 'other' && data.indication === 'other')) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to load quiz progress:', error);
    return null;
  }
}

/**
 * Clear saved quiz progress
 */
export function clearQuizProgress(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to clear quiz progress:', error);
  }
}

/**
 * Get or create a session ID for tracking
 */
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('quiz_session_id');
  if (!sessionId) {
    sessionId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('quiz_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Submit partial lead to CRM for abandoned quiz recovery
 * This allows follow-up even without full contact info
 */
export async function submitPartialLead(data: PartialQuizData): Promise<void> {
  // Only submit if we have at least email or phone
  if (!data.email && !data.phone) {
    return;
  }

  try {
    const leadData: LeadData = {
      email: data.email || '',
      phone: data.phone || '',
      fullName: data.fullName || '',  // Don't set "Quiz Abandoner" - let the API handle defaults
      source: 'partial_quiz',
      indication: data.cancerType || data.indication || '',
      condition: data.cancerType || data.indication || '',
      zipCode: data.zipCode || '',
      stage: data.stage || '',
      biomarkers: data.biomarkers || '',
      priorTherapy: data.priorTherapy || '',
      notes: `Quiz abandoned at step ${data.currentStep || 1}. Session: ${data.sessionId || 'unknown'}`,
      timestamp: new Date().toISOString()
    };

    // Submit to GoHighLevel with abandonment tracking
    await ghlClient.submitLead(leadData);
    console.log('Partial lead submitted for recovery follow-up');
  } catch (error) {
    console.error('Failed to submit partial lead:', error);
  }
}

/**
 * Calculate quiz completion percentage
 */
export function calculateCompletionPercentage(
  currentStep: number,
  totalSteps: number,
  hasEmail: boolean,
  hasFullContact: boolean
): number {
  const stepProgress = (currentStep / totalSteps) * 60; // Steps are 60% of progress
  const emailProgress = hasEmail ? 20 : 0; // Email is 20%
  const contactProgress = hasFullContact ? 20 : 0; // Full contact is 20%

  return Math.min(Math.round(stepProgress + emailProgress + contactProgress), 100);
}

/**
 * Detect if user is about to abandon (exit intent)
 */
export function setupExitIntentDetection(
  onExitIntent: () => void,
  options: {
    mouseLeaveDelay?: number;
    scrollThreshold?: number;
    inactivityTimeout?: number;
  } = {}
): () => void {
  const {
    mouseLeaveDelay = 100,
    scrollThreshold = 25,
    inactivityTimeout = 30000 // 30 seconds
  } = options;

  if (typeof window === 'undefined') {
    return () => {};
  }

  let exitIntentTriggered = false;
  let inactivityTimer: NodeJS.Timeout;

  // Mouse leave detection
  const handleMouseLeave = (e: MouseEvent) => {
    if (e.clientY <= 0 && !exitIntentTriggered) {
      setTimeout(() => {
        if (!exitIntentTriggered) {
          exitIntentTriggered = true;
          onExitIntent();
        }
      }, mouseLeaveDelay);
    }
  };

  // Rapid scroll up detection (indicates leaving)
  let lastScrollY = window.scrollY;
  const handleScroll = () => {
    const scrollDiff = lastScrollY - window.scrollY;
    if (scrollDiff > scrollThreshold && window.scrollY < 100 && !exitIntentTriggered) {
      exitIntentTriggered = true;
      onExitIntent();
    }
    lastScrollY = window.scrollY;
  };

  // Inactivity detection
  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      if (!exitIntentTriggered) {
        exitIntentTriggered = true;
        onExitIntent();
      }
    }, inactivityTimeout);
  };

  // Mobile back button detection
  const handlePopState = () => {
    if (!exitIntentTriggered) {
      exitIntentTriggered = true;
      onExitIntent();
    }
  };

  // Set up listeners
  document.addEventListener('mouseleave', handleMouseLeave);
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('popstate', handlePopState);

  // Activity listeners for inactivity detection
  document.addEventListener('mousemove', resetInactivityTimer);
  document.addEventListener('keypress', resetInactivityTimer);
  document.addEventListener('click', resetInactivityTimer);
  document.addEventListener('touchstart', resetInactivityTimer);

  // Start inactivity timer
  resetInactivityTimer();

  // Cleanup function
  return () => {
    document.removeEventListener('mouseleave', handleMouseLeave);
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('popstate', handlePopState);
    document.removeEventListener('mousemove', resetInactivityTimer);
    document.removeEventListener('keypress', resetInactivityTimer);
    document.removeEventListener('click', resetInactivityTimer);
    document.removeEventListener('touchstart', resetInactivityTimer);
    clearTimeout(inactivityTimer);
  };
}

/**
 * Format resumption message based on saved progress
 */
export function getResumptionMessage(data: PartialQuizData): string {
  const percentage = calculateCompletionPercentage(
    data.currentStep || 1,
    4, // Assuming max 4 steps
    !!data.email,
    !!(data.email && data.phone && data.fullName)
  );

  if (percentage >= 75) {
    return "You're almost done! Just a few more questions to find your matching trials.";
  } else if (percentage >= 50) {
    return "Welcome back! You're halfway to finding clinical trials that match your profile.";
  } else if (percentage >= 25) {
    return "Continue where you left off to discover clinical trial options near you.";
  } else {
    return "Pick up where you left off - it only takes 2 minutes to complete.";
  }
}
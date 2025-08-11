/**
 * Centralized utility functions for health profile prompt management
 * Ensures DRY principle across all components using health profile prompts
 */

const DISMISSAL_STORAGE_KEY = 'healthProfilePromptLastDismissed';
const DISMISSAL_COOLDOWN_HOURS = 24;

/**
 * Record that the health profile prompt was dismissed
 */
export function recordHealthProfileDismissal(): void {
  localStorage.setItem(DISMISSAL_STORAGE_KEY, Date.now().toString());
}

/**
 * Clear the health profile dismissal record
 * Should be called after the user completes their profile
 */
export function clearHealthProfileDismissal(): void {
  localStorage.removeItem(DISMISSAL_STORAGE_KEY);
}

/**
 * Check if the health profile prompt was dismissed recently
 * @param cooldownHours - Number of hours for the cooldown period (default: 24)
 * @returns true if dismissed within the cooldown period
 */
export function wasHealthProfileRecentlyDismissed(
  cooldownHours: number = DISMISSAL_COOLDOWN_HOURS
): boolean {
  const lastDismissed = localStorage.getItem(DISMISSAL_STORAGE_KEY);
  
  if (!lastDismissed) {
    return false;
  }
  
  const dismissedTime = parseInt(lastDismissed, 10);
  const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
  
  return hoursSinceDismissed < cooldownHours;
}

/**
 * Get the timestamp of the last dismissal
 * @returns The timestamp or null if never dismissed
 */
export function getLastDismissalTime(): number | null {
  const lastDismissed = localStorage.getItem(DISMISSAL_STORAGE_KEY);
  return lastDismissed ? parseInt(lastDismissed, 10) : null;
}

/**
 * Get hours since last dismissal
 * @returns Number of hours since dismissal or null if never dismissed
 */
export function getHoursSinceDismissal(): number | null {
  const lastDismissed = getLastDismissalTime();
  
  if (!lastDismissed) {
    return null;
  }
  
  return (Date.now() - lastDismissed) / (1000 * 60 * 60);
}

/**
 * Configuration for health profile prompt timers
 */
export const HEALTH_PROFILE_PROMPT_TIMERS = {
  /** Quick prompt shown in messages view (30 seconds) */
  MESSAGES_VIEW: 30000,
  /** Delayed prompt shown in chat interface (3 minutes) */
  CHAT_INTERFACE: 180000,
} as const;

/**
 * Export storage key for components that need direct access
 */
export const STORAGE_KEYS = {
  DISMISSAL: DISMISSAL_STORAGE_KEY,
} as const;
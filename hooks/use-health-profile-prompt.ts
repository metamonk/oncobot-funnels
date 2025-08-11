/**
 * Custom hook for managing health profile prompt logic
 * Centralizes all health profile prompt behavior to follow DRY principles
 */

import { useEffect, useRef, useCallback } from 'react';
import { hasCompletedHealthProfile } from '@/lib/health-profile-actions';
import {
  recordHealthProfileDismissal,
  clearHealthProfileDismissal,
  wasHealthProfileRecentlyDismissed,
} from '@/lib/health-profile-prompt-utils';

export interface HealthProfilePromptConfig {
  /** Delay in milliseconds before showing the prompt */
  delayMs: number;
  /** Whether to check the 24-hour dismissal cooldown */
  checkDismissalCooldown?: boolean;
  /** Cooldown period in hours after dismissal (default: 24) */
  dismissalCooldownHours?: number;
}

const DEFAULT_CONFIG: Partial<HealthProfilePromptConfig> = {
  checkDismissalCooldown: true,
  dismissalCooldownHours: 24,
};

/**
 * Hook to manage health profile prompt timing and display logic
 * 
 * @param user - The authenticated user object
 * @param config - Configuration for the prompt behavior
 * @param onShowPrompt - Callback to execute when the prompt should be shown
 * @returns Object with utility functions for managing the prompt
 */
export function useHealthProfilePrompt(
  user: any,
  config: HealthProfilePromptConfig,
  onShowPrompt: () => void
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const hasCheckedRef = useRef(false); // Track if we've already checked
  const cachedHasCompletedRef = useRef<boolean | null>(null); // Cache the result
  
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  /**
   * Check if the prompt was dismissed recently
   */
  const wasRecentlyDismissed = useCallback((): boolean => {
    if (!mergedConfig.checkDismissalCooldown) return false;
    return wasHealthProfileRecentlyDismissed(mergedConfig.dismissalCooldownHours);
  }, [mergedConfig]);

  /**
   * Determine if the prompt should be shown
   */
  const shouldShowPrompt = useCallback(async (): Promise<boolean> => {
    // No user, no prompt
    if (!user) return false;
    
    try {
      // Check if user has completed their health profile
      const hasCompleted = await hasCompletedHealthProfile();
      
      // Never show to users with completed profiles
      if (hasCompleted) {
        return false;
      }
      
      // Check dismissal cooldown
      if (wasRecentlyDismissed()) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking health profile status:', error);
      return false;
    }
  }, [user, wasRecentlyDismissed]);

  /**
   * Start the timer to show the prompt
   */
  const startPromptTimer = useCallback(async () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    const shouldShow = await shouldShowPrompt();
    
    if (shouldShow && mountedRef.current) {
      timerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          onShowPrompt();
        }
      }, mergedConfig.delayMs);
    }
  }, [shouldShowPrompt, onShowPrompt, mergedConfig.delayMs]);

  /**
   * Record that the prompt was dismissed
   */
  const recordDismissal = useCallback(() => {
    recordHealthProfileDismissal();
  }, []);

  /**
   * Clear the dismissal record (e.g., after profile completion)
   */
  const clearDismissal = useCallback(() => {
    clearHealthProfileDismissal();
  }, []);

  /**
   * Cancel the prompt timer
   */
  const cancelTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Set up the timer when the hook is used
  useEffect(() => {
    mountedRef.current = true;
    
    // Only start timer if user exists
    if (!user) {
      hasCheckedRef.current = false; // Reset when user changes
      cachedHasCompletedRef.current = null;
      return;
    }
    
    // If we've already checked for this user, don't check again
    if (hasCheckedRef.current) {
      return;
    }
    
    // Check conditions and start timer
    const initTimer = async () => {
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      
      try {
        // Use cached result if available, otherwise check
        let hasCompleted = cachedHasCompletedRef.current;
        
        if (hasCompleted === null) {
          // Only make the DB call once
          hasCompleted = await hasCompletedHealthProfile();
          cachedHasCompletedRef.current = hasCompleted;
          hasCheckedRef.current = true;
        }
        
        // Never show to users with completed profiles
        if (hasCompleted) {
          return;
        }
        
        // Check dismissal cooldown
        if (mergedConfig.checkDismissalCooldown && 
            wasHealthProfileRecentlyDismissed(mergedConfig.dismissalCooldownHours)) {
          return;
        }
        
        // Start the timer
        if (mountedRef.current) {
          timerRef.current = setTimeout(() => {
            if (mountedRef.current) {
              onShowPrompt();
            }
          }, mergedConfig.delayMs);
        }
      } catch (error) {
        console.error('Error setting up health profile prompt timer:', error);
      }
    };
    
    initTimer();
    
    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [user?.id]); // Only depend on user.id to prevent unnecessary re-runs

  return {
    recordDismissal,
    clearDismissal,
    cancelTimer,
    wasRecentlyDismissed,
    shouldShowPrompt,
  };
}

/**
 * Utility function to check if a user needs to complete their health profile
 * Can be used independently of the hook
 */
export async function userNeedsHealthProfile(user: any): Promise<boolean> {
  if (!user) return false;
  
  try {
    const hasCompleted = await hasCompletedHealthProfile();
    return !hasCompleted;
  } catch (error) {
    console.error('Error checking health profile completion:', error);
    return false;
  }
}
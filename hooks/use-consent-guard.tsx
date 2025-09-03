'use client';

import { useState, useCallback } from 'react';
import { ConsentService, ConsentCategory } from '@/lib/consent/consent-client';
import { useSession } from '@/lib/auth-client';
import { toast } from 'sonner';

interface UseConsentGuardResult {
  checkConsent: (action: string) => Promise<boolean>;
  hasRequiredConsents: () => Promise<boolean>;
  isLoading: boolean;
}

/**
 * Hook to guard actions that require user consent
 * Returns true if user has consent, false if they need to grant it
 */
export function useConsentGuard(): UseConsentGuardResult {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  const checkConsent = useCallback(async (action: string): Promise<boolean> => {
    if (!session?.user?.id) {
      toast.error('Please sign in to continue');
      return false;
    }

    setIsLoading(true);
    try {
      // Get required consents for this action
      const requiredCategories = ConsentService.getRequiredConsentsForAction(action);
      
      if (requiredCategories.length === 0) {
        // No consent required for this action
        return true;
      }

      // Check if user has all required consents
      const hasAll = await Promise.all(
        requiredCategories.map(category =>
          ConsentService.hasConsent(session.user.id, category)
        )
      );

      const hasAllConsents = hasAll.every(has => has === true);

      if (!hasAllConsents) {
        // User needs to grant consent
        // The component using this hook should show the consent dialog
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking consent:', error);
      toast.error('Failed to verify consent status');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const hasRequiredConsents = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) {
      return false;
    }

    try {
      return await ConsentService.hasRequiredConsents(session.user.id);
    } catch (error) {
      console.error('Error checking required consents:', error);
      return false;
    }
  }, [session]);

  return {
    checkConsent,
    hasRequiredConsents,
    isLoading
  };
}
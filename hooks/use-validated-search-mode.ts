import { useEffect, useState } from 'react';
import { useLocalStorage } from './use-local-storage';
import { SearchGroupId } from '@/lib/utils';
import { isSearchModeEnabled } from '@/lib/feature-toggles';

/**
 * Custom hook that manages the selected search mode with validation
 * Ensures the saved mode is still enabled, preventing hydration errors
 */
export function useValidatedSearchMode(defaultMode: SearchGroupId = 'health') {
  // Use localStorage to persist the selection
  const [savedMode, setSavedMode] = useLocalStorage<SearchGroupId>('oncobot-selected-group', defaultMode);
  
  // State for the validated mode
  const [validatedMode, setValidatedMode] = useState<SearchGroupId>(defaultMode);
  
  useEffect(() => {
    // Validate the saved mode
    if (isSearchModeEnabled(savedMode)) {
      setValidatedMode(savedMode);
    } else {
      // If saved mode is disabled, try to fall back to 'health'
      if (isSearchModeEnabled('health')) {
        setValidatedMode('health');
        setSavedMode('health'); // Update localStorage to prevent future mismatches
      } else {
        // If even 'health' is disabled, use the first enabled mode
        const enabledModes = ['web', 'chat', 'academic', 'youtube', 'x', 'reddit', 'news', 'shopping', 'code', 'maps', 'stock', 'finance', 'travel', 'movie', 'health', 'extreme', 'memory'] as SearchGroupId[];
        const firstEnabled = enabledModes.find(mode => isSearchModeEnabled(mode));
        if (firstEnabled) {
          setValidatedMode(firstEnabled);
          setSavedMode(firstEnabled);
        } else {
          // This should never happen unless all modes are disabled
          console.error('No search modes are enabled!');
          setValidatedMode(defaultMode);
        }
      }
    }
  }, [savedMode, setSavedMode, defaultMode]);
  
  // Return the validated mode and setter
  return [validatedMode, setSavedMode] as const;
}
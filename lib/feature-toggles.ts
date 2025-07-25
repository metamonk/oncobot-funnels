import { SearchGroupId } from './utils';

// Cache the parsed configuration
let enabledModesCache: Set<SearchGroupId> | null | undefined = undefined;

/**
 * Parse and cache the enabled search modes from environment variable
 * Returns null if all modes should be enabled (default behavior)
 */
function getEnabledModes(): Set<SearchGroupId> | null {
  // Return cached value if available
  if (enabledModesCache !== undefined) {
    return enabledModesCache;
  }

  // Parse from environment variable
  const enabledModesEnv = process.env.NEXT_PUBLIC_ENABLED_SEARCH_MODES;
  
  console.log('[Feature Toggle] Environment variable NEXT_PUBLIC_ENABLED_SEARCH_MODES:', enabledModesEnv);
  
  // If not set or empty, enable all modes
  if (!enabledModesEnv || enabledModesEnv.trim() === '') {
    enabledModesCache = null;
    console.log('[Feature Toggle] No modes specified, enabling all');
    return null;
  }

  // Parse comma-separated list
  const modes = enabledModesEnv
    .split(',')
    .map(mode => mode.trim() as SearchGroupId)
    .filter(mode => mode.length > 0);

  console.log('[Feature Toggle] Parsed modes:', modes);

  // Cache and return
  enabledModesCache = new Set(modes);
  return enabledModesCache;
}

/**
 * Check if a specific search mode is enabled
 */
export function isSearchModeEnabled(mode: SearchGroupId): boolean {
  const enabledModes = getEnabledModes();
  
  // If no specific modes configured, all are enabled
  if (enabledModes === null) {
    return true;
  }
  
  // Check if mode is in the enabled set
  const isEnabled = enabledModes.has(mode);
  console.log(`[Feature Toggle] Mode ${mode} is ${isEnabled ? 'enabled' : 'disabled'}`);
  return isEnabled;
}

/**
 * Get all enabled search modes
 * Returns null if all modes are enabled
 */
export function getEnabledSearchModes(): Set<SearchGroupId> | null {
  return getEnabledModes();
}

/**
 * Clear the cache (useful for testing)
 */
export function clearFeatureToggleCache(): void {
  enabledModesCache = undefined;
}
/**
 * Shared Analytics Utilities
 * 
 * Common utility functions used across all analytics modules
 */

import { AttributionSource, PerformanceCategory } from './types';

// ============================================================================
// Time and Duration Utilities
// ============================================================================

/**
 * Format duration in human-readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Get current timestamp
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * Get ISO timestamp string
 */
export function getISOTimestamp(): string {
  return new Date().toISOString();
}

// ============================================================================
// Performance Utilities
// ============================================================================

/**
 * Categorize performance based on duration
 */
export function getPerformanceCategory(milliseconds: number): PerformanceCategory {
  if (milliseconds < 100) return PerformanceCategory.INSTANT;
  if (milliseconds < 300) return PerformanceCategory.FAST;
  if (milliseconds < 1000) return PerformanceCategory.MODERATE;
  if (milliseconds < 3000) return PerformanceCategory.SLOW;
  return PerformanceCategory.VERY_SLOW;
}

/**
 * Get performance rating based on value and thresholds
 */
export function getPerformanceRating(
  value: number,
  goodThreshold: number,
  needsImprovementThreshold: number
): 'good' | 'needs-improvement' | 'poor' {
  if (value <= goodThreshold) return 'good';
  if (value <= needsImprovementThreshold) return 'needs-improvement';
  return 'poor';
}

// ============================================================================
// Attribution Utilities
// ============================================================================

/**
 * Get attribution source from referrer and UTM params
 */
export function getAttributionSource(): AttributionSource {
  if (typeof window === 'undefined') return AttributionSource.DIRECT;
  
  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer;
  
  // Check UTM parameters first
  const utmSource = params.get('utm_source');
  const utmMedium = params.get('utm_medium');
  
  if (utmSource) {
    if (utmMedium === 'cpc' || utmMedium === 'ppc') {
      return AttributionSource.PAID_SEARCH;
    }
    if (utmMedium === 'social-paid') {
      return AttributionSource.PAID_SOCIAL;
    }
    if (utmMedium === 'social') {
      return AttributionSource.SOCIAL;
    }
    if (utmMedium === 'email') {
      return AttributionSource.EMAIL;
    }
  }
  
  // Check referrer
  if (!referrer) {
    return AttributionSource.DIRECT;
  }
  
  try {
    const referrerHost = new URL(referrer).hostname;
    
    // Search engines
    if (/google|bing|yahoo|duckduckgo|baidu/.test(referrerHost)) {
      return AttributionSource.ORGANIC_SEARCH;
    }
    
    // Social media
    if (/facebook|twitter|linkedin|instagram|youtube|reddit/.test(referrerHost)) {
      return AttributionSource.SOCIAL;
    }
    
    // Same domain
    if (referrerHost === window.location.hostname) {
      return AttributionSource.INTERNAL;
    }
  } catch (error) {
    // Invalid referrer URL
  }
  
  return AttributionSource.REFERRAL;
}

// ============================================================================
// Storage Utilities
// ============================================================================

/**
 * Safe storage operations with fallback
 */
export const SafeStorage = {
  get(key: string, storage: Storage = sessionStorage): string | null {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  },
  
  set(key: string, value: string, storage: Storage = sessionStorage): boolean {
    try {
      storage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  
  remove(key: string, storage: Storage = sessionStorage): boolean {
    try {
      storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  
  getJSON<T>(key: string, storage: Storage = sessionStorage): T | null {
    const value = this.get(key, storage);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },
  
  setJSON(key: string, value: any, storage: Storage = sessionStorage): boolean {
    try {
      return this.set(key, JSON.stringify(value), storage);
    } catch {
      return false;
    }
  }
};

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate event properties against a schema
 */
export function validateEventProperties(
  properties: Record<string, any>,
  requiredProps?: string[],
  optionalProps?: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required properties
  if (requiredProps) {
    for (const prop of requiredProps) {
      if (!(prop in properties)) {
        errors.push(`Missing required property: ${prop}`);
      }
    }
  }
  
  // Check for unknown properties
  if (requiredProps || optionalProps) {
    const allowedProps = new Set([
      ...(requiredProps || []),
      ...(optionalProps || [])
    ]);
    
    for (const prop in properties) {
      if (!allowedProps.has(prop)) {
        console.warn(`Unknown property in event: ${prop}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Safe function execution with error handling
 */
export async function safeExecute<T>(
  fn: () => T | Promise<T>,
  errorMessage: string = 'Analytics operation failed'
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    console.error(errorMessage, error);
    return null;
  }
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

// ============================================================================
// Debouncing and Throttling
// ============================================================================

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// ============================================================================
// Device and Environment Detection
// ============================================================================

/**
 * Get device information
 */
export function getDeviceInfo() {
  if (typeof window === 'undefined') return null;
  
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    connectionType: (navigator as any).connection?.effectiveType,
    deviceMemory: (navigator as any).deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
  };
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running on server
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

// ============================================================================
// Data Sanitization
// ============================================================================

/**
 * Sanitize sensitive data from properties
 */
export function sanitizeProperties(
  properties: Record<string, any>,
  sensitiveKeys: string[] = ['password', 'token', 'secret', 'api_key', 'credit_card']
): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(properties)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sensitive => 
      lowerKey.includes(sensitive.toLowerCase())
    );
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeProperties(value, sensitiveKeys);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
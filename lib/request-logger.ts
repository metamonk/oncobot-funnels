/**
 * Request logging utility for Next.js
 * Filters static assets and provides clean logging
 */

import { Logger } from './logger';

const startTimes = new Map<string, number>();

/**
 * Log the start of a request
 */
export function logRequestStart(pathname: string): void {
  // Store start time for duration calculation
  startTimes.set(pathname, Date.now());
}

/**
 * Log the completion of a request
 */
export function logRequestEnd(
  method: string,
  pathname: string,
  status: number
): void {
  const startTime = startTimes.get(pathname);
  const duration = startTime ? Date.now() - startTime : 0;
  
  // Clean up stored time
  startTimes.delete(pathname);
  
  // Use centralized logging that filters static assets
  Logger.logRequest(method, pathname, status, duration);
}

/**
 * Enhanced console.log wrapper for Next.js
 * This intercepts console.log to apply our filtering rules
 */
export function setupRequestLogging(): void {
  if (typeof window === 'undefined') { // Server-side only
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.log = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      
      // Filter out repetitive static asset logs
      if (Logger.isStaticAsset(message)) {
        return;
      }
      
      // Filter out verbose pathname logs
      if (message.startsWith('Pathname:')) {
        // Only log in debug mode
        if (process.env.LOG_LEVEL === 'debug') {
          originalLog(...args);
        }
        return;
      }
      
      // Mask sensitive data
      if (typeof args[0] === 'string') {
        args[0] = Logger.maskSensitive(args[0]);
      }
      
      originalLog(...args);
    };
    
    console.warn = (...args: any[]) => {
      if (typeof args[0] === 'string') {
        args[0] = Logger.maskSensitive(args[0]);
      }
      originalWarn(...args);
    };
    
    console.error = (...args: any[]) => {
      if (typeof args[0] === 'string') {
        args[0] = Logger.maskSensitive(args[0]);
      }
      originalError(...args);
    };
  }
}
/**
 * Next.js instrumentation file
 * Sets up logging configuration at app startup
 */

import { setupRequestLogging } from '@/lib/request-logger';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Set up enhanced logging on server startup
    setupRequestLogging();
    
    // Log startup info
    const logLevel = process.env.LOG_LEVEL || 'INFO';
    console.log(`[Server] Starting with log level: ${logLevel}`);
    
    // You can add more initialization here like:
    // - Performance monitoring
    // - Error tracking (Sentry, etc.)
    // - Custom metrics collection
  }
}
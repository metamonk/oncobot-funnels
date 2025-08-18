/**
 * Plausible Analytics Provider
 * 
 * Adapter for Plausible analytics service
 */

import { AnalyticsProvider, AnalyticsEvent, UserTraits, SessionData } from '../core/types';

export class PlausibleProvider implements AnalyticsProvider {
  public name = 'plausible';
  public isReady = false;
  private plausible: any = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (typeof window !== 'undefined' && window.plausible) {
      this.plausible = window.plausible;
      this.isReady = true;
    } else if (typeof window !== 'undefined') {
      // Wait for Plausible to be available
      const checkInterval = setInterval(() => {
        if (window.plausible) {
          this.plausible = window.plausible;
          this.isReady = true;
          clearInterval(checkInterval);
        }
      }, 100);
      
      // Stop checking after 5 seconds
      setTimeout(() => clearInterval(checkInterval), 5000);
    }
  }

  public async track(event: AnalyticsEvent): Promise<void> {
    if (!this.isReady || !this.plausible) return;

    const props: Record<string, any> = {
      ...event.properties,
      category: event.category,
    };

    // Plausible has a limit on property values
    const sanitizedProps = this.sanitizeProperties(props);

    const options: any = {
      props: sanitizedProps,
    };

    // Add revenue if present
    if (event.revenue) {
      options.revenue = {
        currency: event.revenue.currency,
        amount: event.revenue.amount,
      };
    }

    try {
      this.plausible(event.name, options);
    } catch (error) {
      console.error('Plausible: Failed to track event', error);
    }
  }

  public async identify(userId: string, traits?: UserTraits): Promise<void> {
    // Plausible doesn't support user identification
    // We can track this as a custom event
    if (!this.isReady || !this.plausible) return;

    try {
      this.plausible('User Identified', {
        props: {
          user_id: this.hashUserId(userId),
          has_profile: !!traits,
        },
      });
    } catch (error) {
      console.error('Plausible: Failed to track identification', error);
    }
  }

  public async setUserProperties(properties: Record<string, any>): Promise<void> {
    // Plausible doesn't support persistent user properties
    // Track as a custom event for analysis
    if (!this.isReady || !this.plausible) return;

    try {
      this.plausible('User Properties Set', {
        props: this.sanitizeProperties(properties),
      });
    } catch (error) {
      console.error('Plausible: Failed to track user properties', error);
    }
  }

  public async reset(): Promise<void> {
    // Plausible doesn't maintain user state, so nothing to reset
    // Track session end for analysis
    if (!this.isReady || !this.plausible) return;

    try {
      this.plausible('Session Reset', {
        props: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Plausible: Failed to track reset', error);
    }
  }

  public async startSession(sessionData: Partial<SessionData>): Promise<void> {
    if (!this.isReady || !this.plausible) return;

    try {
      this.plausible('Session Started', {
        props: {
          session_id: this.hashSessionId(sessionData.id),
          source: sessionData.source,
          timestamp: new Date(sessionData.startTime || Date.now()).toISOString(),
        },
      });
    } catch (error) {
      console.error('Plausible: Failed to track session start', error);
    }
  }

  public async endSession(): Promise<void> {
    if (!this.isReady || !this.plausible) return;

    try {
      this.plausible('Session Ended', {
        props: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Plausible: Failed to track session end', error);
    }
  }

  public async flush(): Promise<void> {
    // Plausible sends events immediately, no flush needed
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Sanitize properties for Plausible's limitations
   */
  private sanitizeProperties(props: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(props)) {
      // Plausible only accepts string values
      if (value === null || value === undefined) {
        continue;
      } else if (typeof value === 'boolean') {
        sanitized[key] = value ? 'true' : 'false';
      } else if (typeof value === 'number') {
        sanitized[key] = value.toString();
      } else if (typeof value === 'string') {
        // Limit string length to 1000 characters
        sanitized[key] = value.substring(0, 1000);
      } else if (typeof value === 'object') {
        // Convert objects to JSON string
        try {
          sanitized[key] = JSON.stringify(value).substring(0, 1000);
        } catch {
          sanitized[key] = '[object]';
        }
      } else {
        sanitized[key] = String(value).substring(0, 1000);
      }
    }
    
    return sanitized;
  }

  /**
   * Hash user ID for privacy
   */
  private hashUserId(userId: string): string {
    // Simple hash for privacy - in production, use a proper hashing function
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `user_${Math.abs(hash)}`;
  }

  /**
   * Hash session ID for privacy
   */
  private hashSessionId(sessionId?: string): string {
    if (!sessionId) return 'unknown';
    // Take first 8 characters as session identifier
    return sessionId.substring(0, 8);
  }
}
/**
 * PostHog Analytics Provider
 * 
 * Adapter for PostHog analytics service
 */

import { AnalyticsProvider, AnalyticsEvent, UserTraits, SessionData } from '../core/types';
import { isServer } from '../core/utils';

export class PostHogProvider implements AnalyticsProvider {
  public name = 'posthog';
  public isReady = false;
  private client: any = null;
  private isServerSide: boolean;

  constructor(config?: { apiKey?: string; host?: string; serverSide?: boolean }) {
    this.isServerSide = config?.serverSide || isServer();
    
    // Only initialize on the client side
    // Server-side initialization should be done separately when needed
    if (!this.isServerSide) {
      this.initializeClientClient();
    }
  }

  private async initializeServerClient(config?: { apiKey?: string; host?: string }) {
    if (!config?.apiKey) {
      console.warn('PostHog: No API key provided for server-side tracking');
      return;
    }

    try {
      const { PostHog } = await import('posthog-node');
      this.client = new PostHog(config.apiKey, {
        host: config.host || 'https://app.posthog.com',
        flushAt: 1,
        flushInterval: 0,
      });
      this.isReady = true;
    } catch (error) {
      console.error('Failed to initialize PostHog server client:', error);
    }
  }

  private initializeClientClient() {
    if (typeof window !== 'undefined' && window.posthog) {
      this.client = window.posthog;
      this.isReady = true;
    } else {
      // Wait for PostHog to be available
      if (typeof window !== 'undefined') {
        const checkInterval = setInterval(() => {
          if (window.posthog) {
            this.client = window.posthog;
            this.isReady = true;
            clearInterval(checkInterval);
          }
        }, 100);
        
        // Stop checking after 5 seconds
        setTimeout(() => clearInterval(checkInterval), 5000);
      }
    }
  }

  public async track(event: AnalyticsEvent): Promise<void> {
    if (!this.isReady || !this.client) return;

    const properties: Record<string, any> = {
      ...event.properties,
      category: event.category,
      session_id: event.sessionId,
      timestamp: event.timestamp,
    };

    // Add revenue if present
    if (event.revenue) {
      properties.$revenue = event.revenue.amount;
      properties.$currency = event.revenue.currency;
    }

    try {
      if (this.isServerSide) {
        this.client.capture({
          distinctId: event.userId || event.sessionId || 'anonymous',
          event: event.name,
          properties,
        });
        await this.client.flush();
      } else {
        this.client.capture(event.name, properties);
      }
    } catch (error) {
      console.error('PostHog: Failed to track event', error);
    }
  }

  public async identify(userId: string, traits?: UserTraits): Promise<void> {
    if (!this.isReady || !this.client) return;

    try {
      if (this.isServerSide) {
        this.client.identify({
          distinctId: userId,
          properties: traits,
        });
        await this.client.flush();
      } else {
        this.client.identify(userId, traits);
      }
    } catch (error) {
      console.error('PostHog: Failed to identify user', error);
    }
  }

  public async setUserProperties(properties: Record<string, any>): Promise<void> {
    if (!this.isReady || !this.client) return;

    try {
      if (this.isServerSide) {
        // Server-side doesn't have setPersonProperties, use identify
        console.warn('PostHog: setUserProperties not supported server-side');
      } else {
        this.client.setPersonProperties(properties);
      }
    } catch (error) {
      console.error('PostHog: Failed to set user properties', error);
    }
  }

  public async reset(): Promise<void> {
    if (!this.isReady || !this.client) return;

    try {
      if (!this.isServerSide && this.client.reset) {
        this.client.reset();
      }
    } catch (error) {
      console.error('PostHog: Failed to reset', error);
    }
  }

  public async startSession(sessionData: Partial<SessionData>): Promise<void> {
    if (!this.isReady || !this.client) return;

    try {
      if (!this.isServerSide) {
        this.client.register({
          session_id: sessionData.id,
          session_start: sessionData.startTime,
          attribution_source: sessionData.source,
        });
      }
    } catch (error) {
      console.error('PostHog: Failed to start session', error);
    }
  }

  public async endSession(): Promise<void> {
    // PostHog doesn't have explicit session end
    await this.flush();
  }

  public async flush(): Promise<void> {
    if (!this.isReady || !this.client) return;

    try {
      if (this.isServerSide && this.client.flush) {
        await this.client.flush();
      }
    } catch (error) {
      console.error('PostHog: Failed to flush', error);
    }
  }
}
/**
 * PostHog Analytics Provider - Client Side Only
 * 
 * Client-side adapter for PostHog analytics service
 * Server-side tracking should be done separately
 */

import { AnalyticsProvider, AnalyticsEvent, UserTraits, SessionData } from '../core/types';

export class PostHogClientProvider implements AnalyticsProvider {
  public name = 'posthog';
  public isReady = false;
  private client: any = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
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

  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.isReady || !this.client) return;

    try {
      this.client.capture(event.name, {
        ...event.properties,
        timestamp: event.timestamp,
        revenue: event.revenue?.amount,
        currency: event.revenue?.currency,
      });
    } catch (error) {
      console.error('PostHog tracking error:', error);
    }
  }

  async identify(userId: string, traits?: UserTraits): Promise<void> {
    if (!this.isReady || !this.client) return;

    try {
      this.client.identify(userId, traits);
    } catch (error) {
      console.error('PostHog identify error:', error);
    }
  }

  async setUserProperties(properties: Record<string, any>): Promise<void> {
    if (!this.isReady || !this.client) return;

    try {
      this.client.setPersonProperties(properties);
    } catch (error) {
      console.error('PostHog setUserProperties error:', error);
    }
  }

  async reset(): Promise<void> {
    if (!this.isReady || !this.client) return;

    try {
      this.client.reset();
    } catch (error) {
      console.error('PostHog reset error:', error);
    }
  }

  getSession(): SessionData | null {
    if (!this.isReady || !this.client) return null;

    try {
      const sessionId = this.client.get_session_id();
      const distinctId = this.client.get_distinct_id();
      
      return {
        id: sessionId || `session_${Date.now()}`,
        startTime: Date.now(),
        userId: distinctId,
        properties: {},
      };
    } catch (error) {
      console.error('PostHog getSession error:', error);
      return null;
    }
  }
}
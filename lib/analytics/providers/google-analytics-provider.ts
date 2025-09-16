import { AnalyticsProvider, AnalyticsEvent, UserTraits, SessionData, AttributionSource } from '../core/types';
import { sendGAEvent } from '@next/third-parties/google';
import { GAEventParams } from '@/lib/analytics/funnel-events';

/**
 * Google Analytics 4 Provider
 *
 * Integrates with GA4 using @next/third-parties
 */
export class GoogleAnalyticsProvider implements AnalyticsProvider {
  public name = 'google-analytics';
  public isReady = false;
  private gaId: string;
  private sessionData: Record<string, any> = {};

  constructor(gaId?: string) {
    this.gaId = gaId || process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || '';

    // Load session data from sessionStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('utm_params');
        if (stored) {
          this.sessionData = JSON.parse(stored);
        }
      } catch (error) {
        console.error('Failed to load UTM params:', error);
      }
    }
  }

  async initialize(): Promise<void> {
    if (!this.gaId) {
      console.warn('Google Analytics ID not configured');
      this.isReady = false;
      return;
    }

    this.isReady = true;
    console.log('Google Analytics provider initialized');
  }

  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.isReady || !this.gaId) return;

    try {
      // Map event properties to GA4 format
      const eventParams: GAEventParams = {
        ...this.sessionData,
        ...event.properties,
        event_category: event.category,
        timestamp: event.timestamp ? new Date(event.timestamp).toISOString() : new Date().toISOString(),
      };

      // Handle revenue tracking
      if (event.revenue) {
        eventParams.value = event.revenue.amount;
        eventParams.currency = event.revenue.currency;
      }

      // Send to GA4 using @next/third-parties
      sendGAEvent(event.name, eventParams);

      // Track conversions for key events
      if (this.isConversionEvent(event.name)) {
        sendGAEvent('conversion', {
          ...eventParams,
          conversion_name: event.name,
        });
      }
    } catch (error) {
      console.error('Failed to track event in GA4:', error);
    }
  }

  async identify(userId: string, traits?: UserTraits): Promise<void> {
    if (!this.isReady || !this.gaId) return;

    try {
      // Set user ID in GA4
      sendGAEvent('user_properties', {
        user_id: userId,
        ...traits,
      });

      // Store for future events
      this.sessionData.user_id = userId;
      if (traits) {
        this.sessionData = { ...this.sessionData, ...traits };
      }
    } catch (error) {
      console.error('Failed to identify user in GA4:', error);
    }
  }

  async page(name: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isReady || !this.gaId) return;

    try {
      // Track page view
      sendGAEvent('page_view', {
        page_title: name,
        page_location: properties?.url || window.location.href,
        page_path: properties?.path || window.location.pathname,
        ...properties,
      });
    } catch (error) {
      console.error('Failed to track page in GA4:', error);
    }
  }

  async flush(): Promise<void> {
    // GA4 handles its own batching
    // This is a no-op for GA4
  }

  async reset(): Promise<void> {
    this.sessionData = {};
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('utm_params');
      } catch (error) {
        console.error('Failed to clear session data:', error);
      }
    }
  }

  async getSession(): Promise<SessionData | null> {
    return {
      id: this.sessionData.session_id || '',
      startTime: new Date().getTime(),
      lastActivity: new Date().getTime(),
      pageViews: 0,
      events: [],
      source: this.sessionData.utm_source === 'google' && this.sessionData.utm_medium === 'cpc'
        ? AttributionSource.PAID_SEARCH
        : this.sessionData.utm_source === 'facebook' || this.sessionData.utm_source === 'instagram'
        ? AttributionSource.PAID_SOCIAL
        : this.sessionData.utm_source
        ? AttributionSource.REFERRAL
        : AttributionSource.DIRECT,
      touchpoints: [],
      conversions: [],
      totalValue: 0
    };
  }

  async setUserProperties(properties: Record<string, any>): Promise<void> {
    if (!this.isReady || !this.gaId) return;

    try {
      sendGAEvent('user_properties', properties);
      this.sessionData = { ...this.sessionData, ...properties };
    } catch (error) {
      console.error('Failed to set user properties in GA4:', error);
    }
  }

  // Helper methods

  private isConversionEvent(eventName: string): boolean {
    const conversionEvents = [
      'Quiz Completed',
      'Lead Form Submitted',
      'Trial Site Contacted',
      'Booking Form Submitted',
      'Health Profile Completed',
      'Conversion',
    ];
    return conversionEvents.includes(eventName);
  }

}

// Export a singleton instance for use in the unified analytics system
export const googleAnalyticsProvider = new GoogleAnalyticsProvider();
/**
 * Vercel Analytics Provider
 *
 * Provider for Vercel Analytics integration with unified analytics system
 */

import { track as vercelTrack } from '@vercel/analytics';
import {
  AnalyticsProvider,
  AnalyticsEvent,
  EventCategory
} from '../core/types';

export class VercelAnalyticsProvider implements AnalyticsProvider {
  name = 'vercel-analytics';
  isReady = false;
  private isEnabled = false;

  constructor() {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Vercel Analytics is automatically initialized by the <Analytics /> component
      // We just need to mark it as ready
      this.isEnabled = true;
      this.isReady = true;
      console.log('[Vercel Analytics] Provider initialized');
    } else {
      console.log('[Vercel Analytics] Disabled (SSR)');
    }
  }

  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.isEnabled || !this.isReady) {
      return;
    }

    try {
      // Format event name for Vercel Analytics
      const eventName = this.formatEventName(event.name);

      // Prepare properties with Vercel-specific formatting
      const properties = this.formatProperties(event);

      // Send to Vercel Analytics
      vercelTrack(eventName, properties);
    } catch (error) {
      console.error('[Vercel Analytics] Failed to track event', error);
    }
  }

  async identify(userId: string, traits?: Record<string, any>): Promise<void> {
    // Vercel Analytics doesn't have built-in user identification
    // We can track this as a custom event instead
    if (!this.isEnabled || !this.isReady) {
      return;
    }

    try {
      vercelTrack('User Identified', {
        userId,
        ...traits
      });
    } catch (error) {
      console.error('[Vercel Analytics] Failed to identify user', error);
    }
  }

  async reset(): Promise<void> {
    // Vercel Analytics doesn't have a reset method
    // This is a no-op for this provider
  }

  async flush?(): Promise<void> {
    // Vercel Analytics handles batching internally
    // This is a no-op for this provider
  }

  async setUserProperties(properties: Record<string, any>): Promise<void> {
    // Track user properties as a custom event
    if (!this.isEnabled || !this.isReady) {
      return;
    }

    try {
      vercelTrack('User Properties Updated', properties);
    } catch (error) {
      console.error('[Vercel Analytics] Failed to set user properties', error);
    }
  }

  private formatEventName(event: string): string {
    // Convert snake_case or kebab-case to Title Case for better readability
    return event
      .split(/[_-\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private formatProperties(event: AnalyticsEvent): Record<string, any> {
    const properties: Record<string, any> = {};

    // Flatten nested properties for Vercel Analytics compatibility
    const flattenProperties = (obj: any, prefix = ''): void => {
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        const newKey = prefix ? `${prefix}_${key}` : key;

        if (value === null || value === undefined) {
          // Skip null/undefined values
          return;
        } else if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          // Recursively flatten nested objects
          flattenProperties(value, newKey);
        } else if (Array.isArray(value)) {
          // Convert arrays to comma-separated strings
          properties[newKey] = value.join(',');
        } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          // Keep primitive values as-is
          properties[newKey] = value;
        } else if (value instanceof Date) {
          // Convert dates to ISO strings
          properties[newKey] = value.toISOString();
        }
      });
    };

    // Flatten the event properties
    if (event.properties) {
      flattenProperties(event.properties);
    }

    // Add category if present
    if (event.category) {
      properties.category = event.category;
    }

    // Add revenue information if present
    if (event.revenue) {
      properties.revenue = event.revenue.amount;
      properties.currency = event.revenue.currency;
    }

    // Add timestamp
    properties.timestamp = event.timestamp;

    // Add session ID if available
    if (event.sessionId) {
      properties.sessionId = event.sessionId;
    }

    // Add user ID if available
    if (event.userId) {
      properties.userId = event.userId;
    }

    // Filter out undefined values
    Object.keys(properties).forEach(key => {
      if (properties[key] === undefined) {
        delete properties[key];
      }
    });

    return properties;
  }

  // Helper method to track specific categories of events with custom formatting
  async trackCategoryEvent(category: EventCategory, event: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isEnabled || !this.isReady) {
      return;
    }

    const categoryPrefix: Record<string, string> = {
      [EventCategory.SEARCH]: 'Search',
      [EventCategory.CLINICAL_TRIALS]: 'Trial',
      [EventCategory.HEALTH_PROFILE]: 'Profile',
      [EventCategory.FEATURE_DISCOVERY]: 'Feature',
      [EventCategory.CONVERSION]: 'Conversion',
      [EventCategory.ERROR]: 'Error',
      [EventCategory.PERFORMANCE]: 'Performance',
      [EventCategory.ENGAGEMENT]: 'Engagement',
      [EventCategory.NAVIGATION]: 'Navigation',
    };

    const prefix = categoryPrefix[category] || String(category);
    const formattedEvent = `${prefix}: ${event}`;

    try {
      vercelTrack(formattedEvent, properties);
    } catch (error) {
      console.error('[Vercel Analytics] Failed to track category event', error);
    }
  }
}
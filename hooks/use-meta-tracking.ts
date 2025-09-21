'use client';

import { useCallback } from 'react';
import { trackStandardEvent } from '@/components/tracking/meta-pixel';

interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  zipCode?: string;
}

interface CustomData {
  value?: number;
  currency?: string;
  [key: string]: any;
}

export function useMetaTracking() {
  // Track both client and server side
  const trackConversion = useCallback(async (
    eventName: 'Lead' | 'CompleteRegistration' | 'Contact' | 'SubmitApplication',
    userData: UserData,
    customData?: CustomData
  ) => {
    // Client-side tracking (immediate)
    trackStandardEvent(eventName, {
      value: customData?.value || 100,
      currency: customData?.currency || 'USD',
      ...customData
    });

    // Server-side tracking (for CAPI)
    try {
      await fetch('/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventName,
          userData,
          customData
        })
      });
    } catch (error) {
      console.error('Failed to track server-side:', error);
      // Don't throw - client-side tracking already succeeded
    }
  }, []);

  // Track page view (client-side only)
  const trackPageView = useCallback(() => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, []);

  // Track custom event (client-side only for now)
  const trackCustomEvent = useCallback((eventName: string, parameters?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', eventName, parameters);
    }
  }, []);

  return {
    trackConversion,
    trackPageView,
    trackCustomEvent
  };
}
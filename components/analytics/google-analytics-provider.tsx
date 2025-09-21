'use client';

import { GoogleAnalytics, sendGAEvent } from '@next/third-parties/google';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, Suspense } from 'react';
import { GAEventParams } from '@/lib/analytics/funnel-events';

// GA4 Measurement ID from environment
const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || '';

interface GoogleAnalyticsProviderProps {
  children?: React.ReactNode;
}

function GoogleAnalyticsProviderInner({ children }: GoogleAnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Extract UTM parameters from search params
  const utmParams = useMemo(() => {
    if (!searchParams) return {};

    const params: Record<string, string> = {};
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];

    utmKeys.forEach((key) => {
      const value = searchParams.get(key);
      if (value) {
        params[key] = value;
      }
    });

    return params;
  }, [searchParams]);

  // Track page views
  useEffect(() => {
    if (!GA_ID || typeof window === 'undefined') return;

    // Send page view with UTM parameters
    const pageViewParams: GAEventParams = {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
      ...utmParams,
    };

    sendGAEvent('page_view', pageViewParams);
  }, [pathname, utmParams]);

  // Store UTM parameters in sessionStorage for persistence
  useEffect(() => {
    if (Object.keys(utmParams).length > 0 && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('utm_params', JSON.stringify(utmParams));
      } catch (error) {
        console.error('Failed to store UTM parameters:', error);
      }
    }
  }, [utmParams]);

  if (!GA_ID) {
    console.warn('Google Analytics ID not configured');
    return <>{children}</>;
  }

  return (
    <>
      <GoogleAnalytics gaId={GA_ID} />
      {children}
    </>
  );
}

// Export component wrapped in Suspense to prevent build errors
export function GoogleAnalyticsProvider(props: GoogleAnalyticsProviderProps) {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsProviderInner {...props} />
    </Suspense>
  );
}

// Export enhanced sendGAEvent with automatic UTM attachment
export function sendGAEventEnhanced(
  eventName: string,
  eventParams?: GAEventParams
) {
  if (!GA_ID) return;

  // Get stored UTM parameters
  let storedUtmParams: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('utm_params');
      if (stored) {
        storedUtmParams = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to retrieve UTM parameters:', error);
    }
  }

  // Merge stored UTM params with event params
  const enhancedParams: GAEventParams = {
    ...storedUtmParams,
    ...eventParams,
    timestamp: new Date().toISOString(),
  };

  sendGAEvent(eventName, enhancedParams);
}

// Helper function to track funnel events
export function trackFunnelEvent(
  category: string,
  action: string,
  label?: string,
  value?: number,
  additionalParams?: GAEventParams
) {
  const eventParams: GAEventParams = {
    event_category: category,
    event_label: label,
    value: value,
    ...additionalParams,
  };

  sendGAEventEnhanced(action, eventParams);
}

// Helper function to track conversions
export function trackConversion(
  conversionName: string,
  value?: number,
  currency: string = 'USD',
  additionalParams?: GAEventParams
) {
  const eventParams: GAEventParams = {
    value: value,
    currency: currency,
    conversion_name: conversionName,
    ...additionalParams,
  };

  // Send as both a conversion and a custom event
  sendGAEventEnhanced('conversion', eventParams);
  sendGAEventEnhanced(conversionName, eventParams);
}

// Helper function to track enhanced conversions with hashed PII
export function trackEnhancedConversion(
  conversionName: string,
  hashedEmail?: string,
  hashedPhone?: string,
  value?: number,
  additionalParams?: GAEventParams
) {
  const eventParams: GAEventParams = {
    value: value,
    currency: 'USD',
    conversion_name: conversionName,
    ...(hashedEmail && { email: hashedEmail }),
    ...(hashedPhone && { phone_number: hashedPhone }),
    ...additionalParams,
  };

  sendGAEventEnhanced('conversion', eventParams);
}

// Helper function for engagement tracking
export function trackEngagement(
  action: string,
  contentType: string,
  contentId?: string,
  additionalParams?: GAEventParams
) {
  const eventParams: GAEventParams = {
    content_type: contentType,
    content_id: contentId,
    engagement_time_msec: 100, // Default engagement time
    ...additionalParams,
  };

  sendGAEventEnhanced(action, eventParams);
}

// Helper for error tracking
export function trackError(
  errorMessage: string,
  errorLocation: string,
  fatal: boolean = false
) {
  sendGAEventEnhanced('exception', {
    description: errorMessage,
    fatal: fatal,
    error_location: errorLocation,
  });
}
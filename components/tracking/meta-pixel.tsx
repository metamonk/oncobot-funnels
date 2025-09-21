'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export default function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

  useEffect(() => {
    if (!pixelId) return;

    // Load Meta Pixel script
    if (!window.fbq) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(script);

      // Initialize pixel
      window.fbq = window.fbq || function() {
        (window.fbq.q = window.fbq.q || []).push(arguments);
      };
      window._fbq = window.fbq;
      window.fbq.loaded = true;
      window.fbq.version = '2.0';
      window.fbq.queue = [];

      // Initialize with your pixel ID
      window.fbq('init', pixelId);
    }

    // Track page view
    window.fbq('track', 'PageView');
  }, [pathname, searchParams, pixelId]);

  // No visual output
  return null;
}

// Helper function to track custom events
export function trackEvent(eventName: string, parameters?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, parameters);
  }
}

// Helper function for standard events
export function trackStandardEvent(
  eventName: 'Lead' | 'CompleteRegistration' | 'Contact' | 'SubmitApplication' | 'ViewContent' | 'Search',
  parameters?: {
    value?: number;
    currency?: string;
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    content_type?: string;
    [key: string]: any;
  }
) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, parameters);
  }
}
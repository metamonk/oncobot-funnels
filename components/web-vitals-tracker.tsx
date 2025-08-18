/**
 * Web Vitals Tracker Component
 * 
 * Tracks Core Web Vitals and sends to unified analytics
 */

'use client';

import { useEffect } from 'react';
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';

export function WebVitalsTracker() {
  const { trackPerformance } = useUnifiedAnalytics();

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Dynamically import web-vitals to avoid SSR issues
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onINP, onTTFB }) => {
      // Cumulative Layout Shift
      onCLS((metric) => {
        trackPerformance('CLS', metric.value, metric.rating);
      });

      // First Contentful Paint
      onFCP((metric) => {
        trackPerformance('FCP', metric.value, metric.rating);
      });

      // Largest Contentful Paint
      onLCP((metric) => {
        trackPerformance('LCP', metric.value, metric.rating);
      });

      // Interaction to Next Paint (replacing FID)
      onINP((metric) => {
        trackPerformance('INP', metric.value, metric.rating);
      });

      // Time to First Byte
      onTTFB((metric) => {
        trackPerformance('TTFB', metric.value, metric.rating);
      });
    });
  }, [trackPerformance]);

  return null;
}
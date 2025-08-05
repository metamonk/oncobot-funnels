'use client';

import { useEffect } from 'react';
import { usePostHogAnalytics } from '@/hooks/use-posthog-analytics';
import { usePathname } from 'next/navigation';

export function SessionQualityTracker() {
  const { trackSessionQuality, posthog } = usePostHogAnalytics();
  const pathname = usePathname();
  
  useEffect(() => {
    if (!posthog) return;
    
    // Increment page view count for this session
    const currentCount = posthog.get_property('pages_viewed_count') || 0;
    posthog.capture('$set', {
      $set: {
        pages_viewed_count: currentCount + 1,
        last_page_viewed: pathname,
      },
    });
  }, [pathname, posthog]);
  
  useEffect(() => {
    if (!posthog) return;
    
    // Track session quality when user is leaving
    const handleBeforeUnload = () => {
      trackSessionQuality();
    };
    
    // Track session quality after 5 minutes of activity
    const timer = setTimeout(() => {
      trackSessionQuality();
    }, 5 * 60 * 1000);
    
    // Track when visibility changes (tab switch)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackSessionQuality();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(timer);
    };
  }, [trackSessionQuality, posthog]);
  
  return null;
}
'use client';

import { useEffect } from 'react';
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';

/**
 * Client component for homepage analytics tracking
 */
export function HomepageTracker() {
  const { track } = useUnifiedAnalytics();

  useEffect(() => {
    track('homepage_viewed', {
      source: 'direct'
    });
  }, [track]);

  return null; // This component only handles tracking
}
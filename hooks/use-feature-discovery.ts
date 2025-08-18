'use client';

import { useCallback, useEffect, useRef } from 'react';
import { FeatureDiscovery, FEATURES, type FeatureId } from '@/lib/analytics/feature-discovery';

/**
 * Hook for tracking feature discovery and usage
 */
export function useFeatureDiscovery() {
  const trackedFeatures = useRef<Set<string>>(new Set());

  /**
   * Track feature discovery/usage
   */
  const trackFeature = useCallback((featureId: FeatureId, metadata?: Record<string, any>) => {
    FeatureDiscovery.track(featureId, metadata);
    trackedFeatures.current.add(featureId);
  }, []);

  /**
   * Track feature usage with count
   */
  const trackFeatureUsage = useCallback((featureId: FeatureId, metadata?: Record<string, any>) => {
    FeatureDiscovery.trackUsage(featureId, metadata);
    trackedFeatures.current.add(featureId);
  }, []);

  /**
   * Track when user discovers feature through hover/tooltip
   */
  const trackFeatureHover = useCallback((featureId: FeatureId) => {
    const feature = FEATURES[featureId];
    if (!feature) return;
    
    // Only track hover discovery once per session
    const hoverKey = `fd_hover_${feature.id}`;
    if (sessionStorage.getItem(hoverKey)) return;
    
    sessionStorage.setItem(hoverKey, Date.now().toString());
    
    if (window.plausible) {
      window.plausible('Feature Tooltip Viewed', {
        props: {
          feature_id: feature.id,
          feature_name: feature.name,
          feature_category: feature.category
        }
      });
    }
  }, []);

  /**
   * Get list of features discovered in this component
   */
  const getTrackedFeatures = useCallback(() => {
    return Array.from(trackedFeatures.current);
  }, []);

  /**
   * Get overall discovery score
   */
  const getDiscoveryScore = useCallback(() => {
    return FeatureDiscovery.getDiscoveryScore();
  }, []);

  /**
   * Track feature visibility in viewport
   */
  const trackFeatureVisible = useCallback((
    featureId: FeatureId,
    element: HTMLElement | null,
    threshold = 0.5
  ) => {
    if (!element || typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
            // Track that feature was visible
            const visibleKey = `fd_visible_${FEATURES[featureId].id}`;
            if (!sessionStorage.getItem(visibleKey)) {
              sessionStorage.setItem(visibleKey, Date.now().toString());
              
              if (window.plausible) {
                window.plausible('Feature In Viewport', {
                  props: {
                    feature_id: FEATURES[featureId].id,
                    feature_name: FEATURES[featureId].name
                  }
                });
              }
            }
            
            // Disconnect after tracking
            observer.disconnect();
          }
        });
      },
      { threshold }
    );

    observer.observe(element);
    
    // Return cleanup function
    return () => observer.disconnect();
  }, []);

  /**
   * Create props for tracking feature click
   */
  const getFeatureTrackingProps = useCallback((featureId: FeatureId, metadata?: Record<string, any>) => {
    return {
      onClick: () => trackFeature(featureId, metadata),
      'data-feature-id': FEATURES[featureId].id,
      'data-feature-tracked': trackedFeatures.current.has(featureId)
    };
  }, [trackFeature]);

  // Track component unmount with discovered features
  useEffect(() => {
    return () => {
      const tracked = getTrackedFeatures();
      if (tracked.length > 0) {
        console.log('[Feature Discovery] Component tracked features:', tracked);
      }
    };
  }, [getTrackedFeatures]);

  return {
    trackFeature,
    trackFeatureUsage,
    trackFeatureHover,
    trackFeatureVisible,
    getFeatureTrackingProps,
    getTrackedFeatures,
    getDiscoveryScore,
    features: FEATURES
  };
}
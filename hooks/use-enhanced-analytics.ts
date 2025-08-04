'use client';

import { useCallback } from 'react';
import { useAnalytics } from './use-analytics';

interface EnhancedLinkTrackingProps {
  url: string;
  linkText: string;
  linkType: 'phone' | 'email' | 'external' | 'document';
  source: 'clinical_trial' | 'ai_response' | 'place_card' | 'academic_paper';
  metadata?: Record<string, any>;
}

export function useEnhancedAnalytics() {
  const { trackEvent } = useAnalytics();

  // Track any clickable link with full context
  const trackLinkClick = useCallback((props: EnhancedLinkTrackingProps) => {
    const { url, linkText, linkType, source, metadata = {} } = props;
    
    // Extract the actual value based on link type
    let actualValue = url;
    if (linkType === 'phone') {
      actualValue = url.replace('tel:', '');
    } else if (linkType === 'email') {
      actualValue = url.replace('mailto:', '');
    }

    trackEvent('Link Click', {
      link_type: linkType,
      actual_value: actualValue,
      link_text: linkText,
      source: source,
      ...metadata
    });

    // Also track specific conversion events
    if (linkType === 'phone' || linkType === 'email') {
      trackEvent('Contact Method Clicked', {
        method: linkType,
        contact_value: actualValue,
        source: source,
        ...metadata
      });
    }
  }, [trackEvent]);

  // Track when content is copied
  const trackContentCopy = useCallback((content: string, contentType: string, metadata?: Record<string, any>) => {
    trackEvent('Content Copied', {
      content_type: contentType,
      actual_content: content,
      content_length: content.length,
      ...metadata
    });
  }, [trackEvent]);

  // Track AI-generated response links
  const trackAIResponseLink = useCallback((url: string, linkText: string, responseContext?: string) => {
    let linkType: EnhancedLinkTrackingProps['linkType'] = 'external';
    
    if (url.startsWith('tel:')) {
      linkType = 'phone';
    } else if (url.startsWith('mailto:')) {
      linkType = 'email';
    } else if (url.match(/\.(pdf|doc|docx|xlsx|csv)$/i)) {
      linkType = 'document';
    }

    trackLinkClick({
      url,
      linkText,
      linkType,
      source: 'ai_response',
      metadata: {
        response_context: responseContext,
        domain: linkType === 'external' ? new URL(url).hostname : undefined
      }
    });
  }, [trackLinkClick]);

  // Track place/business interactions
  const trackPlaceInteraction = useCallback((action: string, place: any) => {
    trackEvent('Place Interaction', {
      action: action,
      place_name: place.name,
      place_id: place.place_id,
      phone: place.phone,
      website: place.website,
      address: place.formatted_address,
      rating: place.rating,
      category: place.type || place.types?.[0]
    });
  }, [trackEvent]);

  // Track search result quality
  const trackSearchResultEngagement = useCallback((
    searchQuery: string, 
    resultType: string, 
    resultsShown: number,
    resultClicked?: any
  ) => {
    trackEvent('Search Result Engagement', {
      query: searchQuery,
      result_type: resultType,
      results_shown: resultsShown,
      clicked_result: resultClicked ? {
        title: resultClicked.title || resultClicked.name,
        position: resultClicked.position,
        id: resultClicked.id
      } : undefined
    });
  }, [trackEvent]);

  return {
    trackLinkClick,
    trackContentCopy,
    trackAIResponseLink,
    trackPlaceInteraction,
    trackSearchResultEngagement
  };
}
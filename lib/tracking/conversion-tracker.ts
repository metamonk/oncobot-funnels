/**
 * Conversion Tracking Orchestrator
 *
 * Central orchestration for all conversion events across multiple platforms.
 * Following CLAUDE.md principles - explicit, coordinated, context-aware.
 *
 * Each platform maintains its full capabilities while being orchestrated
 * from this central location for consistency.
 */

'use client';

import { trackStandardEvent } from '@/components/tracking/meta-pixel';
import { trackConversion as trackGA4Conversion } from '@/components/analytics/google-analytics-provider';

interface ConversionData {
  email?: string;
  phone?: string;
  fullName?: string;
  zipCode?: string;
  indication?: string;
  cancerType?: string;
  stage?: string;
  biomarkers?: string;
  priorTherapy?: string;
}

/**
 * Fire all conversion events when a quiz is successfully submitted.
 *
 * This orchestrates conversions across all platforms:
 * - Google Ads: Direct gtag for conversion tracking with Smart Goals
 * - GA4: Enhanced conversion tracking with full event parameters
 * - Meta Pixel: Client-side standard events
 * - Meta CAPI: Server-side conversion API for reliability
 *
 * Called BEFORE navigating to thank you page to ensure all pixels fire.
 */
export async function fireQuizConversionEvents(data: ConversionData) {
  const conversionValue = 100; // $100 per lead
  const transactionId = Date.now().toString(); // Dedupe across platforms

  try {
    // ============================================================
    // 1. GOOGLE ADS CONVERSION
    // Direct gtag implementation for maximum control
    // ============================================================
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID || process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
        'value': conversionValue,
        'currency': 'USD',
        'transaction_id': transactionId,
      });

      console.log('[Google Ads] Conversion fired', { transactionId });
    }

    // ============================================================
    // 2. GOOGLE ANALYTICS 4 CONVERSION
    // Using GA4-specific function for enhanced tracking
    // ============================================================
    trackGA4Conversion('generate_lead', conversionValue, 'USD', {
      indication: data.indication,
      cancer_type: data.cancerType || data.indication,
      stage: data.stage,
      biomarkers: data.biomarkers,
      zip_code: data.zipCode,
      form_destination: 'quiz_completion',
      transaction_id: transactionId,
    });

    console.log('[GA4] Conversion fired', { transactionId });

    // ============================================================
    // 3. META/FACEBOOK PIXEL CONVERSION
    // Client-side standard event tracking
    // ============================================================
    trackStandardEvent('Lead', {
      value: conversionValue,
      currency: 'USD',
      content_category: data.indication,
      content_name: `${data.cancerType || data.indication} Clinical Trial Lead`,
      content_ids: [data.indication || 'unknown']
    });

    console.log('[Meta Pixel] Conversion fired');

    // ============================================================
    // 4. META CONVERSIONS API (SERVER-SIDE)
    // Enhanced reliability with server-side tracking
    // ============================================================
    if (data.email || data.phone) {
      await fetch('/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventName: 'Lead',
          userData: {
            email: data.email,
            phone: data.phone,
            firstName: data.fullName?.split(' ')[0],
            lastName: data.fullName?.split(' ').slice(1).join(' '),
            zipCode: data.zipCode
          },
          customData: {
            value: conversionValue,
            currency: 'USD',
            indication: data.indication,
            cancerType: data.cancerType,
            stage: data.stage,
            biomarkers: data.biomarkers,
            event_id: transactionId, // Deduplication
          }
        })
      });

      console.log('[Meta CAPI] Server-side conversion fired');
    }

    // ============================================================
    // 5. SESSION VALIDATION
    // Prevent false conversions from direct navigation
    // ============================================================
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('quiz_completed', JSON.stringify({
        timestamp: Date.now(),
        indication: data.indication,
        hasConversionFired: true
      }));
    }

    return true;
  } catch (error) {
    console.error('Error firing conversion events:', error);
    // Don't throw - we still want navigation to continue
    return false;
  }
}

/**
 * Verify if user legitimately completed the quiz
 * Use this on thank you page to validate access
 */
export function verifyQuizCompletion(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const completed = sessionStorage.getItem('quiz_completed');
    if (!completed) return false;

    const data = JSON.parse(completed);
    const hoursSinceCompletion = (Date.now() - data.timestamp) / (1000 * 60 * 60);

    // Valid if completed within last hour
    return hoursSinceCompletion < 1;
  } catch {
    return false;
  }
}

/**
 * Clear quiz completion flag (call after thank you page loads)
 */
export function clearQuizCompletion(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('quiz_completed');
  }
}
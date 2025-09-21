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
 * Fire all conversion events when a quiz is successfully submitted
 * This should be called BEFORE navigating to thank you page
 */
export async function fireQuizConversionEvents(data: ConversionData) {
  const conversionValue = 100; // $100 per lead

  try {
    // 1. Google Ads Conversion (using gtag directly)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      // For form submission conversions, we don't need a label if using Smart Goals
      // But if you have a specific conversion action, add the label
      (window as any).gtag('event', 'conversion', {
        'send_to': process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID || process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
        'value': conversionValue,
        'currency': 'USD',
        'transaction_id': Date.now().toString(), // Prevent duplicate conversions
      });

      console.log('Google Ads conversion fired');
    }

    // 2. GA4 Conversion Event
    trackGA4Conversion('generate_lead', conversionValue, 'USD', {
      indication: data.indication,
      cancer_type: data.cancerType || data.indication,
      stage: data.stage,
      biomarkers: data.biomarkers,
      zip_code: data.zipCode,
      form_destination: 'quiz_completion'
    });

    console.log('GA4 conversion fired');

    // 3. Meta/Facebook Pixel Conversion
    trackStandardEvent('Lead', {
      value: conversionValue,
      currency: 'USD',
      content_category: data.indication,
      content_name: `${data.cancerType || data.indication} Clinical Trial Lead`,
      content_ids: [data.indication || 'unknown']
    });

    console.log('Meta Pixel conversion fired');

    // 4. Server-side conversions (Meta CAPI)
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
            biomarkers: data.biomarkers
          }
        })
      });

      console.log('Server-side conversion fired');
    }

    // 5. Mark quiz as completed for thank you page validation
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
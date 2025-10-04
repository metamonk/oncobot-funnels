'use client';

import Script from 'next/script';

export default function GoogleAds() {
  const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

  if (!googleAdsId) {
    return null;
  }

  return (
    <>
      {/* Google Ads (gtag.js) */}
      <Script
        id="google-ads-gtag"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`}
      />
      <Script
        id="google-ads-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            // Configure Google Ads with enhanced conversions enabled
            gtag('config', '${googleAdsId}', {
              'allow_enhanced_conversions': true
            });
          `,
        }}
      />
    </>
  );
}

// Helper function to track conversions
export function trackGoogleAdsConversion(
  conversionLabel?: string,
  value?: number,
  currency: string = 'USD'
) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    const conversionId = conversionLabel || process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID;

    (window as any).gtag('event', 'conversion', {
      send_to: conversionId,
      value: value || 100.0,
      currency: currency,
    });
  }
}

// Helper function to track page views
export function trackGoogleAdsPageView(pagePath?: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'page_view', {
      page_path: pagePath || window.location.pathname,
    });
  }
}

// Helper function for remarketing
export function trackGoogleAdsRemarketing(params?: {
  value?: number;
  currency?: string;
  items?: any[];
}) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'view_item', {
      value: params?.value,
      currency: params?.currency || 'USD',
      items: params?.items,
    });
  }
}
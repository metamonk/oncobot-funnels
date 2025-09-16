import Script from 'next/script';
import { Header } from '@/components/layout/header';
import { GoogleAnalyticsProvider } from '@/components/analytics/google-analytics-provider';

export default function FunnelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fbPixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

  return (
    <>
      {/* Preconnect to external domains for faster resource loading */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      <link rel="dns-prefetch" href="https://connect.facebook.net" />
      
      {/* Critical inline CSS to prevent layout shift */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Prevent layout shift for above-the-fold content */
          .hero-section { min-height: 80vh; }
          .countdown-timer { min-height: 40px; min-width: 140px; }
          .cta-button { min-height: 52px; }
          .hook-text { min-height: 48px; }
          
          /* Optimize text rendering */
          body {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }
        `
      }} />
      
      <Header variant="minimal" />

      {/* Facebook Pixel */}
      {fbPixelId && (
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${fbPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      <GoogleAnalyticsProvider>
        {children}
      </GoogleAnalyticsProvider>
    </>
  );
}
import './globals.css';
import 'katex/dist/katex.min.css';
import 'mapbox-gl/dist/mapbox-gl.css';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Metadata, Viewport } from 'next';
import { Inter, Merriweather, JetBrains_Mono, Oxanium } from 'next/font/google';
import Script from 'next/script';

import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from 'sonner';

import { Providers } from './providers';
import { config } from '@/lib/config';
import { WebVitalsTracker } from '@/components/web-vitals-tracker';
import MetaPixel from '@/components/tracking/meta-pixel';
import GoogleAds from '@/components/tracking/google-ads';
import { GoogleAnalyticsProvider } from '@/components/analytics/google-analytics-provider';

export const metadata: Metadata = {
  metadataBase: new URL(config.app.url),
  title: {
    default: 'OncoBot',
    template: '%s | OncoBot',
    absolute: 'OncoBot',
  },
  description: 'AI oncology assistant helping patients find clinical trials and treatment options.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    url: config.app.url,
    siteName: 'OncoBot',
  },
  keywords: [
    'onco.bot',
    'OncoBot',
    'oncobot',
    'medical oncology',
    'clinical trials',
    'cancer treatment',
    'oncology AI',
    'medical AI assistant',
    'cancer care',
    'cancer patients',
    'patient support',
    'treatment options',
    'treatment guidelines',
    'oncology research',
    'clinical trial matching',
    'cancer information',
    'healthcare AI',
    'evidence-based oncology',
    'precision oncology',
    'cancer therapy',
    'oncology support',
    'medical search',
    'healthcare professionals',
    'cancer journey',
    'patient resources',
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  preload: true,
  display: 'swap',
});

const merriweather = Merriweather({
  subsets: ['latin'],
  variable: '--font-serif',
  preload: true,
  display: 'swap',
  weight: ['300', '400', '700', '900'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  preload: true,
  display: 'swap',
});

const oxanium = Oxanium({
  subsets: ['latin'],
  variable: '--font-logo',
  preload: true,
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${merriweather.variable} ${jetbrainsMono.variable} ${oxanium.variable} font-sans antialiased`} suppressHydrationWarning>
        <NuqsAdapter>
          <Providers>
            <GoogleAnalyticsProvider>
              <WebVitalsTracker />
              <MetaPixel />
              <GoogleAds />
              <Toaster position="top-center" />
              {children}
            </GoogleAnalyticsProvider>
          </Providers>
        </NuqsAdapter>
        <Analytics />
        <SpeedInsights />
        <Script
          defer
          data-domain="trials.onco.bot"
          src="https://plausible.io/js/script.file-downloads.hash.outbound-links.pageview-props.revenue.tagged-events.js"
        />
        <Script id="plausible-init">
          {`window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`}
        </Script>
      </body>
    </html>
  );
}

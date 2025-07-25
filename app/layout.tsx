import './globals.css';
import 'katex/dist/katex.min.css';
import 'mapbox-gl/dist/mapbox-gl.css';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Metadata, Viewport } from 'next';
import { Inter, Merriweather, JetBrains_Mono, Oxanium } from 'next/font/google';

import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from 'sonner';

import { Providers } from './providers';
import { config } from '@/lib/config';

export const metadata: Metadata = {
  metadataBase: new URL(config.app.url),
  title: {
    default: 'OncoBot',
    template: '%s | OncoBot',
    absolute: 'OncoBot',
  },
  description: 'OncoBot is a minimalistic AI-powered search engine that helps you find information on the internet.',
  openGraph: {
    url: config.app.url,
    siteName: 'OncoBot',
  },
  keywords: [
    'onco.bot',
    'ai search engine',
    'search engine',
    'oncobot ai',
    'OncoBot',
    'oncobot',
    'ONCOBOT',
    'oncobot github',
    'ai search engine',
    'OncoBot',
    'oncobot',
    'oncobot app',
    'oncobot ai',
    'oncobot ai app',
    'oncobot',
    'OncoBot',
    'Perplexity alternatives',
    'Perplexity AI alternatives',
    'open source ai search engine',
    'minimalistic ai search engine',
    'minimalistic ai search alternatives',
    'ai search',
    'minimal ai search',
    'minimal ai search alternatives',
    'AI Search Engine',
    'zaid mukaddam',
    'search engine',
    'AI',
    'perplexity',
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
  ],
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
            <Toaster position="top-center" />
            {children}
          </Providers>
        </NuqsAdapter>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

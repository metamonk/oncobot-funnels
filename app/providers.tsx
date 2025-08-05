'use client';

import { clientEnv } from '@/env/client';
import { ThemeProvider } from 'next-themes';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { ReactNode } from 'react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@radix-ui/react-tooltip';

if (typeof window !== 'undefined') {
  posthog.init(clientEnv.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: clientEnv.NEXT_PUBLIC_POSTHOG_HOST,
    person_profiles: 'always',
    persistence: 'localStorage+cookie', // Better persistence across sessions
    autocapture: true, // Capture all clicks/interactions automatically
    capture_pageview: true, // Automatic pageview tracking
    capture_pageleave: true, // Track when users leave
    session_recording: {
      maskAllInputs: false, // Show form inputs in recordings
      maskTextSelector: '[data-private]', // Mask elements with data-private
    },
    loaded: (posthog) => {
      // Set initial session properties
      posthog.register_once({
        initial_referrer: document.referrer,
        initial_utm_source: new URLSearchParams(window.location.search).get('utm_source'),
        session_start_time: Date.now(),
      });
    },
  });
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PostHogProvider client={posthog}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </PostHogProvider>
    </QueryClientProvider>
  );
}

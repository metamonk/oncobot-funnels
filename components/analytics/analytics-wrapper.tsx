/**
 * Analytics Wrapper Component
 *
 * Provides a Suspense boundary for components that use analytics tracking
 * to prevent Next.js 15 build errors with useSearchParams
 */

'use client';

import { Suspense, ReactNode } from 'react';

interface AnalyticsWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Inner component that can safely use analytics hooks
 */
function AnalyticsContent({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/**
 * Wrapper component with Suspense boundary
 * This prevents the "useSearchParams() should be wrapped in a suspense boundary" error
 */
export function AnalyticsWrapper({
  children,
  fallback = null
}: AnalyticsWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      <AnalyticsContent>{children}</AnalyticsContent>
    </Suspense>
  );
}
'use client';

import React from 'react';
import { Header, HeaderProps } from './header';
import { GoogleAnalyticsProvider } from '@/components/analytics/google-analytics-provider';

export interface PageLayoutProps {
  children: React.ReactNode;
  headerProps?: HeaderProps;
  includeAnalytics?: boolean;
}

export function PageLayout({
  children,
  headerProps = {},
  includeAnalytics = true
}: PageLayoutProps) {
  return (
    <>
      <Header {...headerProps} />
      {includeAnalytics ? (
        <GoogleAnalyticsProvider>
          {children}
        </GoogleAnalyticsProvider>
      ) : (
        children
      )}
    </>
  );
}
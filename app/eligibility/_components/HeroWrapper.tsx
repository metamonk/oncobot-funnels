'use client';

import { Suspense } from 'react';
import { Hero } from './Hero';

interface HeroWrapperProps {
  headline: string;
  subheadline: string;
  hooks: string[];
  indication: string;
}

/**
 * Wrapper component to handle Suspense boundary for Hero
 * Required because Hero now uses useSearchParams for UTM-based headlines
 */
export function HeroWrapper(props: HeroWrapperProps) {
  return (
    <Suspense fallback={
      // Show static headline while loading
      <section className="relative py-12 sm:py-16 lg:py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center space-y-5">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-balance max-w-4xl mx-auto leading-tight">
              {props.headline}
            </h1>
          </div>
        </div>
      </section>
    }>
      <Hero {...props} />
    </Suspense>
  );
}
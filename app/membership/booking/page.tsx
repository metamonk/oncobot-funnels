import { Suspense } from 'react';
import { BookingPageClient } from './_components/BookingPageClient';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';

// Server component wrapper with Suspense boundary
export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <BookingPageClient />
    </Suspense>
  );
}
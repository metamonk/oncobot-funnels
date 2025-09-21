import { Suspense } from 'react';
import { ContactPageClient } from './ContactPageClient';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';

// Server component wrapper with Suspense boundary
export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ContactPageClient />
    </Suspense>
  );
}
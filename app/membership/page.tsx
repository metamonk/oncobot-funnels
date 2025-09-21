import { Suspense } from 'react';
import { MembershipPageClient } from './MembershipPageClient';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';

// Server component wrapper with Suspense boundary
export default function MembershipPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <MembershipPageClient />
    </Suspense>
  );
}
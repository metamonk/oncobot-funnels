import { Suspense } from 'react';
import { NotFoundClient } from './NotFoundClient';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';

// Server component wrapper with Suspense boundary
export default function NotFound() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <NotFoundClient />
    </Suspense>
  );
}
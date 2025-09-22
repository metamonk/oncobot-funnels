'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';

export function SiteMembershipButton() {
  const { track } = useUnifiedAnalytics();

  return (
    <Button asChild size="lg">
      <Link
        href="/membership"
        onClick={() => track('site_funnel_start', { source: 'homepage' })}
      >
        View Membership Details
        <ArrowRight className="ml-2 h-5 w-5" />
      </Link>
    </Button>
  );
}
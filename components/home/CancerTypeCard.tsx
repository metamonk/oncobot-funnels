'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';

interface CancerTypeCardButtonProps {
  indicationId: string;
}

export function CancerTypeCardButton({ indicationId }: CancerTypeCardButtonProps) {
  const { track } = useUnifiedAnalytics();

  return (
    <Link
      href={`/eligibility/${indicationId}`}
      onClick={() => track('patient_funnel_start', { indication: indicationId })}
    >
      <Button className="w-full">
        Check Eligibility
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Link>
  );
}
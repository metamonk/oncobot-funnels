'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface QuizCTAProps {
  primaryText: string;
  secondaryText: string;
  indication: string;
  onCtaClick?: () => void;
}

export function QuizCTA({ primaryText, secondaryText, indication, onCtaClick }: QuizCTAProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClick = () => {
    if (onCtaClick) {
      onCtaClick();
    } else {
      // Navigate to quiz page with UTM params preserved
      const params = new URLSearchParams(searchParams.toString());
      const queryString = params.toString();
      const quizUrl = `/quiz/${indication}${queryString ? `?${queryString}` : ''}`;
      router.push(quizUrl);
    }
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-primary/5">
      <div className="container max-w-4xl mx-auto px-4 text-center">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Ready to See If You Qualify?
            </h2>
            <p className="text-lg text-muted-foreground">
              {secondaryText}
            </p>
          </div>

          <Button
            size="lg"
            onClick={handleClick}
            className="group text-base sm:text-lg px-8 py-6"
          >
            {primaryText}
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>

          <p className="text-sm text-muted-foreground">
            Join thousands who&apos;ve found their match
          </p>
        </div>
      </div>
    </section>
  );
}
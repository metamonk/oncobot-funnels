'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { ArrowRight, Clock, Shield, Star } from 'lucide-react';
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';
import { motion } from 'framer-motion';

interface QuizCTAProps {
  primaryText: string;
  secondaryText: string;
  indication: string;
}

export function QuizCTA({ primaryText, secondaryText, indication }: QuizCTAProps) {
  const router = useRouter();
  const { track } = useUnifiedAnalytics();

  const handleQuizStart = () => {
    track('quiz_start_clicked', {
      location: 'bottom_cta',
      indication
    });
    
    router.push(`/eligibility/${indication}/quiz`);
  };

  return (
    <section className="py-24 bg-accent/10 border-y border-border">
      <div className="container max-w-screen-xl mx-auto px-4">
        <motion.div 
          className="max-w-3xl mx-auto text-center space-y-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to Check Your Eligibility?
          </h2>
          
          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{secondaryText}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">100% Secure</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Instant Results</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <Button
              size="lg"
              onClick={handleQuizStart}
              className="group"
            >
              {primaryText}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Trust Signal */}
          <p className="text-sm text-muted-foreground">
            No payment required • No obligations • Cancel anytime
          </p>

          {/* Testimonial/Social Proof */}
          <Card className="p-6">
            <div className="flex justify-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <blockquote className="text-muted-foreground italic">
              &ldquo;The eligibility check was quick and easy. Within 48 hours, I was connected 
              with a trial coordinator who explained everything clearly.&rdquo;
            </blockquote>
            <cite className="block mt-3 text-sm font-medium text-foreground">
              — Sarah M., Lung Cancer Patient
            </cite>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
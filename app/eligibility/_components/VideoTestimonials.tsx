'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Testimonial {
  id: string;
  name: string;
  condition: string;
  outcome: string;
  quote: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration: string;
}

interface VideoTestimonialsProps {
  testimonials?: Testimonial[];
  variant?: 'hero' | 'full';
}

const defaultTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah M.',
    condition: 'Lung Cancer Patient',
    outcome: '2 years progression-free',
    quote: 'The eligibility check was quick and easy. Within 48 hours, I was connected with a trial coordinator who explained everything clearly.',
    duration: '2:15'
  },
  {
    id: '2',
    name: 'Robert K.',
    condition: 'Prostate Cancer Patient',
    outcome: 'PSA undetectable after 6 months',
    quote: 'My oncologist said we were out of options. The trial gave me access to a treatment that changed everything.',
    duration: '1:48'
  },
  {
    id: '3',
    name: 'Jennifer M.',
    condition: 'Colorectal Cancer Patient',
    outcome: '60% tumor reduction',
    quote: 'I went from hospice referral to planning my daughter&apos;s wedding. The trial team treated me like family.',
    duration: '2:35'
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function VideoTestimonials({ 
  testimonials = defaultTestimonials, 
  variant = 'hero' 
}: VideoTestimonialsProps) {
  const displayTestimonials = variant === 'hero' 
    ? testimonials.slice(0, 1)
    : testimonials;

  if (variant === 'hero') {
    // Compact version for above the fold
    const testimonial = displayTestimonials[0];
    return (
      <Card className="p-6 max-w-2xl mx-auto">
        <div className="flex justify-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <blockquote className="text-muted-foreground italic text-center">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>
        <cite className="block mt-3 text-sm font-medium text-foreground text-center">
          — {testimonial.name}, {testimonial.condition}
        </cite>
      </Card>
    );
  }

  // Full version for dedicated section
  return (
    <section className="py-24 bg-accent/10 border-y border-border">
      <div className="container max-w-screen-xl mx-auto px-4">
        <motion.div 
          className="max-w-3xl mx-auto space-y-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Real Patient Success Stories</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hear from patients who found hope and healing through clinical trials
            </p>
          </div>

          {/* Testimonial Cards */}
          <motion.div 
            className="space-y-6"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {displayTestimonials.map((testimonial, index) => (
              <motion.div key={testimonial.id} variants={item}>
                <Card className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.condition}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">{testimonial.outcome}</p>
                    </div>
                  </div>
                  <blockquote className="text-muted-foreground italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust Signal */}
          <div className="text-center pt-8">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-accent rounded-full border border-accent-foreground/20">
              <Star className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">
                95% of patients recommend our eligibility service
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
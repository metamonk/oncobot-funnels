'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Calendar, Clock, Phone, Mail, ArrowRight, Bell } from 'lucide-react';
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function MatchResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const indication = params.indication as string;
  const hasMatch = searchParams.get('match') === 'yes';
  const { track, trackConversion } = useUnifiedAnalytics();
  
  // For demo purposes, randomly determine match status if not set
  const [matchStatus] = useState(hasMatch ?? Math.random() > 0.3);

  useEffect(() => {
    // Track conversion based on match status
    if (matchStatus) {
      trackConversion('provisional_match', 75, {
        indication
      });
      
      track('Eligibility Step', {
        step_name: 'provisional_match',
        indication,
        qualified: true
      });
    } else {
      track('Eligibility Step', {
        step_name: 'no_match',
        indication,
        qualified: false
      });
    }
  }, [indication, matchStatus, track, trackConversion]);

  const handleBookingClick = () => {
    track('booking_initiated', {
      indication,
      location: 'match_result'
    });
    
    // In production, this would go to a booking calendar
    router.push(`/eligibility/${indication}/booking-confirmation`);
  };

  const handleWaitlistClick = () => {
    track('waitlist_joined', {
      indication,
      location: 'no_match'
    });
    
    // In production, this would submit to waitlist
    router.push(`/eligibility/${indication}/thank-you`);
  };

  if (matchStatus) {
    // Provisional Match Page
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 border-2 border-green-200">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Good news — you may match with a trial near [City].
            </h1>
            <p className="text-lg text-muted-foreground">
              Let&apos;s review your information and discuss next steps
            </p>
          </motion.div>

          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">What happens next?</h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                    <span className="text-sm font-semibold text-primary">1</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Book a 5-minute call</h3>
                  <p className="text-muted-foreground">
                    Schedule a brief call to review your info and next steps
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                    <span className="text-sm font-semibold text-primary">2</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Quick response</h3>
                  <p className="text-muted-foreground">
                    We aim to contact you within 24 hours on business days
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Button 
                size="lg" 
                className="w-full"
                onClick={handleBookingClick}
              >
                <Calendar className="mr-2 h-5 w-5" />
                Book a 5-Minute Call
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center mt-4">
              HIPAA-secure. No obligation. We&apos;ll never sell your data.
            </p>
          </Card>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Need immediate assistance?{' '}
              <a href="tel:1-800-TRIALS" className="text-primary hover:underline">
                Call 1-800-TRIALS
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No Match Page
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4 border-2 border-yellow-200">
            <Bell className="h-8 w-8 text-yellow-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            No match yet — we&apos;ll notify you as soon as options open.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Trials open/close often. Join the waitlist and we&apos;ll alert you when a relevant study appears near you.
          </p>
        </motion.div>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Stay informed</h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Automatic monitoring</p>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll continuously check for new trials matching your criteria
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Instant notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get alerted immediately when a matching trial opens
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Priority contact</p>
                <p className="text-sm text-muted-foreground">
                  You&apos;ll be first to know about new opportunities
                </p>
              </div>
            </div>
          </div>

          <Button 
            size="lg" 
            className="w-full"
            onClick={handleWaitlistClick}
          >
            <Bell className="mr-2 h-5 w-5" />
            Join the Waitlist
          </Button>
        </Card>

        <div className="text-center">
          <h3 className="font-semibold mb-4">See helpful resources for {indication.charAt(0).toUpperCase() + indication.slice(1)} while you wait</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link href="/resources/treatment-options">
                Treatment Options
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link href="/resources/support-groups">
                Support Groups
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { CheckCircle, CheckCircle2, Calendar, Clock, Phone, Bell } from 'lucide-react';
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';
import { motion } from 'framer-motion';

export default function BookingConfirmationPage() {
  const params = useParams();
  const indication = params.indication as string;
  const { track, trackConversion } = useUnifiedAnalytics();

  useEffect(() => {
    // Track booking completion - highest value conversion
    trackConversion('booking_complete', 150, {
      indication
    });
    
    track('Eligibility Step', {
      step_name: 'booking_confirmed',
      indication,
      qualified: true
    });
  }, [indication, track, trackConversion]);

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
            You&apos;re scheduled.
          </h1>
          <p className="text-lg text-muted-foreground">
            We&apos;ve confirmed your call with a trial coordinator
          </p>
        </motion.div>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">What to expect</h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Coordinator call</h3>
                <p className="text-muted-foreground">
                  A coordinator will call at your chosen time. Have your diagnosis and treatment history handy.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Brief conversation</h3>
                <p className="text-muted-foreground">
                  The call typically takes 5-10 minutes to review your information and discuss potential trials.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Next steps</h3>
                <p className="text-muted-foreground">
                  If there&apos;s a good match, they&apos;ll help schedule a screening appointment at a trial site.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 mb-8 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Bell className="h-5 w-5 text-primary mt-0.5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Reminders set</h3>
              <p className="text-sm text-muted-foreground">
                We&apos;ll text/email reminders 24h, 12h, and 3h before the call.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-primary/5 border-primary/20">
          <h3 className="font-semibold mb-3">Prepare for your call</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Have these items ready for a productive conversation:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">Your complete diagnosis details</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">List of current and past treatments</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">Any biomarker or genetic test results</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">Questions about the trial process</span>
            </div>
          </div>
        </Card>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-2">Have questions?</p>
          <a href="/contact" className="text-primary hover:underline font-medium text-sm">
            Contact our support team →
          </a>
        </div>
      </div>
    </div>
  );
}
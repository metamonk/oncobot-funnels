'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { CheckCircle, Calendar, Clock, Phone, Bell } from 'lucide-react';
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

        <Card className="p-8 mb-8 bg-accent/50">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Reminders set
          </h3>
          <p className="text-muted-foreground">
            We&apos;ll text/email reminders 24h, 12h, and 3h before the call.
          </p>
        </Card>

        <div className="text-center">
          <h3 className="font-semibold mb-2">Prepare for your call</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Have these items ready for a productive conversation:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 max-w-md mx-auto text-left">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Your complete diagnosis details</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>List of current and past treatments</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Any biomarker or genetic test results</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Questions about the trial process</span>
            </li>
          </ul>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Need to reschedule?</p>
          <a href="tel:1-800-TRIALS" className="text-primary hover:underline">
            Call 1-800-TRIALS
          </a>
        </div>
      </div>
    </div>
  );
}
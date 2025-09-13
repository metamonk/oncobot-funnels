'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Phone, Mail, Calendar, ArrowRight, Shield, Clock } from 'lucide-react';
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ThankYouPage() {
  const params = useParams();
  const indication = params.indication as string;
  const { track, trackConversion } = useUnifiedAnalytics();

  useEffect(() => {
    // Track conversion - this is the money metric
    trackConversion('quiz_complete', 100, {
      indication
    });

    // Track page view
    track('Page Viewed', {
      page: 'thank_you',
      indication
    });

    // Fire Google Ads conversion if gtag is available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID,
        'value': 100.0,
        'currency': 'USD'
      });
    }

    // Fire Facebook Pixel conversion if fbq is available
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Lead', {
        value: 100.0,
        currency: 'USD',
        content_category: indication
      });
    }
  }, [indication, trackConversion, track]);

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        {/* Success Message */}
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
            Thank You! Your Matches Are Ready
          </h1>
          <p className="text-lg text-muted-foreground">
            We&apos;ve identified potential clinical trials in your area
          </p>
        </motion.div>

        {/* What Happens Next */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">What Happens Next?</h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Email Confirmation</h3>
                <p className="text-muted-foreground">
                  You&apos;ll receive an email within 5 minutes with your matching trials
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
                <h3 className="font-semibold mb-1">Coordinator Call</h3>
                <p className="text-muted-foreground">
                  A trial coordinator will contact you within 24-48 hours to discuss your matches
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Screening Appointment</h3>
                <p className="text-muted-foreground">
                  If interested, we&apos;ll schedule a screening visit at a convenient trial site
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Important Information */}
        <Card className="p-8 mb-8 bg-accent/50">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
            <Shield className="h-5 w-5 text-primary" />
            Important Information
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Keep your phone available - coordinators may call from various area codes</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Check your email spam folder if you don&apos;t see our message</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Have your medical records ready for the coordinator call</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>There&apos;s no obligation to enroll in any trial</span>
            </li>
          </ul>
        </Card>

        {/* Additional Resources */}
        <div className="text-center">
          <p className="text-muted-foreground mb-6">
            While you wait, learn more about clinical trials:
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link href="/resources/clinical-trials-guide">
                Clinical Trials Guide
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link href="/resources/questions-to-ask">
                Questions to Ask
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-12 p-6 text-center border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">Need immediate assistance?</p>
          <div className="flex items-center justify-center gap-4">
            <a href="tel:1-800-TRIALS" className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border hover:bg-accent transition-colors">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">1-800-TRIALS</span>
            </a>
            <a href="mailto:support@clinicaltrials.com" className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border hover:bg-accent transition-colors">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">support@clinicaltrials.com</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
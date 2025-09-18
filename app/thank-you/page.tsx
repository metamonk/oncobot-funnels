'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  CheckCircle,
  Phone,
  Mail,
  Calendar,
  ArrowRight,
  Shield,
  Clock,
  MessageSquare,
  Search,
  Bell,
  FileText,
  Heart
} from 'lucide-react';
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';
import { motion } from 'framer-motion';
import Link from 'next/link';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const { track, trackConversion } = useUnifiedAnalytics();

  // Get all data from URL params - indication is now a query param
  const indication = searchParams.get('indication') || 'cancer';
  const zipCode = searchParams.get('zipCode');
  const stage = searchParams.get('stage');
  const biomarkers = searchParams.get('biomarkers');
  const cancerType = searchParams.get('cancerType') || indication;

  useEffect(() => {
    // Track conversion - this is the money metric
    trackConversion('quiz_complete', 100, {
      indication,
      zipCode,
      stage,
      biomarkers,
      cancerType
    });

    // Track page view
    track('Page Viewed', {
      page: 'thank_you',
      indication,
      zipCode,
      stage
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
  }, [indication, zipCode, stage, biomarkers, cancerType, trackConversion, track]);

  // Format indication for display
  const formatIndication = (ind: string) => {
    const mapping: { [key: string]: string } = {
      lung: 'Lung Cancer',
      prostate: 'Prostate Cancer',
      gi: 'GI Cancer',
      other: 'Cancer',
      cancer: 'Cancer'
    };
    return mapping[ind.toLowerCase()] || 'Cancer';
  };

  const displayIndication = formatIndication(indication);

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        {/* Success Message with Animation */}
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
            Thank You! We&apos;ve Received Your Information
          </h1>
          <p className="text-lg text-muted-foreground">
            A trial coordinator will review available {displayIndication} trials in your area
          </p>
        </motion.div>

        {/* Trial Activity Card - Shows we're working on it */}
        <Card className="p-6 mb-6 bg-accent/30">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            What our coordinators will review:
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">Active</p>
              <p className="text-sm text-muted-foreground">Recruiting trials</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">Your area</p>
              <p className="text-sm text-muted-foreground">Near {zipCode || 'your ZIP'}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{stage || 'All stages'}</p>
              <p className="text-sm text-muted-foreground">Stage-specific</p>
            </div>
          </div>
          {biomarkers && biomarkers !== 'None/Unknown' && (
            <div className="mt-3 text-center">
              <p className="text-sm text-muted-foreground">
                Including trials for <span className="font-semibold text-foreground">{biomarkers}</span> biomarkers
              </p>
            </div>
          )}
        </Card>

        {/* What Happens Next - Clear Process */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">What Happens Next</h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Email Confirmation
                </h3>
                <p className="text-muted-foreground">
                  Check your inbox for confirmation and next steps
                  <span className="text-sm block mt-1 text-muted-foreground/80">
                    Within 5 minutes • Check spam if needed
                  </span>
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
                <h3 className="font-semibold mb-1 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  Coordinator Review
                </h3>
                <p className="text-muted-foreground">
                  Our team will review available trials matching your profile
                  <span className="text-sm block mt-1 text-muted-foreground/80">
                    Within 24-48 hours • Multiple area codes possible
                  </span>
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
                <h3 className="font-semibold mb-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Personalized Discussion
                </h3>
                <p className="text-muted-foreground">
                  5-10 minute call to discuss relevant trials and next steps
                  <span className="text-sm block mt-1 text-muted-foreground/80">
                    No obligation • Free consultation
                  </span>
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Preparation Tips */}
        <Card className="p-6 mb-8 bg-primary/5 border-primary/20">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Prepare for Your Coordinator Call
          </h3>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span className="text-muted-foreground">Your diagnosis date and stage</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span className="text-muted-foreground">Current and past treatments</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span className="text-muted-foreground">Your oncologist&apos;s name</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <span className="text-muted-foreground">Questions about trials</span>
            </div>
          </div>
        </Card>

        {/* Important Reminders */}
        <Card className="p-4 mb-8 border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-orange-900 dark:text-orange-200">
                Important Reminders
              </p>
              <ul className="space-y-1 text-orange-800 dark:text-orange-300">
                <li>• Keep your phone available - various area codes possible</li>
                <li>• Check email spam folder if you don&apos;t see confirmation</li>
                <li>• No obligation to enroll in any trial</li>
                <li>• All services are completely free</li>
              </ul>
            </div>
          </div>
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

        {/* Trust Elements */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span>HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-green-600" />
              <span>Patient-First Approach</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span>Quick Response Time</span>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">Need immediate assistance?</p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-accent transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main export wrapped in Suspense to handle useSearchParams properly
export default function ThankYouPage() {
  return (
    <Suspense fallback={null}>
      <ThankYouContent />
    </Suspense>
  );
}
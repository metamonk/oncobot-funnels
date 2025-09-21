'use client';

// Force dynamic rendering to avoid prerendering issues with useSearchParams
export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Calendar, Clock, Phone, Mail, ArrowRight, Bell, Search, Activity, MapPin } from 'lucide-react';
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getCancerConfig, adjustTrialCountsByZip, calculateMatchProbability } from '@/lib/cancer-config';

// Removed duplicate functions - now imported from cancer-config.ts

export default function MatchResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const indication = params.indication as string;

  // Get quiz data from URL params
  const zipCode = searchParams.get('zipCode');
  const stage = searchParams.get('stage');
  const biomarkers = searchParams.get('biomarkers');
  const priorTherapy = searchParams.get('priorTherapy');
  const cancerType = searchParams.get('cancerType') || indication;

  const { track, trackConversion } = useUnifiedAnalytics();

  // Calculate match probability based on actual user data
  const matchProbability = useMemo(() =>
    calculateMatchProbability(cancerType, stage, biomarkers, priorTherapy, zipCode),
    [cancerType, stage, biomarkers, priorTherapy, zipCode]
  );

  // Get trial statistics from centralized config
  const trialStats = useMemo(() => {
    const config = getCancerConfig(cancerType);
    return adjustTrialCountsByZip(config.trialCounts, zipCode);
  }, [cancerType, zipCode]);

  // Determine triage path based on probability
  const triagePath = useMemo(() => {
    if (matchProbability >= 70) return 'high_match';
    if (matchProbability >= 40) return 'moderate_match';
    return 'monitoring';
  }, [matchProbability]);

  useEffect(() => {
    // Track conversion based on triage path
    if (triagePath === 'high_match') {
      trackConversion('high_match_probability', 75, {
        indication,
        matchProbability,
        stage,
        biomarkers
      });

      track('Eligibility Step', {
        step_name: 'high_match_result',
        indication,
        qualified: true,
        matchProbability
      });
    } else if (triagePath === 'moderate_match') {
      track('Eligibility Step', {
        step_name: 'moderate_match_result',
        indication,
        qualified: 'maybe',
        matchProbability
      });
    } else {
      track('Eligibility Step', {
        step_name: 'monitoring_path',
        indication,
        qualified: false,
        matchProbability
      });
    }
  }, [indication, triagePath, matchProbability, stage, biomarkers, track, trackConversion]);

  const handleBookingClick = () => {
    track('booking_initiated', {
      indication,
      location: 'match_result',
      triagePath,
      matchProbability
    });

    router.push(`/eligibility/${indication}/booking-confirmation`);
  };

  const handleMonitoringClick = () => {
    track('monitoring_confirmed', {
      indication,
      location: 'match_result',
      triagePath,
      matchProbability
    });

    // Navigate to a proper monitoring confirmation page
    router.push(`/eligibility/${indication}/monitoring-confirmation`);
  };

  // High Match Path (70%+ probability)
  if (triagePath === 'high_match') {
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
              Good news — multiple trials may match your profile
            </h1>
            <p className="text-lg text-muted-foreground">
              Our initial analysis found strong matching indicators. Let&apos;s confirm with a coordinator.
            </p>
          </motion.div>

          <Card className="p-6 mb-6 bg-accent/30">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              What we found in your area:
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{trialStats.nationwide}</p>
                <p className="text-sm text-muted-foreground">{indication} trials nationwide</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{trialStats.regional}</p>
                <p className="text-sm text-muted-foreground">Within 250 miles</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{trialStats.nearby}</p>
                <p className="text-sm text-muted-foreground">Within 50 miles</p>
              </div>
            </div>
          </Card>

          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Your coordinator will now:</h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                    <span className="text-sm font-semibold text-primary">1</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Verify eligibility criteria</h3>
                  <p className="text-muted-foreground">
                    Check your specific {biomarkers && biomarkers !== 'None/Unknown' ? `${biomarkers} biomarker` : 'profile'} against trial protocols
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
                  <h3 className="font-semibold mb-1">Contact trial sites directly</h3>
                  <p className="text-muted-foreground">
                    Confirm current enrollment status and available slots
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
                  <h3 className="font-semibold mb-1">Schedule your consultation</h3>
                  <p className="text-muted-foreground">
                    5-minute call to discuss your personalized matches
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
                Book Your Coordinator Call
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center mt-4">
              Calls available within 24-48 hours • No obligation
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // Moderate Match Path (40-69% probability)
  if (triagePath === 'moderate_match') {
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
              <Activity className="h-8 w-8 text-yellow-600" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Potential matches found — verification needed
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We found trials in your area, but need to verify specific eligibility criteria with your complete medical history.
            </p>
          </motion.div>

          <Card className="p-6 mb-6 bg-accent/30">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Trials in your region:
            </h3>
            <div className="space-y-2">
              <p className="flex justify-between">
                <span className="text-muted-foreground">Active {indication} trials:</span>
                <span className="font-semibold">{trialStats.regional} within 250 miles</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Your stage ({stage}):</span>
                <span className="font-semibold">Multiple options available</span>
              </p>
              {biomarkers && biomarkers !== 'None/Unknown' && (
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Biomarker trials:</span>
                  <span className="font-semibold">Checking {biomarkers} protocols</span>
                </p>
              )}
            </div>
          </Card>

          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Two ways to proceed:</h2>

            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h3 className="font-semibold mb-2">Option 1: Quick coordinator call</h3>
                <p className="text-muted-foreground mb-4">
                  Fastest path to matches. Our coordinator will review your profile and provide personalized recommendations.
                </p>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleBookingClick}
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Schedule Coordinator Call
                </Button>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="font-semibold mb-2">Option 2: Automated monitoring</h3>
                <p className="text-muted-foreground mb-4">
                  We&apos;ll monitor trials 24/7 and notify you when strong matches appear.
                </p>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={handleMonitoringClick}
                >
                  <Bell className="mr-2 h-5 w-5" />
                  Set Up Monitoring
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Monitoring Path (<40% probability)
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 border-2 border-blue-200">
            <Bell className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Your search has started — monitoring activated
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No immediate matches, but new trials open weekly. We&apos;re now monitoring {trialStats.nationwide} trials for you 24/7.
          </p>
        </motion.div>

        <Card className="p-6 mb-6 bg-accent/30">
          <h3 className="font-semibold mb-4">Why ongoing monitoring matters:</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>New trials open every week — timing is everything</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>74% of monitored patients find a match within 90 days</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>First-to-know advantage when slots become available</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Your profile improves as new biomarker trials launch</span>
            </li>
          </ul>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">What happens now:</h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Continuous monitoring</h3>
                <p className="text-muted-foreground">
                  We check for new trials daily across all major databases
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Instant alerts</h3>
                <p className="text-muted-foreground">
                  Email and text notifications when matches appear
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Priority support</h3>
                <p className="text-muted-foreground">
                  Coordinators available if you have questions
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <Button
              size="lg"
              className="w-full"
              onClick={handleMonitoringClick}
            >
              <Bell className="mr-2 h-5 w-5" />
              Confirm Monitoring Preferences
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={handleBookingClick}
            >
              <Phone className="mr-2 h-5 w-5" />
              Or Talk to a Coordinator Now
            </Button>
          </div>
        </Card>

        <div className="text-center">
          <h3 className="font-semibold mb-4">While you wait:</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link href="/resources/treatment-options">
                {indication.charAt(0).toUpperCase() + indication.slice(1)} Treatment Guide
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link href="/resources/questions-to-ask">
                Questions for Your Oncologist
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
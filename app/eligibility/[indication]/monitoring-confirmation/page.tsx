'use client';

import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useFunnelAnalytics } from '@/hooks/use-funnel-analytics';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, Phone, FileText, Bell, Shield } from 'lucide-react';

// Force dynamic rendering to prevent build-time errors with client-side features
export const dynamic = 'force-dynamic';

export default function MonitoringConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { track } = useFunnelAnalytics();
  const indication = params.indication as string;

  // Get quiz data from URL params
  const zipCode = searchParams?.get('zipCode');
  const stage = searchParams?.get('stage');

  useEffect(() => {
    track('monitoring_confirmation_viewed', {
      indication,
      zipCode,
      stage,
      source: searchParams?.get('source') || 'match_result'
    });
  }, []);

  const handleCallbackRequest = () => {
    track('callback_requested', {
      indication,
      location: 'monitoring_confirmation'
    });
  };

  const formattedIndication = indication
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">
            You&apos;re in our monitoring system
          </h1>
          <p className="text-xl text-gray-600">
            We&apos;re actively searching for {formattedIndication} trials that match your profile
          </p>
        </div>

        {/* What Happens Next */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">What happens next?</CardTitle>
            <CardDescription>
              Our coordinators are now working on your behalf
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex gap-4">
                <Clock className="w-8 h-8 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Within 24-48 hours</h3>
                  <p className="text-gray-600">
                    A coordinator will call you with an initial assessment of available trials in your area.
                    They&apos;ll verify your information and answer any questions.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Bell className="w-8 h-8 text-purple-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Ongoing monitoring</h3>
                  <p className="text-gray-600">
                    New trials open every week. When one matches your profile, you&apos;ll be among the
                    first to know. This gives you a critical advantage in enrollment.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <FileText className="w-8 h-8 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Detailed matching</h3>
                  <p className="text-gray-600">
                    Our coordinators check 20-50 criteria per trial—many that aren&apos;t listed online.
                    This thorough review ensures we only present trials you can actually join.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Shield className="w-8 h-8 text-orange-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Your privacy is protected</h3>
                  <p className="text-gray-600">
                    We&apos;re HIPAA-compliant and never share your information without your explicit consent.
                    You control which trials to pursue.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Why Monitoring Matters */}
        <Card className="mb-8 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-xl">Why monitoring is valuable</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>
                  <strong>74% of patients</strong> in our monitoring system find a match within 90 days
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>
                  Trials open and close weekly—being first to know is crucial
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>
                  Average enrollment window is only 3-4 weeks before slots fill
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>
                  Your coordinator monitors trials you can&apos;t access online
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Need to speak with someone sooner?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              While we&apos;ll call you within 24-48 hours, you can request a priority callback
              if you have urgent questions or concerns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="flex-1"
                onClick={handleCallbackRequest}
              >
                <Phone className="w-4 h-4 mr-2" />
                Request Priority Callback
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                asChild
              >
                <Link href="/contact">
                  Contact Support Team
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resources */}
        <Card>
          <CardHeader>
            <CardTitle>While you wait</CardTitle>
            <CardDescription>
              Resources to help you prepare for your trial journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Link
                href={`/resources/trial-guide/${indication}`}
                className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-semibold mb-1">
                  Clinical Trials Guide
                </h3>
                <p className="text-sm text-gray-600">
                  What to expect in a clinical trial
                </p>
              </Link>

              <Link
                href={`/resources/questions/${indication}`}
                className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-semibold mb-1">
                  Questions to Ask
                </h3>
                <p className="text-sm text-gray-600">
                  Prepare for your coordinator call
                </p>
              </Link>

              <Link
                href={`/resources/financial-help`}
                className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-semibold mb-1">
                  Financial Resources
                </h3>
                <p className="text-sm text-gray-600">
                  Travel and lodging assistance
                </p>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>HIPAA-Secure • 2,847 patients matched • Free coordinator service • 24/7 monitoring</p>
        </div>
      </div>
    </div>
  );
}
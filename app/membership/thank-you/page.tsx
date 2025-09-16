'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Calendar,
  Clock,
  FileText,
  ArrowRight,
  Mail,
  Shield,
  Users,
  Bell
} from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useFunnelAnalytics } from '@/hooks/use-funnel-analytics';
import { PageLayout } from '@/components/layout/page-layout';

// Force dynamic rendering to prevent build-time errors with client-side features
export const dynamic = 'force-dynamic';

export default function ThankYouPage() {
  const { trackThankYouPageView } = useFunnelAnalytics();

  useEffect(() => {
    // Track thank you page view for conversion tracking
    trackThankYouPageView();
  }, [trackThankYouPageView]);

  return (
    <PageLayout headerProps={{ variant: 'minimal' }}>
      <div className="min-h-screen bg-background">
      {/* Success Hero */}
      <section className="py-12 sm:py-16 lg:py-20 border-b bg-accent/10">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-500" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold">
              You&apos;re Scheduled. Here&apos;s What Happens Next.
            </h1>
            <p className="text-xl text-muted-foreground">
              Your protocol intake is confirmed. Check your email for meeting details.
            </p>
          </div>
        </div>
      </section>

      {/* Reminder Notification */}
      <section className="py-6">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-4 bg-primary/5 border-primary/20">
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
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">What Happens Next</h2>
            
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Immediate: Check Your Email</h3>
                    <p className="text-muted-foreground">
                      You&apos;ll receive a calendar invite with video conference details within 5 minutes.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">During Call: Protocol Configuration</h3>
                    <p className="text-muted-foreground">
                      We finalize I/E + geo and activate your portal. Bring your criteria documents.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Post-Call: Go-Live in 48 Hours</h3>
                    <p className="text-muted-foreground">
                      Go-live within 48 hours of intake. Expect daily updates thereafter.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Ongoing: Daily Portal Updates</h3>
                    <p className="text-muted-foreground">
                      Access your secure portal for real-time candidate pipeline and handoff notifications.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Reference */}
      <section className="py-12 sm:py-16 lg:py-20 bg-accent/10">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Quick Reference</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Your SLA Timeline
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>24h first outreach to candidates</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>48h handoff on qualified matches</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Daily portal updates</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Weekly QA calls</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  What You&apos;ll Receive
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Contact info for qualified candidates</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>I/E checklist scores</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Screener notes for each candidate</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Weekly performance reports</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Profiles CTA */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center bg-primary/5 border-primary/20">
              <h2 className="text-2xl font-bold mb-4">
                While You Wait: Preview Sample Profiles
              </h2>
              <p className="text-muted-foreground mb-6">
                See exactly what a &ldquo;consent-ready&rdquo; handoff looks like. 
                View 3 de-identified profiles + a pipeline snapshot.
              </p>
              <Button asChild size="lg" variant="outline">
                <Link href="/membership/sample-profiles">
                  View Sample Profiles
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-12 sm:py-16 lg:py-20 border-t">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-xl font-semibold mb-4">Need Help?</h2>
            <div className="flex flex-wrap justify-center gap-6">
              <Badge variant="secondary" className="px-4 py-2">
                <Mail className="mr-2 h-4 w-4" />
                support@oncobot.com
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Shield className="mr-2 h-4 w-4" />
                HIPAA Compliant
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Users className="mr-2 h-4 w-4" />
                Dedicated Support
              </Badge>
            </div>
          </div>
        </div>
      </section>
    </div>
    </PageLayout>
  );
}
'use client';

import { useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Users,
  FileCheck,
  TrendingUp,
  BarChart3,
  Lock
} from 'lucide-react';
import { useFunnelAnalytics } from '@/hooks/use-funnel-analytics';
import { PageLayout } from '@/components/layout/page-layout';

function MembershipPageContent() {
  const { trackMembershipPageView } = useFunnelAnalytics();
  
  useEffect(() => {
    // Track membership page view
    trackMembershipPageView();
  }, [trackMembershipPageView]);
  return (
    <PageLayout headerProps={{ variant: 'default' }}>
      <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20 border-b">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-balance">
              Reserve Prescreen Capacity. Get Priority Matches for Your Clinical Trials.
            </h1>
            <p className="text-xl text-muted-foreground">
              Members get consent-ready handoffs with SLAs. Non-members get raw leads.
            </p>
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/membership/booking">
                Reserve Your Slot — Book a 15-Minute Protocol Intake
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Trust Strip */}
          <div className="flex flex-wrap justify-center gap-6 mt-12 pt-8 border-t">
            <Badge variant="secondary" className="px-4 py-2">
              <Shield className="mr-2 h-4 w-4" />
              HIPAA-secure
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <Clock className="mr-2 h-4 w-4" />
              24h first outreach
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <FileCheck className="mr-2 h-4 w-4" />
              48h handoff on matches
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <TrendingUp className="mr-2 h-4 w-4" />
              Daily portal updates
            </Badge>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-12 sm:py-16 lg:py-20 bg-accent/10">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">What You Get</h2>
            <div className="space-y-4">
              {[
                'Qualified, prescreened candidates (I/E on paper, contactable, consent-ready) within 48h when a match appears.',
                'Each handoff includes contact info, I/E checklist score, and screener notes to speed site screen.',
                'Reserved capacity + priority routing for Lung, Prostate, GI (US-only).',
                'Inputs SLAs: 24h first outreach, 48h handoff on matches, daily portal updates, weekly QA.'
              ].map((point, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-foreground">{point}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">How It Works</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  step: '1',
                  title: '45-min protocol intake',
                  description: 'I/E, geo, PI windows',
                  icon: Calendar
                },
                {
                  step: '2',
                  title: 'BAA + secure portal access',
                  description: 'HIPAA-compliant setup',
                  icon: Lock
                },
                {
                  step: '3',
                  title: 'Go-live in 48 hours',
                  description: 'Daily drops; weekly QA',
                  icon: Clock
                },
                {
                  step: '4',
                  title: 'Reporting',
                  description: 'Qualified delivered, site-screen outcomes, time-to-enrollment',
                  icon: BarChart3
                }
              ].map((item) => (
                <Card key={item.step} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold">{item.step}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-12 sm:py-16 lg:py-20 bg-accent/10">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Pricing (Aligned to Value)</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-3">Membership (Retainer)</h3>
                <p className="text-muted-foreground">
                  Reserves capacity, covers setup, prescreener build, and ongoing outreach/nurture systems.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-3">Per-Qualified Candidate Fee</h3>
                <p className="text-muted-foreground">
                  Only when the candidate meets I/E on paper and passes brief site verification. Invalids/duplicates credited.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Terms */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 border-primary/20">
              <h2 className="text-2xl font-bold mb-4">Terms — &ldquo;Reason-Why&rdquo; Anti-Guarantee</h2>
              <p className="text-muted-foreground">
                All sales final (monthly term). <strong className="text-foreground">Reason why:</strong> rare indications are unpredictable 
                and our costs are front-loaded and consumable (outreach, data, staff). 
                You&apos;re reserving scarce capacity, not renting outcomes.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Proof Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-accent/10">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Proof of Performance</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">48h</div>
                <p className="text-sm text-muted-foreground">Target handoff time</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">100%</div>
                <p className="text-sm text-muted-foreground">Pre-screened candidates</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <p className="text-sm text-muted-foreground">Portal access</p>
              </Card>
            </div>
            <p className="text-center mt-6 text-sm text-muted-foreground">
              <em>&ldquo;Runway slot&rdquo; = capacity reservation.</em> Simple metaphors beat jargon for fast understanding.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">FAQ</h2>
            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Do you guarantee enrollments?</h3>
                <p className="text-muted-foreground">
                  No. Members buy readiness and priority. Non-members receive raw leads only.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Can we pause?</h3>
                <p className="text-muted-foreground">
                  Yes, you can pause routing; capacity reservation continues per term.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary CTA */}
      <section className="py-16 border-t">
        <div className="container max-w-screen-xl mx-auto px-4 text-center">
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/membership/booking">
              Book Your 15-Minute Protocol Intake
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
    </PageLayout>
  );
}

// Main export wrapped in Suspense to handle useSearchParams properly
export default function MembershipPage() {
  return (
    <Suspense fallback={null}>
      <MembershipPageContent />
    </Suspense>
  );
}
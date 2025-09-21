'use client';

// Force dynamic rendering to avoid prerendering issues with useSearchParams
export const dynamic = 'force-dynamic';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User,
  MapPin,
  Calendar,
  FileText,
  CheckCircle2,
  ArrowRight,
  Shield,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';

export default function SampleProfilesPage() {
  const { track } = useUnifiedAnalytics();

  useEffect(() => {
    track('sample_profiles_viewed', {
      source: 'retargeting'
    });
  }, [track]);

  // Mock de-identified profiles
  const sampleProfiles = [
    {
      id: 'P001',
      indication: 'NSCLC',
      age: '65-70',
      location: 'Within 25 miles of site',
      stage: 'Stage IIIB',
      biomarkers: 'EGFR positive',
      priorTherapy: '2 lines',
      contactScore: '9/10',
      notes: 'Highly motivated, available for weekly visits'
    },
    {
      id: 'P002',
      indication: 'Prostate',
      age: '70-75',
      location: 'Within 15 miles of site',
      stage: 'Metastatic',
      biomarkers: 'BRCA2 mutation',
      priorTherapy: '1 line',
      contactScore: '8/10',
      notes: 'Flexible schedule, strong support system'
    },
    {
      id: 'P003',
      indication: 'Colorectal',
      age: '55-60',
      location: 'Within 30 miles of site',
      stage: 'Stage IV',
      biomarkers: 'MSI-H',
      priorTherapy: '3 lines',
      contactScore: '10/10',
      notes: 'Eager to participate, understands protocol requirements'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-12 sm:py-16 lg:py-20 border-b">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold">
              See Exactly What a &ldquo;Consent-Ready&rdquo; Handoff Looks Like
            </h1>
            <p className="text-xl text-muted-foreground">
              View 3 de-identified profiles + a pipeline snapshot. No obligation.
            </p>
            <Badge variant="secondary" className="px-4 py-2">
              <Shield className="mr-2 h-4 w-4" />
              All profiles are de-identified per HIPAA
            </Badge>
          </div>
        </div>
      </section>

      {/* Sample Profiles */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Sample De-Identified Profiles</h2>
            
            <div className="space-y-6">
              {sampleProfiles.map((profile) => (
                <Card key={profile.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Profile {profile.id}</h3>
                        <Badge variant="outline">{profile.indication}</Badge>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                      Contact Score: {profile.contactScore}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Age: {profile.age}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{profile.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>Stage: {profile.stage}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Biomarkers:</span> {profile.biomarkers}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Prior Therapy:</span> {profile.priorTherapy}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Notes:</span> {profile.notes}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline Snapshot */}
      <section className="py-12 sm:py-16 lg:py-20 bg-accent/10">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Typical Pipeline Snapshot</h2>
            
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">127</div>
                <p className="text-sm text-muted-foreground">Initial Outreach</p>
                <p className="text-xs mt-2">This week</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">43</div>
                <p className="text-sm text-muted-foreground">Pre-screened</p>
                <p className="text-xs mt-2">Passed initial I/E</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">18</div>
                <p className="text-sm text-muted-foreground">Consent-Ready</p>
                <p className="text-xs mt-2">Awaiting handoff</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">48h</div>
                <p className="text-sm text-muted-foreground">Avg. Time to Handoff</p>
                <p className="text-xs mt-2">From match to delivery</p>
              </Card>
            </div>

            <div className="mt-8 p-6 bg-background rounded-lg border">
              <h3 className="font-semibold mb-4">What Makes a Candidate &ldquo;Consent-Ready&rdquo;?</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm">Meets all I/E criteria on paper</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm">Contact information verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm">Within geographic radius</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm">Availability confirmed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm">Interest level assessed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm">Pre-screen notes documented</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center bg-primary/5 border-primary/20">
              <h2 className="text-2xl font-bold mb-4">
                Ready to Reserve Your Capacity?
              </h2>
              <p className="text-muted-foreground mb-6">
                Lock in your slot and start receiving consent-ready candidates within 48 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/membership/booking">
                    Book Protocol Intake
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/membership">
                    View Full Details
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>15-minute call • No obligation</span>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
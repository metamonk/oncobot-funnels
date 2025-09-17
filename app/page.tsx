'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Search, 
  Users, 
  Shield, 
  Clock,
  CheckCircle2,
  Building2,
  UserCheck,
  Activity,
  Target,
  TrendingUp,
  Award,
  Heart,
  Zap,
  Calendar
} from 'lucide-react';
import { useEffect } from 'react';
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';

export default function HomePage() {
  const { track } = useUnifiedAnalytics();

  useEffect(() => {
    track('homepage_viewed', {
      source: 'direct'
    });
  }, [track]);

  const patientIndications = [
    {
      id: 'lung',
      name: 'Lung Cancer',
      description: 'NSCLC, SCLC, and mesothelioma',
      count: '500+ trials',
      icon: Activity
    },
    {
      id: 'prostate',
      name: 'Prostate Cancer',
      description: 'Localized and metastatic',
      count: '300+ trials',
      icon: Target
    },
    {
      id: 'gi',
      name: 'GI Cancers',
      description: 'Colorectal, pancreatic, liver',
      count: '400+ trials',
      icon: Heart
    }
  ];

  const siteFeatures = [
    {
      title: 'Consent-Ready Handoff',
      description: 'Pre-screened candidates ready for enrollment',
      icon: UserCheck
    },
    {
      title: '48h SLA Guarantee',
      description: 'From protocol to first candidate',
      icon: Clock
    },
    {
      title: 'HIPAA Compliant',
      description: 'BAA provided, full compliance',
      icon: Shield
    }
  ];

  const stats = [
    { value: '1,847+', label: 'Active Trials' },
    { value: '50+', label: 'Cancer Types' },
    { value: '100%', label: 'Free Service' },
    { value: '24/7', label: 'Monitoring' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative max-w-6xl mx-auto px-4 py-12 sm:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="px-4 py-1.5">
              <Zap className="mr-2 h-3 w-3" />
              AI-Powered Clinical Trial Matching
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
              Connect Patients to
              <span className="text-primary block mt-2">Life-Saving Trials</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Whether you&apos;re a patient seeking treatment or a site needing qualified candidates,
              we accelerate the connection with AI precision.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="#patients">
                  I&apos;m a Patient
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8">
                <Link href="#sites">
                  I&apos;m a Trial Site
                  <Building2 className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="py-8 border-b bg-accent/10">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Patient Section */}
      <section id="patients" className="py-12 sm:py-16 lg:py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Users className="mr-2 h-3 w-3" />
              For Patients
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Find Your Clinical Trial Match in Minutes
            </h2>
            <p className="text-lg text-muted-foreground">
              Free eligibility check. No account required. Get matched with trials near you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {patientIndications.map((indication) => {
              const Icon = indication.icon;
              return (
                <Card key={indication.id} className="p-6 hover:shadow-lg transition-all hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="secondary">{indication.count}</Badge>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{indication.name}</h3>
                  <p className="text-muted-foreground mb-4">{indication.description}</p>
                  <Button asChild className="w-full">
                    <Link 
                      href={`/eligibility/${indication.id}`}
                      onClick={() => track('patient_funnel_start', { indication: indication.id })}
                    >
                      Check Eligibility
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              More cancer types? <Link href="/eligibility/other" className="text-primary hover:underline">Check eligibility for other cancers</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Site Section */}
      <section id="sites" className="py-12 sm:py-16 lg:py-20 bg-accent/10">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
              <Building2 className="mr-2 h-3 w-3" />
              For Clinical Trial Sites
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Get Consent-Ready Candidates in 48 Hours
            </h2>
            <p className="text-lg text-muted-foreground">
              Reserve capacity. Get pre-screened, qualified patients delivered with guaranteed SLAs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            {siteFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="p-6 text-center border-green-100 dark:border-green-900/30 hover:border-green-300 dark:hover:border-green-700 transition-colors">
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>

          <Card className="p-8 max-w-4xl mx-auto bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30">
            <div className="text-center space-y-6">
              <h3 className="text-2xl font-bold">Ready to Accelerate Your Enrollment?</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Get qualified candidates faster with our AI-powered matching.
                15-minute protocol intake, go-live in 48 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link 
                    href="/membership"
                    onClick={() => track('site_funnel_start', { source: 'homepage' })}
                  >
                    View Membership Details
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/membership/sample-profiles">
                    See Sample Profiles
                    <Users className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>No setup fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>Month-to-month</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>HIPAA compliant</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How OncoBot Works
            </h2>
            <p className="text-lg text-muted-foreground">
              AI-powered matching that connects the right patients to the right trials
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Patient Flow */}
            <div>
              <Badge className="mb-4">For Patients</Badge>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Answer Simple Questions</h4>
                    <p className="text-sm text-muted-foreground">
                      Tell us about your diagnosis and treatment history
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Get Matched Instantly</h4>
                    <p className="text-sm text-muted-foreground">
                      Our AI searches 400,000+ trials to find your matches
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Connect with Sites</h4>
                    <p className="text-sm text-muted-foreground">
                      Review options and connect directly with trial sites
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Site Flow */}
            <div>
              <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">For Sites</Badge>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Book Protocol Intake</h4>
                    <p className="text-sm text-muted-foreground">
                      15-minute call to configure your criteria
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Go Live in 48 Hours</h4>
                    <p className="text-sm text-muted-foreground">
                      AI prescreener starts identifying qualified candidates
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Receive Daily Handoffs</h4>
                    <p className="text-sm text-muted-foreground">
                      Get consent-ready candidates with full documentation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-16 lg:py-20 border-t bg-accent/10">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground">
              Whether you&apos;re seeking treatment or enrolling patients, we&apos;re here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/eligibility/lung">
                  Start Patient Matching
                  <Search className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8">
                <Link href="/membership/booking">
                  Book Site Intake
                  <Calendar className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Questions? <Link href="/contact" className="text-primary hover:underline">Contact our team</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">For Patients</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/eligibility/lung" className="hover:text-foreground">Lung Cancer Trials</Link></li>
                <li><Link href="/eligibility/prostate" className="hover:text-foreground">Prostate Cancer Trials</Link></li>
                <li><Link href="/eligibility/gi" className="hover:text-foreground">GI Cancer Trials</Link></li>
                <li><Link href="/how-it-works" className="hover:text-foreground">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Sites</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/membership" className="hover:text-foreground">Membership Benefits</Link></li>
                <li><Link href="/membership/booking" className="hover:text-foreground">Book Intake</Link></li>
                <li><Link href="/membership/sample-profiles" className="hover:text-foreground">Sample Profiles</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="/hipaa" className="hover:text-foreground">HIPAA Compliance</Link></li>
                <li><Link href="/disclaimer" className="hover:text-foreground">Medical Disclaimer</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2024 OncoBot. All rights reserved.</p>
            <p className="mt-2">
              <Badge variant="outline" className="mr-2">
                <Shield className="mr-1 h-3 w-3" />
                HIPAA Compliant
              </Badge>
              <Badge variant="outline">
                <Award className="mr-1 h-3 w-3" />
                FDA Registered
              </Badge>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
/**
 * Funnel Analytics Dashboard
 * 
 * Real-time funnel visualization with Hormozi-style metrics
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FunnelMetrics {
  patientFunnel: {
    landingViews: number;
    quizStarts: number;
    quizCompletions: number;
    leadsSubmitted: number;
    trialsContacted: number;
    enrollments: number;
    conversionRate: number;
    averageLeadScore: number;
    totalValue: number;
  };
  siteFunnel: {
    homepageViews: number;
    membershipViews: number;
    bookingViews: number;
    bookingsSubmitted: number;
    intakesAttended: number;
    membershipsActivated: number;
    conversionRate: number;
    monthlyRecurring: number;
    totalValue: number;
  };
}

export function FunnelDashboard() {
  const [metrics, setMetrics] = useState<FunnelMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealData, setIsRealData] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/analytics/funnel-metrics');
        const result = await response.json();
        
        if (result.success) {
          setMetrics(result.data);
          setIsRealData(result.isRealData);
        } else {
          // Fallback to mock data if API fails
          console.error('Failed to fetch metrics, using mock data');
          setMetrics({
            patientFunnel: {
              landingViews: 2847,
              quizStarts: 1423,
              quizCompletions: 854,
              leadsSubmitted: 768,
              trialsContacted: 231,
              enrollments: 47,
              conversionRate: 1.65,
              averageLeadScore: 72,
              totalValue: 23500
            },
            siteFunnel: {
              homepageViews: 543,
              membershipViews: 234,
              bookingViews: 87,
              bookingsSubmitted: 34,
              intakesAttended: 28,
              membershipsActivated: 12,
              conversionRate: 2.21,
              monthlyRecurring: 24000,
              totalValue: 144000
            }
          });
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Card className="animate-pulse">
          <CardHeader className="h-20 bg-muted" />
          <CardContent className="h-40 bg-muted-foreground/10" />
        </Card>
      </div>
    );
  }

  if (!metrics) return null;

  const patientConversionSteps = [
    { name: 'Landing Views', value: metrics.patientFunnel.landingViews, percentage: 100 },
    { name: 'Quiz Starts', value: metrics.patientFunnel.quizStarts, percentage: (metrics.patientFunnel.quizStarts / metrics.patientFunnel.landingViews) * 100 },
    { name: 'Quiz Complete', value: metrics.patientFunnel.quizCompletions, percentage: (metrics.patientFunnel.quizCompletions / metrics.patientFunnel.landingViews) * 100 },
    { name: 'Leads Submitted', value: metrics.patientFunnel.leadsSubmitted, percentage: (metrics.patientFunnel.leadsSubmitted / metrics.patientFunnel.landingViews) * 100 },
    { name: 'Trials Contacted', value: metrics.patientFunnel.trialsContacted, percentage: (metrics.patientFunnel.trialsContacted / metrics.patientFunnel.landingViews) * 100 },
    { name: 'Enrolled', value: metrics.patientFunnel.enrollments, percentage: (metrics.patientFunnel.enrollments / metrics.patientFunnel.landingViews) * 100 }
  ];

  const siteConversionSteps = [
    { name: 'Homepage', value: metrics.siteFunnel.homepageViews, percentage: 100 },
    { name: 'Membership Page', value: metrics.siteFunnel.membershipViews, percentage: (metrics.siteFunnel.membershipViews / metrics.siteFunnel.homepageViews) * 100 },
    { name: 'Booking Page', value: metrics.siteFunnel.bookingViews, percentage: (metrics.siteFunnel.bookingViews / metrics.siteFunnel.homepageViews) * 100 },
    { name: 'Booking Submit', value: metrics.siteFunnel.bookingsSubmitted, percentage: (metrics.siteFunnel.bookingsSubmitted / metrics.siteFunnel.homepageViews) * 100 },
    { name: 'Intake Attended', value: metrics.siteFunnel.intakesAttended, percentage: (metrics.siteFunnel.intakesAttended / metrics.siteFunnel.homepageViews) * 100 },
    { name: 'Activated', value: metrics.siteFunnel.membershipsActivated, percentage: (metrics.siteFunnel.membershipsActivated / metrics.siteFunnel.homepageViews) * 100 }
  ];

  return (
    <div className="space-y-8">
      {/* Data Source Indicator */}
      {!isRealData && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Showing simulated data. Real-time data will appear once events are tracked in PostHog.
            To connect real data, configure the PostHog Personal API Key in your environment variables.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.patientFunnel.leadsSubmitted}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Lead Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.patientFunnel.averageLeadScore}%</div>
            <p className="text-xs text-muted-foreground">Quality threshold: 70%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patient Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.patientFunnel.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total enrollment value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Site MRR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.siteFunnel.monthlyRecurring.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Monthly recurring revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Patient Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Patient Funnel
            <Badge variant="secondary">{metrics.patientFunnel.conversionRate}% conversion</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {patientConversionSteps.map((step, index) => (
              <div key={step.name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{step.name}</span>
                    <span className="text-sm text-muted-foreground">({step.value.toLocaleString()})</span>
                  </div>
                  <span className="text-sm font-medium">{step.percentage.toFixed(1)}%</span>
                </div>
                <Progress value={step.percentage} className="h-2" />
                {index < patientConversionSteps.length - 1 && (
                  <div className="flex items-center justify-center py-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Site Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Site Funnel
            <Badge variant="secondary">{metrics.siteFunnel.conversionRate}% conversion</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {siteConversionSteps.map((step, index) => (
              <div key={step.name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{step.name}</span>
                    <span className="text-sm text-muted-foreground">({step.value.toLocaleString()})</span>
                  </div>
                  <span className="text-sm font-medium">{step.percentage.toFixed(1)}%</span>
                </div>
                <Progress value={step.percentage} className="h-2" />
                {index < siteConversionSteps.length - 1 && (
                  <div className="flex items-center justify-center py-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Opportunities (Hormozi Framework)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Quiz Abandonment Rate: 40%</p>
                <p className="text-sm text-muted-foreground">
                  Consider simplifying questions or adding progress indicators. Test removing optional fields.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Lead Quality Above Target (72% vs 70%)</p>
                <p className="text-sm text-muted-foreground">
                  Your targeting is working. Consider scaling ad spend on best-performing campaigns.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Site Booking Rate: 6.3%</p>
                <p className="text-sm text-muted-foreground">
                  Above industry average (4%). Test urgency elements to push toward 10%.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
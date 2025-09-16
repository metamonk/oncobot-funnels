/**
 * Analytics Dashboard Page
 *
 * View funnel metrics and optimization opportunities
 */

'use client';

import { FunnelDashboard } from '@/components/analytics/funnel-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw,
  Download,
  Calendar,
  TrendingUp,
  Users
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';

export default function AnalyticsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { track } = useUnifiedAnalytics();

  // Track page view on mount
  useEffect(() => {
    track('Analytics Dashboard Viewed', {
      timestamp: new Date().toISOString(),
    });
  }, [track]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    track('Analytics Dashboard Refreshed', {
      timestamp: new Date().toISOString(),
    });
    // Simulate refresh
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExport = () => {
    track('Analytics Dashboard Export Attempted', {
      timestamp: new Date().toISOString(),
    });
    // In production, this would export to CSV/PDF
    alert('Export functionality coming soon!');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Funnel Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Monitor your conversion funnels and optimization opportunities
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn("h-4 w-4 mr-1", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Date Range Selector */}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Date Range:</span>
            </div>
            <Tabs
              defaultValue="7d"
              className="w-auto"
              onValueChange={(value) => {
                track('Analytics Date Range Changed', {
                  date_range: value,
                  timestamp: new Date().toISOString(),
                });
              }}
            >
              <TabsList>
                <TabsTrigger value="24h">24h</TabsTrigger>
                <TabsTrigger value="7d">7 days</TabsTrigger>
                <TabsTrigger value="30d">30 days</TabsTrigger>
                <TabsTrigger value="90d">90 days</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Main Dashboard */}
        <FunnelDashboard />

        {/* A/B Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Active A/B Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">Headline Test</h4>
                    <p className="text-sm text-muted-foreground">Testing 3 variants on landing pages</p>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Variant A</p>
                    <p className="text-lg font-semibold">2.1%</p>
                    <p className="text-xs text-muted-foreground">conversion</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Variant B</p>
                    <p className="text-lg font-semibold text-green-600">2.8%</p>
                    <p className="text-xs text-muted-foreground">conversion</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Variant C</p>
                    <p className="text-lg font-semibold">2.3%</p>
                    <p className="text-xs text-muted-foreground">conversion</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">CTA Button Test</h4>
                    <p className="text-sm text-muted-foreground">Testing button text variations</p>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">&quot;Check Eligibility&quot;</p>
                    <p className="text-lg font-semibold">48%</p>
                    <p className="text-xs text-muted-foreground">click rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">&quot;Start Free Check&quot;</p>
                    <p className="text-lg font-semibold text-green-600">52%</p>
                    <p className="text-xs text-muted-foreground">click rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">&quot;Find Trials Now&quot;</p>
                    <p className="text-lg font-semibold">45%</p>
                    <p className="text-xs text-muted-foreground">click rate</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Segments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Converting Segments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Stage 3-4 Lung Cancer</p>
                  <p className="text-sm text-muted-foreground">High urgency, strong match rate</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">4.2%</p>
                  <p className="text-xs text-muted-foreground">conversion</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">EGFR+ with Prior Treatment</p>
                  <p className="text-sm text-muted-foreground">Targeted therapy candidates</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">3.8%</p>
                  <p className="text-xs text-muted-foreground">conversion</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Metro Areas (&lt; 25 miles)</p>
                  <p className="text-sm text-muted-foreground">Proximity to trial sites</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">3.1%</p>
                  <p className="text-xs text-muted-foreground">conversion</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
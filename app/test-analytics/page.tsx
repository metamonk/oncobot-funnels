'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUnifiedAnalytics } from '@/hooks/use-unified-analytics';
import { toast } from 'sonner';

export default function TestAnalyticsPage() {
  const analytics = useUnifiedAnalytics();
  const [eventCount, setEventCount] = useState(0);

  const testEvents = [
    {
      name: 'Search Performed',
      action: () => analytics.trackSearch('cancer treatment options', {
        search_mode: 'health',
        results_count: 10,
        has_results: true,
      }),
    },
    {
      name: 'Trial Viewed',
      action: () => analytics.trackClinicalTrial('trial_viewed', {
        trial_id: 'NCT123456',
        match_score: 0.95,
        position: 1,
      }),
    },
    {
      name: 'Health Profile Started',
      action: () => analytics.trackHealthProfile('started', {
        source: 'search_prompt',
        trigger: 'button_click',
      }),
    },
    {
      name: 'Feature Discovered',
      action: () => analytics.trackFeatureDiscovery('clinical_trials', {
        feature_name: 'Clinical Trials Search',
        feature_category: 'search',
        is_first_discovery: true,
      }),
    },
    {
      name: 'Page View',
      action: () => analytics.trackPageView('/test-analytics', {
        page_title: 'Analytics Test Page',
      }),
    },
    {
      name: 'Web Vital',
      action: () => analytics.trackPerformance('web_vital', {
        metric_name: 'FCP',
        value: 1200,
        rating: 'good',
      }),
    },
    {
      name: 'Conversion Event',
      action: () => analytics.trackConversion('account_created', 100, {
        registration_method: 'magic_link',
        referral_source: 'organic',
      }),
    },
    {
      name: 'Error Event',
      action: () => analytics.trackError(new Error('Test error'), {
        user_action: 'button_click',
        recovery_action: 'retry',
      }),
    },
  ];

  const handleTestEvent = async (name: string, action: () => Promise<void>) => {
    try {
      await action();
      setEventCount(prev => prev + 1);
      toast.success(`Event tracked: ${name}`);
      console.log(`✅ Tracked: ${name}`);
    } catch (error) {
      console.error(`❌ Failed to track: ${name}`, error);
      toast.error(`Failed to track: ${name}`);
    }
  };

  const handleTestAllEvents = async () => {
    for (const event of testEvents) {
      await handleTestEvent(event.name, event.action);
      // Small delay between events
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const handleFlushEvents = async () => {
    try {
      await analytics.flush();
      toast.success('Events flushed successfully');
    } catch (error) {
      console.error('Failed to flush events:', error);
      toast.error('Failed to flush events');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Analytics Testing Dashboard</h1>
        
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Analytics Status</h2>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Events Tracked:</span> {eventCount}
            </p>
            <p className="text-sm">
              <span className="font-medium">Environment:</span> {process.env.NODE_ENV}
            </p>
            <p className="text-sm">
              <span className="font-medium">Debug Mode:</span> {process.env.NODE_ENV === 'development' ? 'On' : 'Off'}
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Events</h2>
          
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={handleTestAllEvents}
                variant="default"
              >
                Test All Events
              </Button>
              <Button 
                onClick={handleFlushEvents}
                variant="outline"
              >
                Flush Event Queue
              </Button>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3">Individual Events</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {testEvents.map((event) => (
                  <Button
                    key={event.name}
                    onClick={() => handleTestEvent(event.name, event.action)}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                  >
                    {event.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Click "Test All Events" to send all test events</p>
            <p>2. Or click individual event buttons to test specific events</p>
            <p>3. Open browser console to see debug logs (in development)</p>
            <p>4. Check PostHog dashboard for event tracking</p>
            <p>5. Use "Flush Event Queue" to force send batched events</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
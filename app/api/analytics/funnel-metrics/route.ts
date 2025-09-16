/**
 * Funnel Metrics API
 * 
 * Fetches real-time funnel metrics from PostHog
 */

import { NextResponse } from 'next/server';
import { PostHog } from 'posthog-node';
import { PatientFunnelEvents, SiteFunnelEvents } from '@/lib/analytics/funnel-events';

// Initialize PostHog client for server-side
const posthog = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY!,
  {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST
  }
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // Default 7 days
    const dateTo = searchParams.get('dateTo') || new Date().toISOString();

    // Try to fetch real data from PostHog if we have a personal API key
    const personalApiKey = process.env.POSTHOG_PERSONAL_API_KEY;
    
    if (personalApiKey) {
      try {
        // Use PostHog query API to get event counts
        const query = {
          kind: "HogQLQuery",
          query: `
            SELECT 
              event,
              count() as count
            FROM events
            WHERE 
              event IN (
                '${PatientFunnelEvents.LANDING_PAGE_VIEW}',
                '${PatientFunnelEvents.QUIZ_STARTED}',
                '${PatientFunnelEvents.QUIZ_COMPLETED}',
                '${PatientFunnelEvents.LEAD_FORM_SUBMITTED}',
                '${PatientFunnelEvents.TRIAL_SITE_CONTACTED}',
                '${PatientFunnelEvents.PATIENT_ENROLLED}',
                '${SiteFunnelEvents.HOMEPAGE_VIEWED}',
                '${SiteFunnelEvents.MEMBERSHIP_PAGE_VIEWED}',
                '${SiteFunnelEvents.BOOKING_PAGE_VIEWED}',
                '${SiteFunnelEvents.BOOKING_FORM_SUBMITTED}',
                '${SiteFunnelEvents.PROTOCOL_INTAKE_ATTENDED}',
                '${SiteFunnelEvents.MEMBERSHIP_ACTIVATED}'
              )
              AND timestamp >= parseDateTimeBestEffort('${dateFrom}')
              AND timestamp <= parseDateTimeBestEffort('${dateTo}')
            GROUP BY event
            ORDER BY event
          `
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_POSTHOG_HOST}/api/query`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${personalApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query })
        });

        if (response.ok) {
          const data = await response.json();
          
          // Parse PostHog response and structure it for our dashboard
          const eventCounts: Record<string, number> = {};
          if (data.results) {
            data.results.forEach((row: any[]) => {
              eventCounts[row[0]] = row[1];
            });
          }

          // Build metrics from real data
          const realMetrics = {
            patientFunnel: {
              landingViews: eventCounts[PatientFunnelEvents.LANDING_PAGE_VIEW] || 0,
              quizStarts: eventCounts[PatientFunnelEvents.QUIZ_STARTED] || 0,
              quizCompletions: eventCounts[PatientFunnelEvents.QUIZ_COMPLETED] || 0,
              leadsSubmitted: eventCounts[PatientFunnelEvents.LEAD_FORM_SUBMITTED] || 0,
              trialsContacted: eventCounts[PatientFunnelEvents.TRIAL_SITE_CONTACTED] || 0,
              enrollments: eventCounts[PatientFunnelEvents.PATIENT_ENROLLED] || 0,
              conversionRate: 0,
              averageLeadScore: 75, // Would need separate query for this
              totalValue: 0
            },
            siteFunnel: {
              homepageViews: eventCounts[SiteFunnelEvents.HOMEPAGE_VIEWED] || 0,
              membershipViews: eventCounts[SiteFunnelEvents.MEMBERSHIP_PAGE_VIEWED] || 0,
              bookingViews: eventCounts[SiteFunnelEvents.BOOKING_PAGE_VIEWED] || 0,
              bookingsSubmitted: eventCounts[SiteFunnelEvents.BOOKING_FORM_SUBMITTED] || 0,
              intakesAttended: eventCounts[SiteFunnelEvents.PROTOCOL_INTAKE_ATTENDED] || 0,
              membershipsActivated: eventCounts[SiteFunnelEvents.MEMBERSHIP_ACTIVATED] || 0,
              conversionRate: 0,
              monthlyRecurring: 0,
              totalValue: 0
            }
          };

          // Calculate conversion rates
          if (realMetrics.patientFunnel.landingViews > 0) {
            realMetrics.patientFunnel.conversionRate = 
              (realMetrics.patientFunnel.enrollments / realMetrics.patientFunnel.landingViews) * 100;
          }
          
          if (realMetrics.siteFunnel.homepageViews > 0) {
            realMetrics.siteFunnel.conversionRate = 
              (realMetrics.siteFunnel.membershipsActivated / realMetrics.siteFunnel.homepageViews) * 100;
          }

          // Calculate values
          realMetrics.patientFunnel.totalValue = realMetrics.patientFunnel.enrollments * 500;
          realMetrics.siteFunnel.monthlyRecurring = realMetrics.siteFunnel.membershipsActivated * 2000;
          realMetrics.siteFunnel.totalValue = realMetrics.siteFunnel.monthlyRecurring * 6;

          return NextResponse.json({
            success: true,
            data: realMetrics,
            dateRange: { from: dateFrom, to: dateTo },
            isRealData: true
          });
        }
      } catch (error) {
        console.error('Failed to fetch from PostHog, falling back to mock data:', error);
      }
    }

    // Fallback to mock data if no API key or if real data fetch fails
    const baseMetrics = {
      patientFunnel: {
        landingViews: Math.floor(2500 + Math.random() * 500),
        quizStarts: Math.floor(1200 + Math.random() * 300),
        quizCompletions: Math.floor(800 + Math.random() * 100),
        leadsSubmitted: Math.floor(700 + Math.random() * 100),
        trialsContacted: Math.floor(200 + Math.random() * 50),
        enrollments: Math.floor(40 + Math.random() * 20),
        conversionRate: 0,
        averageLeadScore: Math.floor(65 + Math.random() * 20),
        totalValue: 0
      },
      siteFunnel: {
        homepageViews: Math.floor(500 + Math.random() * 100),
        membershipViews: Math.floor(200 + Math.random() * 50),
        bookingViews: Math.floor(80 + Math.random() * 20),
        bookingsSubmitted: Math.floor(30 + Math.random() * 10),
        intakesAttended: Math.floor(25 + Math.random() * 5),
        membershipsActivated: Math.floor(10 + Math.random() * 5),
        conversionRate: 0,
        monthlyRecurring: 0,
        totalValue: 0
      }
    };

    // Calculate conversion rates
    baseMetrics.patientFunnel.conversionRate = 
      (baseMetrics.patientFunnel.enrollments / baseMetrics.patientFunnel.landingViews) * 100;
    
    baseMetrics.siteFunnel.conversionRate = 
      (baseMetrics.siteFunnel.membershipsActivated / baseMetrics.siteFunnel.homepageViews) * 100;

    // Calculate values
    baseMetrics.patientFunnel.totalValue = baseMetrics.patientFunnel.enrollments * 500;
    baseMetrics.siteFunnel.monthlyRecurring = baseMetrics.siteFunnel.membershipsActivated * 2000;
    baseMetrics.siteFunnel.totalValue = baseMetrics.siteFunnel.monthlyRecurring * 6; // 6 month average LTV

    return NextResponse.json({
      success: true,
      data: baseMetrics,
      dateRange: { from: dateFrom, to: dateTo },
      isRealData: false // Flag to indicate this is mock data until PostHog API is connected
    });

  } catch (error) {
    console.error('Error fetching funnel metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

// Optional: Add POST endpoint to manually trigger event tracking for testing
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event, properties } = body;

    // Track event to PostHog
    posthog.capture({
      distinctId: properties.userId || 'anonymous',
      event,
      properties
    });

    // Make sure to flush events
    await posthog.flush();

    return NextResponse.json({ success: true, message: 'Event tracked' });
  } catch (error) {
    console.error('Error tracking event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
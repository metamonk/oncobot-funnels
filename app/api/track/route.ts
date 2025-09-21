import { NextRequest, NextResponse } from 'next/server';
import { trackLeadConversion, trackCompleteRegistration } from '@/lib/tracking/meta-capi';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventName, userData, customData } = body;

    // Get request metadata
    const clientIpAddress = request.headers.get('x-forwarded-for') ||
                           request.headers.get('x-real-ip') ||
                           undefined;
    const clientUserAgent = request.headers.get('user-agent') || undefined;

    // Get Facebook cookies
    const cookies = request.cookies;
    const fbp = cookies.get('_fbp')?.value;
    const fbc = cookies.get('_fbc')?.value;

    // Get referrer URL
    const eventUrl = request.headers.get('referer') || undefined;

    const requestData = {
      clientIpAddress,
      clientUserAgent,
      fbp,
      fbc,
      eventUrl
    };

    // Route to appropriate tracking function
    switch (eventName) {
      case 'Lead':
        await trackLeadConversion(userData, customData, requestData);
        break;
      case 'CompleteRegistration':
        await trackCompleteRegistration(userData, customData, requestData);
        break;
      default:
        // For other events, use generic tracking
        const { trackServerEvent } = await import('@/lib/tracking/meta-capi');
        await trackServerEvent(eventName, { ...userData, ...requestData }, customData, eventUrl);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in track API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
import crypto from 'crypto';

// Meta Conversions API configuration
const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CONVERSIONS_API_ACCESS_TOKEN;
const CAPI_GATEWAY_URL = process.env.META_CAPI_GATEWAY_URL;

// Helper to hash PII data for CAPI
function hashData(data: string): string {
  if (!data) return '';
  return crypto
    .createHash('sha256')
    .update(data.toLowerCase().trim())
    .digest('hex');
}

// Server-side event tracking for Meta Conversions API
export async function trackServerEvent(
  eventName: string,
  userData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    zipCode?: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
    fbp?: string; // Facebook browser ID (_fbp cookie)
    fbc?: string; // Facebook click ID (_fbc cookie or fbclid param)
  },
  customData?: Record<string, any>,
  eventUrl?: string
) {
  // Skip if no configuration
  if (!PIXEL_ID || (!ACCESS_TOKEN && !CAPI_GATEWAY_URL)) {
    console.log('Meta CAPI not configured - skipping server event');
    return;
  }

  try {
    // Build event data
    const eventData = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: eventUrl || process.env.NEXT_PUBLIC_SITE_URL,
      action_source: 'website',
      user_data: {
        ...(userData.email && { em: hashData(userData.email) }),
        ...(userData.phone && { ph: hashData(userData.phone) }),
        ...(userData.firstName && { fn: hashData(userData.firstName) }),
        ...(userData.lastName && { ln: hashData(userData.lastName) }),
        ...(userData.zipCode && { zp: hashData(userData.zipCode) }),
        ...(userData.clientIpAddress && { client_ip_address: userData.clientIpAddress }),
        ...(userData.clientUserAgent && { client_user_agent: userData.clientUserAgent }),
        ...(userData.fbp && { fbp: userData.fbp }),
        ...(userData.fbc && { fbc: userData.fbc })
      },
      ...(customData && { custom_data: customData })
    };

    // Send to CAPI Gateway if configured
    if (CAPI_GATEWAY_URL) {
      const response = await fetch(`${CAPI_GATEWAY_URL}/capi/${PIXEL_ID}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [eventData]
        })
      });

      if (!response.ok) {
        console.error('CAPI Gateway error:', await response.text());
      } else {
        console.log(`Event '${eventName}' sent to CAPI Gateway`);
      }
    }
    // Direct API call if access token is available
    else if (ACCESS_TOKEN) {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${PIXEL_ID}/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: [eventData],
            access_token: ACCESS_TOKEN
          })
        }
      );

      if (!response.ok) {
        console.error('Meta CAPI error:', await response.text());
      } else {
        console.log(`Event '${eventName}' sent to Meta CAPI`);
      }
    }
  } catch (error) {
    console.error('Error sending event to Meta CAPI:', error);
  }
}

// Track lead conversion server-side
export async function trackLeadConversion(
  userData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    zipCode?: string;
  },
  customData?: {
    value?: number;
    currency?: string;
    indication?: string;
    cancerType?: string;
    stage?: string;
    [key: string]: any;
  },
  requestData?: {
    clientIpAddress?: string;
    clientUserAgent?: string;
    fbp?: string;
    fbc?: string;
    eventUrl?: string;
  }
) {
  await trackServerEvent(
    'Lead',
    {
      ...userData,
      ...requestData
    },
    {
      value: customData?.value || 100,
      currency: customData?.currency || 'USD',
      ...customData
    },
    requestData?.eventUrl
  );
}

// Track complete registration server-side
export async function trackCompleteRegistration(
  userData: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    zipCode?: string;
  },
  customData?: {
    value?: number;
    currency?: string;
    status?: string;
    [key: string]: any;
  },
  requestData?: {
    clientIpAddress?: string;
    clientUserAgent?: string;
    fbp?: string;
    fbc?: string;
    eventUrl?: string;
  }
) {
  await trackServerEvent(
    'CompleteRegistration',
    {
      ...userData,
      ...requestData
    },
    {
      value: customData?.value || 150,
      currency: customData?.currency || 'USD',
      status: 'completed',
      ...customData
    },
    requestData?.eventUrl
  );
}
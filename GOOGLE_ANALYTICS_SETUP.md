# 📊 Complete Google Analytics Setup Guide for Clinical Trials Funnel

> **✅ UPDATE**: This project now uses the official `@next/third-parties` package for Google Analytics integration. The implementation has been modernized with automatic UTM tracking, enhanced conversions, and a unified analytics provider system.

## 🎯 Overview
This guide provides comprehensive setup for Google Analytics 4 (GA4) tracking aligned with your GOAL.md conversion metrics:
- **CTR ≥ 5%** (Google Ads)
- **LP→Quiz Start ≥ 25%**
- **Quiz Completion ≥ 60%**
- **Opt-in ≥ 40%**
- **Cost per Quiz Complete** (North Star metric)

---

## 📋 Table of Contents
1. [GA4 Account Setup](#1-ga4-account-setup)
2. [Implementation in Code](#2-implementation-in-code)
3. [Event Tracking Setup](#3-event-tracking-setup)
4. [Google Ads Integration](#4-google-ads-integration)
5. [Conversion Tracking](#5-conversion-tracking)
6. [UTM Parameter Tracking](#6-utm-parameter-tracking)
7. [Testing & Debugging](#7-testing--debugging)
8. [Reports & Dashboard](#8-reports--dashboard)

---

## 1. GA4 Account Setup

### Step 1: Create GA4 Property
1. Go to [Google Analytics](https://analytics.google.com)
2. Click **Admin** (gear icon bottom left)
3. Click **Create Property**
4. Enter property name: "OncoBot Clinical Trials Funnel"
5. Select your timezone and currency
6. Industry: Healthcare
7. Business size: Select appropriate
8. Business objectives: Check:
   - Generate leads
   - Examine user behavior

### Step 2: Get Measurement ID
1. In GA4 property → **Data Streams**
2. Click **Add stream** → **Web**
3. Enter:
   - Website URL: `https://onco.bot` (or your domain)
   - Stream name: "Production"
4. Copy the **Measurement ID** (starts with G-)
   ```
   Example: G-XXXXXXXXXX
   ```

### Step 3: Add to Environment Variables
```bash
# .env.local
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

---

## 2. Implementation in Code

### ✅ Modern Implementation with @next/third-parties (Current)

#### Installation
```bash
pnpm add @next/third-parties
```

#### Key Components

**1. GoogleAnalyticsProvider** (`components/analytics/google-analytics-provider.tsx`):
- Wraps application with GA4 tracking
- Automatically tracks page views
- Persists UTM parameters across session
- Provides enhanced tracking functions:
  - `sendGAEventEnhanced()` - Send events with auto-attached UTM params
  - `trackFunnelEvent()` - Track funnel-specific events
  - `trackConversion()` - Track conversions for Google Ads
  - `trackEnhancedConversion()` - Track with hashed PII

**2. Unified Analytics System**:
- Single interface for GA4, PostHog, and Plausible
- Automatic event distribution to all platforms
- Consistent event naming and properties

#### Layout Integration
In `app/eligibility/layout.tsx`:
```tsx
import { GoogleAnalyticsProvider } from '@/components/analytics/google-analytics-provider';

export default function FunnelLayout({ children }) {
  return (
    <>
      <FunnelHeader />
      <GoogleAnalyticsProvider>
        {children}
      </GoogleAnalyticsProvider>
    </>
  );
}
```

### Legacy Implementation (Deprecated)

The old implementation used manual script tags:
```typescript
// Google Analytics tracking functions
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID!, {
      page_path: url,
    });
  }
};

// Track custom events
export const event = ({
  action,
  category,
  label,
  value,
  ...parameters
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
  [key: string]: any;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...parameters,
    });
  }
};

// Track quiz funnel events (aligned with GOAL.md)
export const trackQuizEvent = (eventName: string, data: Record<string, any> = {}) => {
  event({
    action: eventName,
    category: 'Quiz Funnel',
    ...data,
  });
};

// Track conversions for Google Ads
export const trackConversion = (conversionLabel: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: `${GA_TRACKING_ID}/${conversionLabel}`,
      value: value || 0,
      currency: 'USD',
    });
  }
};
```

### Enhanced Quiz Tracking Implementation

Update `/app/eligibility/[indication]/quiz/page.tsx`:
```typescript
import { trackQuizEvent, trackConversion } from '@/lib/analytics/google-analytics';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function QuizPage() {
  const searchParams = useSearchParams();
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  
  // Capture UTM parameters on mount
  useEffect(() => {
    const utmParams = {
      utm_source: searchParams.get('utm_source') || '',
      utm_medium: searchParams.get('utm_medium') || '',
      utm_campaign: searchParams.get('utm_campaign') || '',
      utm_term: searchParams.get('utm_term') || '',
      utm_content: searchParams.get('utm_content') || '',
    };
    
    // Track quiz view with UTM parameters
    trackQuizEvent('quiz_view', {
      indication,
      ...utmParams,
    });
    
    // Store quiz start time for duration tracking
    setQuizStartTime(Date.now());
  }, []);
  
  // Track quiz start (first interaction)
  const handleQuizStart = () => {
    trackQuizEvent('quiz_start', {
      indication,
      step: 1,
    });
    
    // Track for Google Ads
    trackConversion('QUIZ_START_CONVERSION_LABEL');
  };
  
  // Track step completion
  const handleStepComplete = (step: number) => {
    trackQuizEvent('step_complete', {
      indication,
      step,
      time_on_step: Date.now() - quizStartTime,
    });
  };
  
  // Track quiz submission
  const handleSubmit = async () => {
    const quizDuration = Math.round((Date.now() - quizStartTime) / 1000);
    
    // Track completion with all data
    trackQuizEvent('quiz_complete', {
      indication,
      stage: quizData.stage,
      biomarkers: quizData.biomarkers,
      prior_therapy: quizData.priorTherapy,
      quiz_duration_seconds: quizDuration,
      utm_source: searchParams.get('utm_source') || '',
      utm_campaign: searchParams.get('utm_campaign') || '',
    });
    
    // Track conversion for Google Ads (most important!)
    trackConversion('QUIZ_COMPLETE_CONVERSION_LABEL', 100);
    
    // Your existing submission logic...
  };
}
```

---

## 3. Event Tracking Setup

### Core Events to Track (Based on GOAL.md)

| Event Name | Trigger | Parameters | Purpose |
|------------|---------|------------|---------|
| `page_view` | Every page load | page_path, page_title | Track navigation |
| `quiz_view` | Quiz page loads | indication, utm_* | Track funnel entry |
| `quiz_start` | First field interaction | indication, step | LP→Quiz conversion |
| `step_complete` | Each step done | step, time_on_step | Identify drop-offs |
| `quiz_complete` | Final submission | all_fields, duration | Main conversion |
| `lead_submitted` | CRM submission | lead_score, indication | Lead quality |

### Implementation in GA4 Console

1. Go to **Configure** → **Events**
2. Click **Create event** for each:

#### Quiz Start Event
- Name: `quiz_start_conversion`
- Matching conditions:
  - `event_name equals quiz_start`
- Mark as conversion ✓

#### Quiz Complete Event
- Name: `quiz_complete_conversion`
- Matching conditions:
  - `event_name equals quiz_complete`
- Mark as conversion ✓

---

## 4. Google Ads Integration

### Link Google Ads Account
1. In GA4 → **Admin** → **Product Links**
2. Click **Google Ads Linking**
3. Click **Link**
4. Select your Google Ads account
5. Configure settings:
   - Enable auto-tagging ✓
   - Enable personalized advertising ✓
   - Enable conversion import ✓

### Import Conversions to Google Ads
1. In Google Ads → **Tools** → **Conversions**
2. Click **+** → **Import** → **Google Analytics 4**
3. Select:
   - `quiz_start_conversion`
   - `quiz_complete_conversion`
4. Set attribution model: **Data-driven**
5. Set conversion window: **30 days**

### Create Audiences for Remarketing
1. In GA4 → **Configure** → **Audiences**
2. Create audiences:

**High-Intent Users** (didn't complete quiz):
- Include: `quiz_start` event
- Exclude: `quiz_complete` event
- Membership duration: 30 days

**Qualified Leads** (completed quiz):
- Include: `quiz_complete` event
- Condition: `lead_score > 70`

---

## 5. Conversion Tracking

### Enhanced Conversion Setup (for better matching)
1. In GA4 → **Admin** → **Data Streams** → Select stream
2. Click **Configure tag settings**
3. Enable **Enhanced conversions**
4. Add user data fields:
   ```javascript
   gtag('config', 'G-XXXXXXXXXX', {
     'user_data': {
       'email': hashedEmail, // SHA256 hash
       'phone_number': hashedPhone, // E.164 format
       'address': {
         'postal_code': zipCode
       }
     }
   });
   ```

### Implement Enhanced Conversions in Code:
```typescript
// utils/analytics-helpers.ts
import crypto from 'crypto';

export const hashEmail = (email: string): string => {
  return crypto
    .createHash('sha256')
    .update(email.toLowerCase().trim())
    .digest('hex');
};

export const formatPhoneE164 = (phone: string): string => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  // Add country code if missing
  return cleaned.startsWith('1') ? `+${cleaned}` : `+1${cleaned}`;
};

// In your submission handler:
const enhancedData = {
  email_hash: hashEmail(quizData.email),
  phone_number: formatPhoneE164(quizData.phone),
  postal_code: quizData.zipCode,
};

trackConversion('QUIZ_COMPLETE', 100, enhancedData);
```

---

## 6. UTM Parameter Tracking

### URL Structure for Google Ads
```
https://onco.bot/eligibility/lung?
  utm_source=google&
  utm_medium=cpc&
  utm_campaign=lung-cancer-trials&
  utm_term={keyword}&
  utm_content=ad-variant-a
```

### Capture and Store UTM Parameters:
```typescript
// hooks/useUTMTracking.ts
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export const useUTMTracking = () => {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Store in sessionStorage for later use
    const utmData = {
      source: searchParams.get('utm_source') || '',
      medium: searchParams.get('utm_medium') || '',
      campaign: searchParams.get('utm_campaign') || '',
      term: searchParams.get('utm_term') || '',
      content: searchParams.get('utm_content') || '',
      gclid: searchParams.get('gclid') || '', // Google Click ID
      timestamp: new Date().toISOString(),
    };
    
    if (utmData.source) {
      sessionStorage.setItem('utm_data', JSON.stringify(utmData));
    }
  }, [searchParams]);
  
  return JSON.parse(sessionStorage.getItem('utm_data') || '{}');
};
```

### Pass UTM to GoHighLevel:
```typescript
// In your API route
const utmData = JSON.parse(body.utmData || '{}');

customFields: [
  // ... existing fields
  { key: 'utm_source', value: utmData.source || '' },
  { key: 'utm_medium', value: utmData.medium || '' },
  { key: 'utm_campaign', value: utmData.campaign || '' },
  { key: 'utm_term', value: utmData.term || '' },
  { key: 'utm_content', value: utmData.content || '' },
  { key: 'gclid', value: utmData.gclid || '' },
]
```

---

## 7. Testing & Debugging

### GA4 DebugView
1. Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) Chrome extension
2. Enable debug mode in code:
   ```javascript
   gtag('config', 'G-XXXXXXXXXX', {
     'debug_mode': true
   });
   ```
3. Go to GA4 → **Configure** → **DebugView**
4. Test your funnel and watch events in real-time

### Google Tag Assistant
1. Install [Tag Assistant Legacy](https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/kejbdjndbnbjgmefkgdddjlbokphdefk)
2. Navigate to your site
3. Click extension icon → **Enable** → **Record**
4. Complete quiz flow
5. Review all tracked events

### Test Checklist
- [ ] Page view tracking on all pages
- [ ] Quiz view event fires with UTM parameters
- [ ] Quiz start fires on first interaction
- [ ] Step completion tracks all 3 steps
- [ ] Quiz complete includes all data
- [ ] Conversion tracking to Google Ads works
- [ ] Enhanced conversions data is hashed
- [ ] UTM parameters persist through funnel

---

## 8. Reports & Dashboard

### Custom Reports for GOAL.md Metrics

#### 1. Funnel Analysis Report
1. Go to **Explore** → **Funnel exploration**
2. Add steps:
   - Step 1: `page_view` (landing page)
   - Step 2: `quiz_view`
   - Step 3: `quiz_start`
   - Step 4: `quiz_complete`
3. Add breakdown: `utm_campaign`
4. This shows your LP→Quiz→Complete funnel

#### 2. Cost per Quiz Complete
1. Link Google Ads (done above)
2. Go to **Reports** → **Acquisition** → **Traffic acquisition**
3. Add secondary dimension: **Session google ads campaign**
4. Add metric: **Conversions**
5. Calculate: Cost / Quiz Completes

#### 3. Real-time Monitoring Dashboard
Create custom dashboard with:
- Active users by page
- Quiz funnel in last 30 minutes
- Conversion rate by source
- Drop-off by step
- Average quiz completion time

### Key Metrics to Monitor Daily
1. **LP → Quiz Start Rate** (Target: ≥25%)
2. **Quiz Completion Rate** (Target: ≥60%)
3. **Cost per Quiz Complete** (Optimize daily)
4. **Lead Quality Score Distribution**
5. **Time to Complete Quiz** (Optimize if >3 min)

---

## 🚀 Implementation Checklist

### Week 1: Basic Setup
- [ ] Create GA4 property
- [ ] Add measurement ID to .env
- [ ] Implement basic page tracking
- [ ] Set up quiz events
- [ ] Test in DebugView

### Week 2: Conversions & Ads
- [ ] Link Google Ads account
- [ ] Create conversion events
- [ ] Import to Google Ads
- [ ] Set up enhanced conversions
- [ ] Test conversion tracking

### Week 3: Optimization
- [ ] Create audiences
- [ ] Build custom reports
- [ ] Set up alerts
- [ ] A/B test tracking
- [ ] Performance monitoring

---

## 📞 Support Resources

- [GA4 Documentation](https://support.google.com/analytics/answer/9304153)
- [Google Ads Conversion Import](https://support.google.com/google-ads/answer/9888656)
- [Enhanced Conversions Guide](https://support.google.com/google-ads/answer/11062876)
- [UTM Builder Tool](https://ga-dev-tools.web.app/campaign-url-builder/)

---

## 🔴 Critical Success Factors

1. **Test Everything**: Use DebugView before launching campaigns
2. **Track UTM Parameters**: Essential for attribution
3. **Monitor Daily**: Check funnel metrics every day
4. **Optimize Continuously**: Use data to improve CTR and completion rates
5. **Privacy Compliance**: Always hash PII data

Remember: **Cost per Quiz Complete** is your North Star metric - optimize everything toward reducing this number while maintaining lead quality!
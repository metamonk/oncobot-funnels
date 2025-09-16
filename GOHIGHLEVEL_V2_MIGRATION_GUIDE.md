# GoHighLevel V2 API Migration Guide

## Current Situation (September 2025)

Your current setup uses a **Location API token (Private Integration)** which only works with the V1 API. Since V1 is being deprecated, you need to migrate to V2 API with OAuth 2.0.

## Account Type Analysis

### Your Current Setup
- **Token Type**: Location API token (JWT)
- **API Access**: V1 only (`https://rest.gohighlevel.com/v1/`)
- **Account Level**: Agency account (not Pro)
- **Limitation**: Cannot create opportunities directly via API

### What You Need for V2 API
1. **OAuth 2.0 Integration** instead of static JWT tokens
2. **Agency Pro account** ($497/month) for advanced API features
3. **App registration** in GoHighLevel marketplace

## Immediate Solution: Enhanced V1 Categorization

While you plan the V2 migration, here's how to better categorize leads with V1:

### 1. Enhanced Tagging System
```javascript
// Patient Lead Tags
tags: [
  'lead_type:patient',
  'funnel:patient_eligibility',
  'stage:new_lead',
  'indication:lung',
  'urgency:high', // Based on stage/condition
  'location:california',
  'created:2025-09-14'
]

// Site Lead Tags  
tags: [
  'lead_type:site',
  'funnel:site_membership',
  'stage:interested',
  'volume:50-100',
  'location:new_york',
  'created:2025-09-14'
]
```

### 2. Custom Fields for Better Tracking
```javascript
customFields: {
  // Common fields
  leadType: 'patient', // or 'site'
  funnelSource: 'eligibility_quiz',
  leadScore: calculateLeadScore(data),
  nurtureStage: 'awareness', // awareness -> consideration -> decision
  
  // Patient-specific
  urgencyLevel: 'high',
  trialReadiness: 'immediate',
  
  // Site-specific
  siteCapacity: '50-100',
  decisionTimeframe: '30_days'
}
```

### 3. Workflow Triggers
Set up these workflows in GoHighLevel dashboard:
- **New Patient Lead**: Auto-assign to patient coordinator
- **New Site Lead**: Auto-assign to partnership team
- **High-Value Lead**: Immediate notification + fast-track nurture

## V2 API Migration Path

### Step 1: Create OAuth App (Immediate)
1. Go to GoHighLevel Marketplace
2. Create a new app
3. Select "Private App" for internal use
4. Configure OAuth scopes:
   - `contacts.write`
   - `opportunities.write`
   - `pipelines.readonly`

### Step 2: Implement OAuth Flow
```javascript
// OAuth configuration
const OAUTH_CONFIG = {
  clientId: process.env.GHL_CLIENT_ID,
  clientSecret: process.env.GHL_CLIENT_SECRET,
  redirectUri: 'https://yourapp.com/api/gohighlevel/callback',
  authUrl: 'https://marketplace.gohighlevel.com/oauth/authorize',
  tokenUrl: 'https://services.leadconnectorhq.com/oauth/token'
};

// Get access token
async function getAccessToken(code: string) {
  const response = await fetch(OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: OAUTH_CONFIG.clientId,
      client_secret: OAUTH_CONFIG.clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: OAUTH_CONFIG.redirectUri,
    }),
  });
  
  return response.json();
}
```

### Step 3: Create Opportunities with V2
```javascript
// V2 API - Create contact with opportunity
async function createContactWithOpportunity(data: any) {
  // First create contact
  const contactResponse = await fetch('https://services.leadconnectorhq.com/contacts/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Version': '2021-04-15',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      locationId: GHL_CONFIG.locationId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      tags: data.tags,
      customFields: data.customFields,
    }),
  });
  
  const contact = await contactResponse.json();
  
  // Then create opportunity
  const opportunityResponse = await fetch('https://services.leadconnectorhq.com/opportunities/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Version': '2021-04-15',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      locationId: GHL_CONFIG.locationId,
      contactId: contact.contact.id,
      pipelineId: data.pipelineId,
      pipelineStageId: data.stageId,
      name: `${data.firstName} - ${data.indication}`,
      status: 'open',
      monetaryValue: calculateValue(data),
    }),
  });
  
  return opportunityResponse.json();
}
```

## Pipeline Structure Recommendation

### For Patient Leads
**Pipeline**: Patient Journey
1. **New Lead** - Just submitted quiz
2. **Qualified** - Meets trial criteria
3. **Contacted** - Initial outreach made
4. **Interested** - Expressed interest
5. **Scheduled** - Consultation booked
6. **Enrolled** - Enrolled in trial

### For Site Leads
**Pipeline**: Site Partnership
1. **Inquiry** - Initial contact
2. **Qualified** - Meets partnership criteria
3. **Demo Scheduled** - Product demo booked
4. **Proposal Sent** - Terms discussed
5. **Negotiation** - Contract terms
6. **Closed Won/Lost** - Partnership decision

## Action Items

### Immediate (This Week)
1. ✅ Enhance V1 tagging for better categorization
2. ✅ Add lead scoring custom fields
3. ✅ Set up automated workflows in GoHighLevel

### Short-term (Next Month)
1. Register OAuth app in GoHighLevel marketplace
2. Test OAuth flow in development
3. Create pipeline structures in GoHighLevel dashboard

### Long-term (Next Quarter)
1. Fully migrate to V2 API with OAuth
2. Implement opportunity creation
3. Build pipeline automation
4. Consider upgrading to Agency Pro if needed

## Cost-Benefit Analysis

### Staying with V1 (Current)
- **Cost**: $297/month (current plan)
- **Limitation**: No API opportunity creation
- **Risk**: V1 deprecation

### Upgrading to Agency Pro
- **Cost**: $497/month
- **Benefits**: 
  - Full V2 API access
  - Opportunity API endpoints
  - Advanced automation
  - White-label options

### Recommendation
Start with enhanced V1 categorization immediately, then evaluate if the $200/month increase is justified based on your lead volume and automation needs.
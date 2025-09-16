# GoHighLevel V2 API Setup Instructions

## 🚨 IMPORTANT: Your Current Token is V1
Your current JWT token only works with V1 API (`rest.gohighlevel.com`). To use V2 API (`services.leadconnectorhq.com`), you need to create a NEW Private Integration token.

## Step 1: Create a Private Integration Token (V2)

1. **Log into GoHighLevel** with your agency account
2. **Navigate to**: Settings → Integrations → Private Integration
3. **Click**: "Create Private Integration" 
4. **Configure**:
   - Name: "Oncobot Funnel System V2"
   - Description: "Clinical trials funnel lead capture"
   - Scopes needed:
     - `contacts.write` - Create and update contacts
     - `contacts.readonly` - Read contact data
     - `opportunities.write` - Create opportunities
     - `pipelines.readonly` - Read pipeline data
     - `locations.readonly` - Read location data
5. **Generate Token**: Copy the new token (it will start with `Bearer` or be a longer JWT)
6. **Update .env**: Set `GHL_INTEGRATION_TOKEN` with the new V2 token

## Step 2: Set Up Pipelines in GoHighLevel

Before we can create opportunities via API, you need to set up pipelines:

### Patient Pipeline
1. Go to: Opportunities → Pipelines
2. Create Pipeline: "Patient Journey"
3. Add Stages:
   - **New Lead** (Initial contact)
   - **Screening** (Eligibility review)
   - **Qualified** (Meets criteria)
   - **Contacted** (Outreach made)
   - **Scheduled** (Consultation booked)
   - **Enrolled** (In trial)
   - **Not Qualified** (Doesn't meet criteria)

### Site Pipeline  
1. Create Pipeline: "Site Partnership"
2. Add Stages:
   - **Inquiry** (Initial interest)
   - **Qualified** (Meets requirements)
   - **Demo Scheduled** (Product demo)
   - **Proposal** (Terms sent)
   - **Negotiation** (Contract discussion)
   - **Won** (Partnership signed)
   - **Lost** (No partnership)

### Get Pipeline IDs
After creating, you need the pipeline and stage IDs:

```bash
# Once you have the new V2 token, run this to get pipeline IDs:
curl -X GET "https://services.leadconnectorhq.com/opportunities/pipelines?locationId=7qrG3oKzkJyRQ5GDihMI" \
  -H "Authorization: Bearer YOUR_NEW_V2_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Content-Type: application/json"
```

## Step 3: Update Environment Variables

Add these to your `.env` file:

```bash
# GoHighLevel V2 API Configuration
GHL_INTEGRATION_TOKEN=YOUR_NEW_V2_PRIVATE_INTEGRATION_TOKEN
GHL_LOCATION_ID=7qrG3oKzkJyRQ5GDihMI

# Pipeline IDs (get these after creating pipelines)
GHL_PATIENT_PIPELINE_ID=your_patient_pipeline_id
GHL_PATIENT_STAGE_NEW_LEAD=your_new_lead_stage_id
GHL_PATIENT_STAGE_QUALIFIED=your_qualified_stage_id

GHL_SITE_PIPELINE_ID=your_site_pipeline_id  
GHL_SITE_STAGE_INQUIRY=your_inquiry_stage_id
GHL_SITE_STAGE_QUALIFIED=your_site_qualified_stage_id
```

## What Changes When You Get the V2 Token

Once you have the V2 Private Integration token, I'll implement:

1. **V2 API Integration** (`/app/api/gohighlevel/v2/route.ts`)
   - Create contacts with full data
   - Create opportunities automatically
   - Assign to correct pipeline/stage

2. **Lead Categorization**
   - Patient leads → Patient Pipeline
   - Site leads → Site Pipeline
   - Automatic stage assignment based on data

3. **Lead Scoring**
   - Calculate lead value based on criteria
   - Priority assignment
   - Automated nurture triggers

## Testing Your New V2 Token

Once you have the new token, test it:

```bash
# Test creating a contact
curl -X POST "https://services.leadconnectorhq.com/contacts/" \
  -H "Authorization: Bearer YOUR_NEW_V2_TOKEN" \
  -H "Version: 2021-07-28" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "V2",
    "email": "test@example.com",
    "phone": "+15551234567",
    "locationId": "7qrG3oKzkJyRQ5GDihMI"
  }'
```

If this returns a contact ID, your V2 token is working!

## Next Steps

1. **Get your V2 Private Integration token** from GoHighLevel
2. **Create the pipelines** in your GoHighLevel account
3. **Share the token and pipeline IDs** with me
4. I'll implement the complete V2 integration

## Why V2 is Better

- **Opportunities**: Automatically creates deals in your pipeline
- **Better Tracking**: See leads move through stages
- **Automation**: Trigger workflows based on stage changes
- **Reporting**: Pipeline value and conversion metrics
- **Future-Proof**: V1 is deprecated as of Sept 2025
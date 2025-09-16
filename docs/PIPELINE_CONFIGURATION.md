# GoHighLevel Pipeline Configuration Guide

## Recommended Pipeline Stages

### Patient Journey Pipeline
For patient leads from the eligibility quiz:

1. **New Lead** - Initial contact captured from quiz
2. **Pre-Screening** - Basic eligibility check in progress  
3. **Qualified** - Meets basic trial criteria
4. **Site Matched** - Matched with specific trial site(s)
5. **Contacted** - Site has reached out to patient
6. **Scheduled** - Appointment/screening visit scheduled
7. **Enrolled** - Successfully enrolled in trial
8. **Not Qualified** - Doesn't meet criteria or declined

### Site Partnership Pipeline  
For clinical sites interested in partnership:

1. **Inquiry** - Initial site interest from booking form
2. **Qualified** - Meets partnership criteria
3. **Demo Scheduled** - Product demo booked
4. **Proposal Sent** - Partnership proposal delivered
5. **Negotiation** - Terms being discussed
6. **Contract Signed** - Agreement finalized
7. **Onboarded** - Site fully integrated and active
8. **Lost** - Partnership declined or failed

## Environment Variables

After creating the pipelines in GoHighLevel, add these to your `.env` file:

```bash
# Patient Journey Pipeline
GHL_PATIENT_PIPELINE_ID=your_patient_pipeline_id
GHL_PATIENT_STAGE_NEW_LEAD=stage_id
GHL_PATIENT_STAGE_PRESCREENING=stage_id
GHL_PATIENT_STAGE_QUALIFIED=stage_id
GHL_PATIENT_STAGE_SITE_MATCHED=stage_id
GHL_PATIENT_STAGE_CONTACTED=stage_id
GHL_PATIENT_STAGE_SCHEDULED=stage_id
GHL_PATIENT_STAGE_ENROLLED=stage_id
GHL_PATIENT_STAGE_NOT_QUALIFIED=stage_id

# Site Partnership Pipeline
GHL_SITE_PIPELINE_ID=your_site_pipeline_id
GHL_SITE_STAGE_INQUIRY=stage_id
GHL_SITE_STAGE_QUALIFIED=stage_id
GHL_SITE_STAGE_DEMO_SCHEDULED=stage_id
GHL_SITE_STAGE_PROPOSAL_SENT=stage_id
GHL_SITE_STAGE_NEGOTIATION=stage_id
GHL_SITE_STAGE_CONTRACT_SIGNED=stage_id
GHL_SITE_STAGE_ONBOARDED=stage_id
GHL_SITE_STAGE_LOST=stage_id
```

## Automatic Opportunity Creation

The system automatically creates opportunities when:
- A new contact is created via the eligibility quiz or booking form
- The pipeline IDs are properly configured in the environment
- Opportunities are placed in the appropriate initial stage based on lead quality

### Lead Scoring and Stage Placement

**Patient Leads:**
- High Score (80+): May skip to "Qualified" stage if they have advanced cancer + biomarkers/prior therapy
- Medium Score (60-79): Starts at "Pre-Screening" 
- Low Score (<60): Starts at "New Lead"

**Site Leads:**
- High Volume (100+ patients/month): Starts at "Qualified"
- Medium Volume (20-100): Starts at "Inquiry"
- Low Volume (<20): Starts at "Inquiry"

## Setup Instructions

1. Log into GoHighLevel
2. Navigate to Opportunities → Pipelines
3. Create "Patient Journey" pipeline with the 8 stages listed above
4. Create "Site Partnership" pipeline with the 8 stages listed above
5. Copy the pipeline IDs and stage IDs
6. Add them to your `.env` file
7. Restart your development server

The system will now automatically create opportunities for all new leads!
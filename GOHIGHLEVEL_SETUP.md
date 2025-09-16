# GoHighLevel Integration Setup

## Overview
This funnel system integrates with GoHighLevel (GHL) for lead management and CRM functionality. We use the **GoHighLevel API v1** with Location API tokens (Private Integration).

## API Version
**Using: GoHighLevel API v1** (Location API tokens - not OAuth)
**Endpoint**: `https://rest.gohighlevel.com/v1/contacts/`
**Authentication**: Bearer token (JWT)

## Current Configuration Status

### ✅ What's Working:
- API key is configured and valid
- Location ID is set
- Fallback error handling implemented
- Lead data structure defined

### ⚠️ Issue Fixed:
- Removed invalid webhook URL placeholder
- Implemented proper API v2 contact creation
- Added validation to prevent invalid URL errors

## Environment Variables

Add these to your `.env` or `.env.local` file:

```bash
# GoHighLevel API Configuration
GHL_INTEGRATION_TOKEN=your_v2_integration_token_here
GHL_LOCATION_ID=your_location_id_here
GHL_WEBHOOK_URL=  # Optional: Leave empty to use API directly
```

### Current Values:
- **API Key**: ✅ Working (JWT token valid as of 2025-09-14)
- **Location ID**: ✅ Configured (`7qrG3oKzkJyRQ5GDihMI`)
- **Webhook URL**: ❌ Not needed (using API v1 directly)

## How It Works

### 1. Lead Submission Flow
```
User fills form → Our API → GoHighLevel API v1 → Contact created in GHL
```

### 2. Data Mapping

#### Patient Lead (from quiz):
```javascript
{
  firstName: "Patient",
  lastName: "[From form or 'Lead']",
  email: "patient@email.com",
  phone: "+1234567890",
  tags: ["eligibility-quiz", "lung-cancer"],
  customFields: {
    zipCode: "12345",
    condition: "lung",
    stage: "Stage 3",
    biomarkers: "EGFR+",
    priorTherapy: "chemotherapy"
  }
}
```

#### Site Lead (from membership booking):
```javascript
{
  firstName: "[Contact name]",
  lastName: "[From company]",
  email: "contact@company.com",
  phone: "+1234567890",
  tags: ["membership-inquiry", "clinical-site"],
  customFields: {
    companyName: "Hospital Name",
    siteLocation: "New York, NY",
    monthlyVolume: "50-100",
    selectedTime: "Monday 2PM EST"
  }
}
```

## API Endpoints Used

### Create Contact (API v1)
- **Endpoint**: `https://rest.gohighlevel.com/v1/contacts/`
- **Method**: POST
- **Headers**:
  ```
  Authorization: Bearer [API_KEY]
  Content-Type: application/json
  ```
- **Note**: No Version header required for v1 API with Location tokens

## Testing the Integration

### 1. Test Lead Submission
```bash
curl -X POST http://localhost:3000/api/gohighlevel/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "555-0100",
    "zipCode": "10001",
    "condition": "lung",
    "stage": "Stage 3",
    "source": "eligibility_quiz",
    "indication": "lung",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'
```

### 2. Check Response
- **Success**: Returns `{ "success": true, "message": "Lead submitted successfully" }`
- **Error**: Check console logs for detailed error messages

## Troubleshooting

### Common Issues:

1. **"version header was not found" Error**
   - This occurs when using v2 endpoint without Version header
   - **Fixed**: Now using v1 API endpoint which doesn't require Version header

2. **"Invalid JWT" Error**
   - API key has expired - regenerate in GoHighLevel settings
   - Make sure you're using a Location API token (not OAuth)
   - Verify the token is for the correct location ID

3. **"Contact already exists" Error**
   - This is normal - GHL prevents duplicates by email
   - The system continues to work normally

## GoHighLevel Dashboard

### View Leads:
1. Log into GoHighLevel
2. Navigate to Contacts
3. Filter by tags: "eligibility-quiz" or "membership-inquiry"
4. Check custom fields for patient/site details

### Automation Setup (Optional):
1. Create workflow triggered by tag "eligibility-quiz"
2. Add actions:
   - Send welcome email
   - Assign to team member
   - Create task for follow-up
   - Add to nurture campaign

## Security Notes

- ✅ API key is stored in environment variables
- ✅ Never commit API keys to git
- ✅ Lead submission continues even if GHL is down (graceful degradation)
- ✅ All data is validated before sending to GHL

## Next Steps

1. **Test the integration** with real form submissions
2. **Set up workflows** in GoHighLevel for automated follow-up
3. **Configure custom fields** in GHL to match your needs
4. **Monitor leads** in the GHL dashboard

## Support Links

- [GoHighLevel API v2 Documentation](https://highlevel.stoplight.io/docs/integrations/)
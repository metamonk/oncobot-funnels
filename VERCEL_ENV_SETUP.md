# Vercel Environment Variables Setup

## Required Environment Variables for Production

Configure these environment variables in your Vercel project settings:

### 1. Email Service (Resend)
```
RESEND_API_KEY=re_dop7Xx9c_48JB6xDY5UQYveDwFM89Zyxd
EMAIL_FROM=OncoBot <noreply@oncobot.com>
CONTACT_EMAIL_TO=support@oncobot.com
```

### 2. GoHighLevel CRM Integration
```
# Main GoHighLevel V2 API Configuration
GHL_INTEGRATION_TOKEN=pit-b8535f02-478d-4f29-8004-52e74d4ee69c
GHL_LOCATION_ID=7qrG3oKzkJyRQ5GDihMI

# Patient Journey Pipeline (Required)
GHL_PATIENT_PIPELINE_ID=bt7TuKQ9ykG1gZrpHVN7
GHL_PATIENT_STAGE_NEW_LEAD=a21f7e26-cbcc-4f17-8f4f-d6a711c06d2e
GHL_PATIENT_STAGE_PRESCREENING=268bc870-1422-47fc-9498-be811aa4c2e7
GHL_PATIENT_STAGE_QUALIFIED=c06954a5-2067-47e9-a387-7e73eb060c38
GHL_PATIENT_STAGE_SITE_MATCHED=93169968-64e4-461d-b770-69c135c767e5
GHL_PATIENT_STAGE_CONTACTED=f33ecf2b-1f0a-4080-9812-2482887c4027
GHL_PATIENT_STAGE_SCHEDULED=eeac8bc9-c3b8-4cf4-8b33-7ca4eed47403
GHL_PATIENT_STAGE_ENROLLED=0e072651-a130-4679-877b-40d854a77977
GHL_PATIENT_STAGE_NOT_QUALIFIED=14802df1-a597-4bb0-b795-3a5b5bbd2739

# Site Partnership Pipeline (Required)
GHL_SITE_PIPELINE_ID=ReUwqkim2fiY8FBhcWYI
GHL_SITE_STAGE_INQUIRY=be6b8872-46a5-4552-850d-3a6ec2e4f2ef
GHL_SITE_STAGE_QUALIFIED=26bc4fbd-ad26-4a34-9fa9-51fd8a46ec7f
GHL_SITE_STAGE_DEMO_SCHEDULED=a07f7e29-7c26-4d70-83a6-5a4d33b631b2
GHL_SITE_STAGE_PROPOSAL_SENT=faac3792-e5a4-4f63-a777-b7a21261555c
GHL_SITE_STAGE_NEGOTIATION=89abd415-3fde-4c1b-9878-cfa5b695e66a
GHL_SITE_STAGE_CONTRACT_SIGNED=8aa845e0-d962-44c9-8f35-279cf1b6996f
GHL_SITE_STAGE_ONBOARDED=0fd7bb28-e660-4588-8639-eb62f1a9712b
GHL_SITE_STAGE_LOST=cc874a3c-fad3-4213-95d8-464b7c1ef255

# Support Pipeline (Optional - will fallback to Site Pipeline if not set)
GHL_SUPPORT_PIPELINE_ID=your_support_pipeline_id  # Replace with actual ID or leave as is
GHL_SUPPORT_STAGE_INQUIRY=your_inquiry_stage_id  # Replace with actual ID or leave as is
```

### 3. Authentication & Security
```
BETTER_AUTH_SECRET=pNshThwdx3OIcUJlnv5M+7a6p4+gcx+nEP/KCxZzf28=
```

### 4. Analytics (PostHog)
```
NEXT_PUBLIC_POSTHOG_KEY=phc_Iuw5hcoGZxHUgudQvn6fiFj2iRYUwn6sZSYHEamPf8q
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### 5. Database
```
DATABASE_URL=postgresql://neondb_owner:npg_vZmzea5gqIl9@ep-nameless-queen-addbdzv3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 6. AI Services (Optional - for enhanced features)
```
OPENAI_API_KEY=your_openai_api_key_here
```

### 7. Google OAuth (Optional - if enabling Google sign-in)
```
GOOGLE_CLIENT_ID=1040504102889-jab4dmmeqeahlvmv7u8q4aritffv2jme.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

## How to Add to Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with the following settings:
   - Environment: Production (and optionally Preview/Development)
   - Copy and paste the key and value from above
4. Click "Save" after adding all variables

## Verification

After deploying, verify the configuration by:

1. Checking the contact form health endpoint:
   ```bash
   curl https://your-domain.vercel.app/api/contact
   ```

   Expected response:
   ```json
   {
     "status": "ok",
     "integrations": {
       "resend": "configured",
       "gohighlevel": "configured"
     },
     "message": "Contact form is operational"
   }
   ```

2. Testing the contact form submission on production

## Troubleshooting

### Form Not Working
- Check that `RESEND_API_KEY` is set correctly
- Verify `GHL_INTEGRATION_TOKEN` is set (not `GHL_API_KEY`)
- Ensure `EMAIL_FROM` and `CONTACT_EMAIL_TO` are valid email addresses

### GoHighLevel Not Recording Leads
- Verify `GHL_LOCATION_ID` matches your GoHighLevel location
- Check that pipeline IDs and stage IDs are correct
- Test the token using the test script: `pnpm tsx scripts/test-v2-integration.ts`

### Environment Variable Not Loading
- Redeploy after adding/changing environment variables
- Check for typos in variable names
- Ensure no trailing spaces in values

## Security Notes

⚠️ **IMPORTANT**:
- Never commit these values to Git
- Keep API keys secure and rotate them regularly
- Use Vercel's built-in environment variable encryption
- Consider using different keys for production vs staging
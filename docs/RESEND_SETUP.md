# Resend Email Configuration Guide

## Current Setup
The system is using the verified domain `trials.onco.bot` for sending magic link emails.

## Production Setup - Domain Verification

The domain `trials.onco.bot` is already verified and configured. For additional domains:

### 1. Verify Domain in Resend
1. Log in to [Resend Dashboard](https://resend.com/domains)
2. Click "Add Domain"
3. Enter `onco.bot`
4. Add the DNS records shown in Resend to your domain provider

### 2. DNS Records Required
Resend will provide you with records similar to:
- **SPF Record**: TXT record for email authentication
- **DKIM Records**: For email signing
- **MX Record** (optional): If you want to receive emails

### 3. Update Environment Variables
Once domain is verified, update `.env`:
```env
EMAIL_FROM=OncoBot <noreply@trials.onco.bot>  # Currently configured
```

### 4. Test Email Sending
After verification (usually takes a few minutes):
1. Try the magic link authentication
2. Check Resend dashboard for email logs
3. Verify emails are being delivered

## Troubleshooting

### Domain Not Verified Error
- **Current Solution**: Using `onboarding@resend.dev` (Resend's test domain)
- **Production Solution**: Complete domain verification process above

### Email Delivery Issues
- Check Resend dashboard for error logs
- Ensure API key is valid and has correct permissions
- Verify DNS records are properly configured

## Alternative Authentication
While setting up email, users can still authenticate using:
- **Google OAuth**: Click "Continue with Google" on the login page
- **Direct Admin Creation**: Use the `scripts/create-admin-direct.ts` script
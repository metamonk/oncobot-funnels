# Environment Variables Setup Guide

## Overview
This guide explains the environment variables required for the oncobot eligibility funnel system.

## Required Variables

### 🔴 Critical (Must Have)

#### CRM Integration
```bash
GHL_WEBHOOK_URL=        # GoHighLevel webhook endpoint for lead capture
GHL_INTEGRATION_TOKEN=  # GoHighLevel V2 API authentication
GHL_LOCATION_ID=        # GoHighLevel location identifier
```

#### Database
```bash
DATABASE_URL=           # PostgreSQL connection string
```

#### Authentication
```bash
BETTER_AUTH_SECRET=     # Secret key for session encryption (generate with: openssl rand -base64 32)
GOOGLE_CLIENT_ID=       # Google OAuth client ID
GOOGLE_CLIENT_SECRET=   # Google OAuth client secret
```

#### Email
```bash
RESEND_API_KEY=         # Resend API key for sending magic link emails
EMAIL_FROM=             # Sender email address (default: oncobot <noreply@onco.bot>)
```

#### AI Provider (at least one required)
```bash
OPENAI_API_KEY=         # OpenAI API key
# OR
ANTHROPIC_API_KEY=      # Anthropic Claude API key
# OR
XAI_API_KEY=           # xAI Grok API key
```

### 🟡 Important (Recommended for Production)

#### Conversion Tracking
```bash
# Google Ads - IMPORTANT: Include both account ID and conversion label
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-XXXXXXXXXX                    # Google Ads account ID
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID=AW-XXXXXXXXXX/YYYYYY  # Full conversion ID with label

# Google Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX               # GA4 measurement ID

# Meta/Facebook
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=XXXXXXXXXXXXXXX              # Facebook Pixel ID
META_ACCESS_TOKEN=                                         # Meta Conversions API token
```

**Note**: For Google Ads enhanced conversions setup, see [docs/GOOGLE_ADS_SETUP.md](./docs/GOOGLE_ADS_SETUP.md)

#### Application URLs
```bash
NEXT_PUBLIC_APP_URL=https://onco.bot      # Main application URL
NEXT_PUBLIC_API_URL=https://api.onco.bot  # API endpoint URL
```

#### Storage & Caching
```bash
REDIS_URL=              # Redis connection string for caching
BLOB_READ_WRITE_TOKEN=  # Vercel Blob storage token
```

#### Security
```bash
CRON_SECRET=            # Secret for protecting cron job endpoints
ALLOWED_ORIGINS=        # Comma-separated list of allowed CORS origins
```

### 🟢 Optional (Nice to Have)

#### Analytics
```bash
NEXT_PUBLIC_POSTHOG_KEY=  # PostHog analytics key
NEXT_PUBLIC_POSTHOG_HOST= # PostHog instance URL
```

#### Logging
```bash
LOG_LEVEL=INFO          # Options: TRACE, DEBUG, INFO, WARN, ERROR, SILENT
```

## Setup Instructions

### 1. Copy the Example File
```bash
cp .env.example .env.local
```

### 2. GoHighLevel Setup
1. Log into your GoHighLevel account
2. Navigate to Settings → Integrations → Webhooks
3. Create a new webhook and copy the URL
4. Go to API Settings and generate an API key
5. Copy your Location ID from account settings

### 3. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Sign-In API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)

### 4. Resend Email Setup
1. Sign up at [Resend](https://resend.com)
2. Verify your domain or use their test domain
3. Generate an API key
4. Configure `EMAIL_FROM` with a verified sender

### 5. Database Setup
For local development:
```bash
# Using Docker
docker run --name oncobot-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Connection string
DATABASE_URL=postgresql://postgres:password@localhost:5432/oncobot
```

For production, use a managed PostgreSQL service like:
- Vercel Postgres
- Supabase
- Neon
- Railway

### 6. Redis Setup (Production)
For production, use a managed Redis service like:
- Upstash Redis
- Redis Cloud
- Vercel KV

### 7. Generate Secrets
```bash
# Generate BETTER_AUTH_SECRET
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -hex 32
```

## Deprecated Variables

The following variables are currently in `.env.example` but are NOT used by the eligibility funnel system. They will be removed in a future refactor:

- All search-related APIs (TAVILY, EXA, etc.)
- Entertainment APIs (TMDB, YouTube, etc.)
- Maps and location APIs
- Weather and aviation APIs
- Memory and MCP APIs
- Various other utility APIs

These are legacy from the original oncobot search engine and can be set to dummy values like `deprecated_not_used` if the server validation requires them.

## Troubleshooting

### Missing Required Variables
If you see errors about missing environment variables on startup, ensure all required variables are set in your `.env.local` file.

### Database Connection Issues
- Verify your DATABASE_URL is correct
- Check that the database server is running
- Ensure your IP is whitelisted (for cloud databases)

### Email Not Sending
- Verify your RESEND_API_KEY is valid
- Check that your sender domain is verified in Resend
- For development, you can use Resend's test mode

### OAuth Not Working
- Ensure redirect URIs match exactly in Google Cloud Console
- Check that both CLIENT_ID and CLIENT_SECRET are correct
- Verify the OAuth consent screen is configured

## Support

For environment setup issues, please check:
1. The error messages in your terminal
2. The browser console for client-side errors
3. The network tab for failed API requests

For additional help, create an issue in the repository with:
- The error message
- Which step you're stuck on
- Your environment (local/production)
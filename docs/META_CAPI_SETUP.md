# Meta Conversions API Gateway Setup Guide

## ✅ Completed Steps

1. **Created Meta Pixel**: ID `2227534211079876`
2. **Deployed AWS CloudFormation Stack**: `Conversions-API-Gateway-2240640839783613`
3. **Implemented Tracking Code**:
   - Client-side: `/components/tracking/meta-pixel.tsx`
   - Server-side: `/lib/tracking/meta-capi.ts`
   - API endpoint: `/app/api/track/route.ts`
   - Unified hook: `/hooks/use-meta-tracking.ts`

## 🔄 Next Steps

### 1. Get CloudFront URL from AWS (Current Step)

Once your CloudFormation stack shows `CREATE_COMPLETE`:

1. Go to AWS CloudFormation console
2. Click on your stack: `Conversions-API-Gateway-2240640839783613`
3. Go to the **Outputs** tab
4. Copy the **CloudFront URL** (it will look like: `https://d1234567890.cloudfront.net`)

### 2. Update Environment Variables

Add to your `.env` file:
```env
# Meta CAPI Gateway URL from AWS CloudFormation
META_CAPI_GATEWAY_URL=https://YOUR-CLOUDFRONT-URL.cloudfront.net
```

### 3. Complete Meta Events Manager Setup

1. Go back to Meta Events Manager
2. Your Conversions API connection should now show as "Connected"
3. The Gateway will automatically handle the access token

### 4. Deploy to Production

```bash
# Commit changes
git add .
git commit -m "feat: implement Meta Pixel and Conversions API tracking"
git push origin main

# Deploy to Vercel
vercel --prod
```

### 5. Test the Integration

#### Test Client-Side Pixel:
1. Install [Meta Pixel Helper Chrome extension](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
2. Visit your site
3. Complete the quiz
4. Verify events fire: PageView, Lead

#### Test Server-Side CAPI:
1. Go to Meta Events Manager
2. Click on your pixel
3. Go to "Test Events" tab
4. Enter your website URL
5. Complete a quiz submission
6. Verify both Browser and Server events appear

## 📊 Events Being Tracked

### Client-Side (Meta Pixel):
- **PageView**: Every page visit
- **Lead**: Quiz completion (value: $100)

### Server-Side (CAPI):
- **Lead**: Quiz submission with hashed PII
- **CompleteRegistration**: Full form completion

## 🔍 Monitoring

### Meta Events Manager:
- Check "Event Activity" for real-time events
- Review "Diagnostics" for any issues
- Monitor "Event Match Quality" score

### AWS CloudWatch (optional):
- App Runner logs show CAPI Gateway activity
- Monitor for errors or performance issues

## 🛠️ Troubleshooting

### If Events Don't Show:
1. Check browser console for errors
2. Verify Pixel ID in `.env`: `NEXT_PUBLIC_FACEBOOK_PIXEL_ID=2227534211079876`
3. Check CAPI Gateway URL is correct
4. Ensure cookies are enabled (needed for _fbp and _fbc)

### If CAPI Gateway Shows Errors:
1. Check AWS CloudFormation stack status
2. Verify CloudFront distribution is deployed
3. Check App Runner service is running
4. Review CloudWatch logs for errors

## 📈 Performance Benefits

With both Pixel and CAPI:
- **Higher Event Match Quality**: Server events include hashed email/phone
- **Better Attribution**: Server events bypass ad blockers
- **iOS 14.5+ Compatibility**: Server tracking works despite ATT
- **Improved Campaign Optimization**: More complete conversion data

## 🔐 Security Notes

- All PII is SHA-256 hashed before sending to Meta
- CAPI Gateway runs in your AWS account
- No Meta access tokens stored in code
- HTTPS encryption for all data transmission
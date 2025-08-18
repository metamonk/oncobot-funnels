#!/usr/bin/env tsx

/**
 * Test script to verify analytics integration is working
 * Run with: pnpm tsx scripts/test-analytics-integration.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testAnalyticsIntegration() {
  console.log('🧪 Testing Analytics Integration\n');
  
  // Check if analytics services are configured
  console.log('=== Configuration Check ===');
  
  // Plausible is hardcoded in layout.tsx for onco.bot domain
  console.log('✅ Plausible domain: onco.bot (hardcoded in layout.tsx)');
  console.log('   Note: Plausible will only track when deployed to https://onco.bot');
  
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';
  
  if (!posthogKey) {
    console.warn('⚠️  NEXT_PUBLIC_POSTHOG_KEY not configured');
  } else {
    console.log(`✅ PostHog API key: ${posthogKey.substring(0, 10)}...`);
    console.log(`✅ PostHog host: ${posthogHost}`);
  }
  
  console.log('\n=== Browser-Based Testing Required ===');
  console.log('To test that events are being sent properly:');
  console.log('\n1. Open the application in your browser: http://localhost:3000');
  console.log('2. Open DevTools Network tab');
  console.log('3. Filter by "plausible" and "posthog" to see analytics requests');
  console.log('\n4. Test these interactions:');
  console.log('   - Navigate between pages (should see Plausible pageview events)');
  console.log('   - Perform a search (should see both Plausible and PostHog events)');
  console.log('   - Start the health profile questionnaire');
  console.log('   - View a clinical trial');
  console.log('   - Use various features to trigger feature discovery events');
  
  console.log('\n=== Events to Look For ===');
  console.log('\nPlausible Events (in Network tab):');
  console.log('  - /api/event with payload containing:');
  console.log('    - n: "pageview" or custom event name');
  console.log('    - u: page URL');
  console.log('    - d: domain');
  
  console.log('\nPostHog Events (in Network tab):');
  console.log('  - /e/ or /batch/ endpoints with events like:');
  console.log('    - $pageview');
  console.log('    - Search Performed');
  console.log('    - Trial Viewed');
  console.log('    - Health Profile Started');
  console.log('    - Feature Discovered');
  
  console.log('\n=== Verification Steps ===');
  console.log('\n1. Health Profile Funnel:');
  console.log('   - Start questionnaire → "Health Profile Started" event');
  console.log('   - Answer questions → "Health Profile Question Answered" events');
  console.log('   - Complete profile → "Health Profile Completed" event');
  console.log('   - Abandon → "Health Profile Abandoned" event');
  
  console.log('\n2. Clinical Trials Tracking:');
  console.log('   - Search for trials → "Search Performed" event');
  console.log('   - View trial details → "Trial Viewed" event');
  console.log('   - Expand criteria → "Trial Criteria Expanded" event');
  console.log('   - Click contact → "Trial Contact Clicked" event');
  
  console.log('\n3. Feature Discovery:');
  console.log('   - Use voice input → "Feature Discovered: voice-input"');
  console.log('   - Upload image → "Feature Discovered: image-upload"');
  console.log('   - Use health profile → "Feature Discovered: health-profile"');
  
  console.log('\n=== Dashboard Verification ===');
  
  console.log('\nPlausible Dashboard: https://plausible.io/onco.bot');
  console.log('  - Check Real-time view for immediate events (only works in production)');
  console.log('  - Look for custom events under "Goals"');
  console.log('  - Note: Plausible only tracks on the actual onco.bot domain, not localhost')
  
  if (posthogKey) {
    console.log(`\nPostHog Dashboard: ${posthogHost}/project/current`);
    console.log('  - Check Live Events for real-time tracking');
    console.log('  - View Persons to see user sessions');
    console.log('  - Check Insights for event analytics');
  }
  
  console.log('\n✅ Analytics configuration check complete!');
  console.log('📝 Follow the steps above to verify events are being tracked properly.\n');
}

// Run the test
testAnalyticsIntegration()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
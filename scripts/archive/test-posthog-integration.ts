#!/usr/bin/env tsx

/**
 * Test script to verify PostHog server-side integration
 * Run with: pnpm tsx scripts/test-posthog-integration.ts
 */

import dotenv from 'dotenv';
import { trackClinicalTrialSearch } from '../lib/tools/clinical-trials-analytics';

// Load environment variables
dotenv.config();

async function testPostHogIntegration() {
  console.log('🧪 Testing PostHog Server-Side Integration\n');
  
  // Check if PostHog is configured
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    console.error('❌ NEXT_PUBLIC_POSTHOG_KEY not configured');
    process.exit(1);
  }
  
  console.log('✅ PostHog API key found');
  console.log(`📍 PostHog host: ${process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'}\n`);
  
  // Test 1: Successful search
  console.log('Test 1: Tracking successful search...');
  await trackClinicalTrialSearch({
    query: 'breast cancer trials in California',
    hasProfile: true,
    resultsCount: 15,
    success: true
  });
  console.log('✅ Successful search tracked\n');
  
  // Test 2: No results
  console.log('Test 2: Tracking no results...');
  await trackClinicalTrialSearch({
    query: 'very specific rare disease xyz123',
    hasProfile: false,
    resultsCount: 0,
    success: true
  });
  console.log('✅ No results tracked\n');
  
  // Test 3: Error case
  console.log('Test 3: Tracking error...');
  await trackClinicalTrialSearch({
    query: 'cancer trials',
    hasProfile: true,
    resultsCount: 0,
    success: false,
    error: 'API rate limit exceeded'
  });
  console.log('✅ Error tracked\n');
  
  // Wait a moment for events to flush
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('🎉 All tests completed!');
  console.log('\n📊 Check your PostHog dashboard to verify events:');
  console.log('   - Clinical Trial Search (successful)');
  console.log('   - Clinical Trial No Results');
  console.log('   - Clinical Trial Search Error');
  console.log('\nEvents should appear within 1-2 minutes in PostHog.');
  
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run tests
testPostHogIntegration().catch(console.error);
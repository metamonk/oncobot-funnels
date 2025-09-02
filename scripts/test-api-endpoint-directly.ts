#!/usr/bin/env pnpm tsx

/**
 * Test the API endpoint directly to see what's happening
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('🔍 Testing API Endpoint Directly');
console.log('================================\n');

async function testAPIEndpoint() {
  // Test NCT06890598 which should have 17 criteria
  const nctId = 'NCT06890598';
  
  console.log(`Testing ${nctId} (should have 17 criteria)\n`);
  
  // Fetch trial data
  const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
  const response = await fetch(url);
  const trial = await response.json();
  
  const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
  
  if (!eligibilityCriteria) {
    console.log('❌ No criteria found');
    return;
  }
  
  console.log('📝 Calling our API endpoint...\n');
  
  // Call our API endpoint
  const apiResponse = await fetch('http://localhost:3000/api/eligibility-check/parse', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eligibilityCriteria,
      nctId
    })
  });
  
  if (!apiResponse.ok) {
    console.error('API call failed:', apiResponse.statusText);
    return;
  }
  
  const data = await apiResponse.json();
  
  console.log('📊 API Response:');
  console.log('-'.repeat(40));
  console.log(`Success: ${data.success}`);
  console.log(`Criteria returned: ${data.criteria.length}`);
  
  // Check token usage
  if (data.usage) {
    console.log(`\n📈 Token Usage:`);
    console.log(`  Prompt tokens: ${data.usage.promptTokens}`);
    console.log(`  Completion tokens: ${data.usage.completionTokens}`);
    console.log(`  Total tokens: ${data.usage.totalTokens}`);
  }
  
  // Analyze the criteria
  const inclusionCount = data.criteria.filter((c: any) => c.category === 'INCLUSION').length;
  const exclusionCount = data.criteria.filter((c: any) => c.category === 'EXCLUSION').length;
  
  console.log(`\n📋 Breakdown:`);
  console.log(`  Inclusion: ${inclusionCount}`);
  console.log(`  Exclusion: ${exclusionCount}`);
  
  // Show first few criteria
  console.log(`\n🔍 First 5 criteria:`);
  data.criteria.slice(0, 5).forEach((c: any, i: number) => {
    const preview = c.originalText.substring(0, 60) + 
                   (c.originalText.length > 60 ? '...' : '');
    console.log(`${i + 1}. [${c.category}] ${preview}`);
  });
  
  // Check for any truncation
  const hasTruncation = data.criteria.some((c: any) => {
    const text = c.originalText || '';
    return text.includes('more characters') || 
           text.match(/\(\d+ more/) !== null ||
           (text.includes('...') && text.length < 50);
  });
  
  if (hasTruncation) {
    console.log('\n⚠️ WARNING: Truncation detected in criteria!');
  }
  
  // Test the service directly
  console.log('\n📦 Testing EligibilityCheckerService...');
  const { eligibilityCheckerService } = require('../lib/eligibility-checker');
  
  // Clear cache first
  eligibilityCheckerService.clearCache();
  
  const parsedCriteria = await eligibilityCheckerService.parseEligibilityCriteria(trial);
  console.log(`Service returned: ${parsedCriteria.length} criteria`);
  
  const questions = await eligibilityCheckerService.generateQuestions(parsedCriteria);
  console.log(`Questions generated: ${questions.length}`);
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary');
  console.log('=' .repeat(50));
  
  if (data.criteria.length === 17) {
    console.log('✅ API is returning all 17 criteria!');
  } else {
    console.log(`❌ API only returned ${data.criteria.length} criteria (expected 17)`);
  }
  
  if (questions.length === parsedCriteria.length) {
    console.log('✅ All criteria are being converted to questions!');
  } else {
    console.log(`❌ Only ${questions.length} questions from ${parsedCriteria.length} criteria`);
  }
}

// Run test
testAPIEndpoint().catch(console.error);
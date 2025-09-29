#!/usr/bin/env tsx

/**
 * Test script for quiz submission flow
 * Tests database storage, GoHighLevel contact creation, and opportunity creation
 */

import { Logger } from '@/lib/logger';

const logger = new Logger('Test/QuizSubmission');

const TEST_DATA = {
  // Core quiz fields
  cancerType: 'Lung Cancer',
  zipCode: '10001',
  forWhom: 'self',
  stage: 'Stage IV',
  biomarkers: 'EGFR+, ALK-',
  priorTherapy: 'Chemotherapy, Immunotherapy',

  // Contact fields
  fullName: 'Test Patient ' + new Date().toISOString(),
  email: `test.patient.${Date.now()}@example.com`,
  phone: '555-0123',
  preferredTime: 'Morning',
  consent: true,

  // Tracking fields
  indication: 'lung',
  indicationName: 'Lung Cancer',
  landingPageId: 'lp_lung_test',
  sessionId: 'session_' + Date.now(),
  utmParams: {
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'lung_trial_2025',
    utm_term: 'clinical trial lung cancer',
    utm_content: 'variant_a'
  },
  gclid: 'test_gclid_123'
};

async function testQuizSubmission() {
  const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  logger.info('Starting quiz submission test', { url: `${API_URL}/api/quiz` });
  logger.info('Test data', TEST_DATA);

  try {
    const response = await fetch(`${API_URL}/api/quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_DATA)
    });

    const result = await response.json();

    if (response.ok) {
      logger.info('✅ Quiz submission successful', result);

      // Verification checklist
      console.log('\n📋 Verification Checklist:');
      console.log('================================');
      console.log('1. Database Storage:');
      console.log('   - Check quiz_submissions table for new record');
      console.log(`   - Email: ${TEST_DATA.email}`);
      console.log('');
      console.log('2. GoHighLevel Contact:');
      console.log('   - Check Contacts for new/updated contact');
      console.log('   - Verify General Information group fields:');
      console.log('     • last_quiz_date (should be today)');
      console.log('     • preferred_contact_time (should be "Morning")');
      console.log('     • total_quiz_submissions (should be 1 or incremented)');
      console.log('');
      console.log('3. GoHighLevel Opportunity:');
      console.log('   - Check Opportunities in Patient Pipeline');
      console.log('   - Verify Health Profile section fields:');
      console.log('     • cancer_type: "Lung Cancer"');
      console.log('     • stage: "Stage IV"');
      console.log('     • biomarkers: "EGFR+, ALK-"');
      console.log('     • prior_therapy: "Chemotherapy, Immunotherapy"');
      console.log('     • for_whom: "self"');
      console.log('   - Verify Opportunity Details fields:');
      console.log('     • zip_code: "10001"');
      console.log('     • utm_source: "google"');
      console.log('     • utm_medium: "cpc"');
      console.log('     • utm_campaign: "lung_trial_2025"');
      console.log('');
      console.log('4. Data Consistency:');
      console.log('   - Database fields use camelCase');
      console.log('   - GoHighLevel fields use snake_case');
      console.log('   - Values match across all systems');
      console.log('================================\n');

      if (result.contactId) {
        console.log(`🔗 Contact ID: ${result.contactId}`);
      }

    } else {
      logger.error('❌ Quiz submission failed', result);
    }
  } catch (error) {
    logger.error('❌ Test failed with error', error);
  }
}

// Run the test
testQuizSubmission().catch(console.error);
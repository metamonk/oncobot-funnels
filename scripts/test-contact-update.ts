#!/usr/bin/env node
/**
 * Test script to verify GoHighLevel contact update functionality
 * Tests both new contact creation and existing contact updates
 */

import { z } from 'zod';

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// Generate unique email for testing
const testEmail = `test-${Date.now()}@example.com`;
const testPhone = `555-${Math.floor(Math.random() * 9000000 + 1000000)}`;

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

function logResult(result: TestResult) {
  results.push(result);
  console.log(`${result.success ? '✅' : '❌'} ${result.step}: ${result.message}`);
  if (result.data) {
    console.log('   Data:', JSON.stringify(result.data, null, 2));
  }
}

/**
 * Step 1: Create initial contact with minimal data (simulating partial lead)
 */
async function createInitialContact() {
  console.log('\n📝 Step 1: Creating initial contact with minimal data...');
  console.log(`   Email: ${testEmail}`);

  const initialData = {
    email: testEmail,
    phone: '',
    fullName: '',  // No name initially
    zipCode: '10001',
    condition: 'lung cancer',
    stage: '',  // No stage initially
    biomarkers: '',  // No biomarkers initially
    priorTherapy: '',  // No prior therapy initially
    source: 'partial_quiz',
    indication: 'lung',
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(`${API_BASE}/api/gohighlevel/v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initialData)
    });

    const result = await response.json();

    if (result.success) {
      logResult({
        step: 'Initial Contact Creation',
        success: true,
        message: result.message || 'Contact created',
        data: { contactId: result.contactId, isExisting: result.isExistingContact }
      });
      return true;
    } else {
      logResult({
        step: 'Initial Contact Creation',
        success: false,
        message: result.error || 'Failed to create contact',
        data: result
      });
      return false;
    }
  } catch (error) {
    logResult({
      step: 'Initial Contact Creation',
      success: false,
      message: `Error: ${String(error)}`,
    });
    return false;
  }
}

/**
 * Step 2: Update contact with complete data (simulating quiz completion)
 */
async function updateContactWithFullData() {
  console.log('\n📝 Step 2: Updating contact with complete data...');

  const completeData = {
    email: testEmail,  // Same email
    phone: testPhone,  // Now with phone
    fullName: 'John Test Smith',  // Now with full name
    zipCode: '10001',
    condition: 'lung cancer',
    stage: 'Stage 3B',  // Now with stage
    biomarkers: 'EGFR positive',  // Now with biomarkers
    priorTherapy: 'chemotherapy',  // Now with prior therapy
    source: 'eligibility_quiz',
    indication: 'lung',
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(`${API_BASE}/api/gohighlevel/v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(completeData)
    });

    const result = await response.json();

    if (result.success) {
      const isUpdateSuccess = result.isExistingContact &&
                             result.message.includes('updated');

      logResult({
        step: 'Contact Update',
        success: isUpdateSuccess,
        message: result.message || 'Contact processed',
        data: {
          contactId: result.contactId,
          isExisting: result.isExistingContact,
          wasUpdated: isUpdateSuccess,
          leadScore: result.leadScore
        }
      });
      return isUpdateSuccess;
    } else {
      logResult({
        step: 'Contact Update',
        success: false,
        message: result.error || 'Failed to update contact',
        data: result
      });
      return false;
    }
  } catch (error) {
    logResult({
      step: 'Contact Update',
      success: false,
      message: `Error: ${String(error)}`,
    });
    return false;
  }
}

/**
 * Step 3: Verify the update by attempting another update with slightly different data
 */
async function verifyUpdateFunctionality() {
  console.log('\n📝 Step 3: Verifying update functionality with modified data...');

  const modifiedData = {
    email: testEmail,  // Same email
    phone: testPhone,
    fullName: 'John Test Smith Jr.',  // Modified name
    zipCode: '10002',  // Different zip
    condition: 'lung cancer',
    stage: 'Stage 4',  // Different stage
    biomarkers: 'ALK positive',  // Different biomarker
    priorTherapy: 'immunotherapy',  // Different therapy
    source: 'eligibility_quiz',
    indication: 'lung',
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(`${API_BASE}/api/gohighlevel/v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modifiedData)
    });

    const result = await response.json();

    if (result.success && result.isExistingContact) {
      logResult({
        step: 'Update Verification',
        success: true,
        message: 'Contact successfully updated with modified data',
        data: {
          contactId: result.contactId,
          leadScore: result.leadScore
        }
      });
      return true;
    } else {
      logResult({
        step: 'Update Verification',
        success: false,
        message: 'Update verification failed',
        data: result
      });
      return false;
    }
  } catch (error) {
    logResult({
      step: 'Update Verification',
      success: false,
      message: `Error: ${String(error)}`,
    });
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Testing GoHighLevel Contact Update Functionality');
  console.log('================================================\n');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Test Email: ${testEmail}\n`);

  // Run tests in sequence
  const step1Success = await createInitialContact();
  if (!step1Success) {
    console.log('\n⚠️  Step 1 failed - cannot continue with update tests');
    return;
  }

  // Wait a moment to ensure the contact is properly created
  await new Promise(resolve => setTimeout(resolve, 1000));

  const step2Success = await updateContactWithFullData();

  // Wait a moment before final verification
  await new Promise(resolve => setTimeout(resolve, 1000));

  const step3Success = await verifyUpdateFunctionality();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary:');
  console.log('='.repeat(50));

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  results.forEach(r => {
    console.log(`${r.success ? '✅' : '❌'} ${r.step}`);
  });

  console.log('\n' + '='.repeat(50));
  if (successCount === totalCount) {
    console.log('✅ ALL TESTS PASSED! Contact update functionality is working correctly.');
  } else {
    console.log(`⚠️  ${successCount}/${totalCount} tests passed. Review failures above.`);
  }
  console.log('='.repeat(50));
}

// Run the tests
runTests().catch(console.error);
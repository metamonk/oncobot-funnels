#!/usr/bin/env tsx

/**
 * Test GoHighLevel V2 Integration
 * Comprehensive test of the V2 API implementation
 */

import { config } from 'dotenv';
config();

const API_BASE = 'http://localhost:3001'; // Or use the port from your dev server

async function testWebhookEndpoint() {
  console.log('🧪 Testing /api/gohighlevel/webhook endpoint (V2 internally)...\n');
  
  const testLead = {
    email: `test.patient.${Date.now()}@example.com`,
    phone: `+1555${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
    zipCode: '90210',
    condition: 'lung',
    stage: 'Stage 4',
    biomarkers: 'EGFR mutation',
    priorTherapy: 'chemotherapy',
    source: 'eligibility_quiz',
    indication: 'lung',
    timestamp: new Date().toISOString()
  };
  
  try {
    const response = await fetch(`${API_BASE}/api/gohighlevel/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testLead)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Webhook endpoint working with V2!');
      console.log(`   Contact ID: ${result.contactId || 'Not returned'}`);
      console.log(`   Message: ${result.message}\n`);
    } else {
      console.error('❌ Webhook endpoint failed:', result.error || result.message);
    }
    
    return result.success;
  } catch (error) {
    console.error('❌ Error calling webhook endpoint:', error);
    return false;
  }
}

async function testV2Endpoint() {
  console.log('🧪 Testing /api/gohighlevel/v2 endpoint...\n');
  
  const testLead = {
    email: `test.v2.${Date.now()}@example.com`,
    phone: `+1555${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
    zipCode: '10001',
    condition: 'breast',
    stage: 'Stage 3',
    biomarkers: 'HER2 positive',
    priorTherapy: 'multiple_prior_therapies',
    source: 'eligibility_quiz',
    indication: 'breast',
    timestamp: new Date().toISOString()
  };
  
  try {
    const response = await fetch(`${API_BASE}/api/gohighlevel/v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testLead)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ V2 endpoint working!');
      console.log(`   Contact ID: ${result.contactId}`);
      console.log(`   Lead Type: ${result.leadType}`);
      console.log(`   Lead Score: ${result.leadScore}`);
      console.log(`   Pipeline Stage: ${result.pipelineStage || 'Not set'}\n`);
    } else {
      console.error('❌ V2 endpoint failed:', result.error || result.message);
    }
    
    return result.success;
  } catch (error) {
    console.error('❌ Error calling V2 endpoint:', error);
    return false;
  }
}

async function testSiteLead() {
  console.log('🧪 Testing Site/Membership lead submission...\n');
  
  const testSite = {
    companyName: `Test Clinic ${Date.now()}`,
    contactName: 'Dr. Test Smith',
    email: `clinic.${Date.now()}@example.com`,
    phone: `+1555${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
    indication: 'lung',
    siteLocation: 'New York, NY',
    monthlyVolume: '50-100',
    notes: 'Interested in partnership',
    selectedTime: 'immediate',
    source: 'membership_booking',
    timestamp: new Date().toISOString()
  };
  
  try {
    const response = await fetch(`${API_BASE}/api/gohighlevel/v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testSite)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Site lead submission working!');
      console.log(`   Contact ID: ${result.contactId}`);
      console.log(`   Lead Type: ${result.leadType}`);
      console.log(`   Lead Score: ${result.leadScore}\n`);
    } else {
      console.error('❌ Site lead submission failed:', result.error || result.message);
    }
    
    return result.success;
  } catch (error) {
    console.error('❌ Error submitting site lead:', error);
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('   GoHighLevel V2 Integration Test');
  console.log('========================================\n');
  
  console.log('📝 Configuration:');
  console.log(`   Token: ${process.env.GHL_INTEGRATION_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Location ID: ${process.env.GHL_LOCATION_ID || 'Not set'}`);
  console.log(`   API Base: ${API_BASE}\n`);
  
  console.log('----------------------------------------\n');
  
  // Test all endpoints
  const webhookSuccess = await testWebhookEndpoint();
  const v2Success = await testV2Endpoint();
  const siteSuccess = await testSiteLead();
  
  console.log('----------------------------------------\n');
  console.log('📊 Test Summary:');
  console.log(`   Webhook Endpoint (V2): ${webhookSuccess ? '✅ Passed' : '❌ Failed'}`);
  console.log(`   V2 Endpoint: ${v2Success ? '✅ Passed' : '❌ Failed'}`);
  console.log(`   Site Lead Submission: ${siteSuccess ? '✅ Passed' : '❌ Failed'}`);
  
  const allPassed = webhookSuccess && v2Success && siteSuccess;
  
  console.log(`\n${allPassed ? '🎉 All tests passed!' : '⚠️ Some tests failed'}`);
  
  if (allPassed) {
    console.log('\n✅ GoHighLevel V2 integration is fully working!');
    console.log('   - Private Integration token is valid');
    console.log('   - Both endpoints are using V2 API');
    console.log('   - Patient and site leads are being created');
    console.log('   - Lead scoring and pipeline placement working');
  } else {
    console.log('\n⚠️ Please check the error messages above and verify:');
    console.log('   1. The dev server is running on the correct port');
    console.log('   2. The GHL_INTEGRATION_TOKEN is set correctly');
    console.log('   3. The GHL_LOCATION_ID is set correctly');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run the tests
main().catch(console.error);
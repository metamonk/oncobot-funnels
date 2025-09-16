#!/usr/bin/env tsx

/**
 * Test Full Name Field and Dashboard Display
 * Verifies the fullName field is working correctly
 */

import { config } from 'dotenv';
config();

const API_BASE = 'http://localhost:3000';

async function testWithFullName() {
  console.log('🧪 Testing with Full Name provided...\n');
  
  const testLead = {
    fullName: 'John Michael Smith',
    email: `john.${Date.now()}@example.com`,
    phone: `+1555${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
    zipCode: '10001',
    condition: 'lung',
    stage: 'Stage 1',
    biomarkers: 'EGFR',
    priorTherapy: 'no_prior_treatment',
    source: 'eligibility_quiz',
    indication: 'lung',
    timestamp: new Date().toISOString()
  };
  
  try {
    // Test both endpoints
    const endpoints = [
      '/api/gohighlevel/webhook',
      '/api/gohighlevel/v2'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`Testing ${endpoint}...`);
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testLead)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Success via ${endpoint}`);
        console.log(`   Input Name: "${testLead.fullName}"`);
        console.log(`   Expected in GHL: First="John", Last="Michael Smith"`);
        console.log(`   Contact ID: ${result.contactId || 'Check GoHighLevel'}`);
      } else {
        console.error(`❌ Failed via ${endpoint}:`, result.error);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function testWithoutFullName() {
  console.log('🧪 Testing WITHOUT Full Name (should use defaults)...\n');
  
  const testLead = {
    // NO fullName field
    email: `patient.${Date.now()}@example.com`,
    phone: `+1555${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
    zipCode: '10001',
    condition: 'lung',
    stage: 'Stage 1',
    biomarkers: 'EGFR',
    priorTherapy: 'no_prior_treatment',
    source: 'eligibility_quiz',
    indication: 'lung',
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
      console.log('✅ Success with default name');
      console.log('   Input Name: (not provided)');
      console.log('   Expected in GHL: First="Patient", Last="Lung"');
      console.log(`   Contact ID: ${result.contactId}`);
    } else {
      console.error('❌ Failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function main() {
  console.log('========================================');
  console.log('   Full Name Field Test');
  console.log('========================================\n');
  
  console.log('Testing fixes for:');
  console.log('1. Full name field visibility in form');
  console.log('2. Proper name parsing to GoHighLevel');
  console.log('3. No placeholder values in dashboard\n');
  
  console.log('----------------------------------------\n');
  
  await testWithFullName();
  
  console.log('----------------------------------------\n');
  
  await testWithoutFullName();
  
  console.log('\n----------------------------------------\n');
  
  console.log('📝 IMPORTANT: Check GoHighLevel dashboard to verify:');
  console.log('1. "John Michael Smith" should appear as:');
  console.log('   - First Name: John');
  console.log('   - Last Name: Michael Smith');
  console.log('2. Contact without name should appear as:');
  console.log('   - First Name: Patient');
  console.log('   - Last Name: Lung');
  console.log('\n✅ If names appear correctly, the fix is working!');
  console.log('\n🌐 Access the form at: http://localhost:3001/eligibility/lung/quiz');
  console.log('   Navigate to Step 3 to see the Full Name field');
}

// Run tests
main().catch(console.error);
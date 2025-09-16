#!/usr/bin/env tsx

/**
 * Test GoHighLevel Integration
 * Verify JWT auth and lead submission
 */

async function testGoHighLevelIntegration() {
  console.log('🧪 Testing GoHighLevel Integration...\n');

  // Test patient lead submission
  const patientLead = {
    email: 'test.patient@example.com',
    phone: '5551234567',
    zipCode: '10001',
    condition: 'lung',
    stage: 'Stage 3',
    biomarkers: 'EGFR',
    priorTherapy: 'chemotherapy',
    source: 'eligibility_quiz',
    indication: 'lung',
    timestamp: new Date().toISOString()
  };

  console.log('📤 Submitting patient lead...');
  console.log(JSON.stringify(patientLead, null, 2));

  try {
    const response = await fetch('http://localhost:3001/api/gohighlevel/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientLead)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Patient lead submitted successfully!');
      console.log('Response:', result);
    } else {
      console.error('❌ Patient lead submission failed:');
      console.error('Status:', response.status);
      console.error('Response:', result);
    }
  } catch (error) {
    console.error('❌ Error submitting patient lead:', error);
  }

  console.log('\n---\n');

  // Test membership booking submission
  const membershipLead = {
    companyName: 'Test Hospital',
    contactName: 'Dr. John Smith',
    email: 'john.smith@testhospital.com',
    phone: '5559876543',
    indication: 'lung',
    siteLocation: 'New York, NY',
    monthlyVolume: '50-100',
    notes: 'Interested in oncology trials',
    selectedTime: 'afternoon-12pm-5pm',
    source: 'membership_booking',
    timestamp: new Date().toISOString()
  };

  console.log('📤 Submitting membership lead...');
  console.log(JSON.stringify(membershipLead, null, 2));

  try {
    const response = await fetch('http://localhost:3001/api/gohighlevel/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(membershipLead)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Membership lead submitted successfully!');
      console.log('Response:', result);
    } else {
      console.error('❌ Membership lead submission failed:');
      console.error('Status:', response.status);
      console.error('Response:', result);
    }
  } catch (error) {
    console.error('❌ Error submitting membership lead:', error);
  }

  console.log('\n🎯 Integration test complete!');
}

// Run the test
testGoHighLevelIntegration().catch(console.error);
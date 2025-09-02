#!/usr/bin/env pnpm tsx

/**
 * Test AI parsing directly to see what it returns for NCT06890598
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('🔍 Testing AI Parsing Directly');
console.log('==============================\n');

// Read the actual eligibility criteria
const fs = require('fs').promises;

async function testAIParsing() {
  try {
    // Read the saved eligibility criteria
    const eligibilityCriteria = await fs.readFile('trial-NCT06890598-eligibility.txt', 'utf-8');
    
    console.log('1️⃣ Eligibility Criteria');
    console.log('------------------------');
    console.log(`Text length: ${eligibilityCriteria.length} characters`);
    
    // Count expected criteria manually
    const lines = eligibilityCriteria.split('\n');
    let inclusionCount = 0;
    let exclusionCount = 0;
    let inInclusion = false;
    let inExclusion = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      const lower = trimmed.toLowerCase();
      
      if (lower.includes('inclusion criteria')) {
        inInclusion = true;
        inExclusion = false;
      } else if (lower.includes('exclusion criteria')) {
        inInclusion = false;
        inExclusion = true;
      } else if (trimmed.startsWith('*') || trimmed.match(/^\d+\./)) {
        if (inInclusion) inclusionCount++;
        if (inExclusion) exclusionCount++;
      }
    }
    
    console.log(`Expected inclusion: ${inclusionCount}`);
    console.log(`Expected exclusion: ${exclusionCount}\n`);
    
    console.log('2️⃣ Calling AI Parser API');
    console.log('------------------------');
    
    const response = await fetch('http://localhost:3000/api/eligibility-check/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add a mock cookie for auth if needed
        'Cookie': 'better-auth.session_token=mock_token'
      },
      body: JSON.stringify({
        eligibilityCriteria,
        nctId: 'NCT06890598'
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ API error (${response.status}): ${error}`);
      
      if (response.status === 401) {
        console.log('\n⚠️ Note: Authentication required. Testing with mock data instead...\n');
        
        // Use the service directly
        const { eligibilityCheckerService } = require('../lib/eligibility-checker');
        const mockTrial = {
          protocolSection: {
            identificationModule: {
              nctId: 'NCT06890598',
              briefTitle: 'Study of Olomorasib'
            },
            eligibilityModule: {
              eligibilityCriteria
            }
          }
        };
        
        const criteria = await eligibilityCheckerService.parseEligibilityCriteria(mockTrial);
        analyzeParsedCriteria(criteria);
        return;
      }
      
      return;
    }
    
    const data = await response.json();
    
    if (data.success && data.criteria) {
      analyzeParsedCriteria(data.criteria);
    } else {
      console.log('❌ No criteria in response');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

import type { InterpretedCriterion } from '../lib/eligibility-checker/types';

function analyzeParsedCriteria(criteria: InterpretedCriterion[]) {
  console.log('3️⃣ Parsed Criteria Analysis');
  console.log('---------------------------');
  console.log(`Total parsed: ${criteria.length} criteria`);
  
  const inclusion = criteria.filter((c) => c.category === 'INCLUSION');
  const exclusion = criteria.filter((c) => c.category === 'EXCLUSION');
  
  console.log(`Inclusion: ${inclusion.length}`);
  console.log(`Exclusion: ${exclusion.length}\n`);
  
  console.log('4️⃣ Criteria Details');
  console.log('-------------------');
  
  console.log('\nInclusion Criteria:');
  inclusion.forEach((c, i) => {
    const preview = c.originalText.substring(0, 60) + 
                   (c.originalText.length > 60 ? '...' : '');
    console.log(`${i + 1}. ${preview}`);
  });
  
  console.log('\nExclusion Criteria:');
  exclusion.forEach((c, i) => {
    const preview = c.originalText.substring(0, 60) + 
                   (c.originalText.length > 60 ? '...' : '');
    console.log(`${i + 1}. ${preview}`);
  });
  
  // Check for specific known criteria
  console.log('\n5️⃣ Key Criteria Check');
  console.log('---------------------');
  
  const hasKRAS = criteria.some((c) => 
    c.originalText.toLowerCase().includes('kras g12c'));
  const hasPDL1 = criteria.some((c) => 
    c.originalText.toLowerCase().includes('pd-l1'));
  const hasECOG = criteria.some((c) => 
    c.originalText.toLowerCase().includes('ecog'));
  const hasEGFR = criteria.some((c) => 
    c.originalText.toLowerCase().includes('egfr'));
  
  console.log(`KRAS G12C mentioned: ${hasKRAS ? '✅' : '❌'}`);
  console.log(`PD-L1 mentioned: ${hasPDL1 ? '✅' : '❌'}`);
  console.log(`ECOG mentioned: ${hasECOG ? '✅' : '❌'}`);
  console.log(`EGFR mentioned: ${hasEGFR ? '✅' : '❌'}`);
  
  if (criteria.length < 10) {
    console.log('\n❌ ISSUE: Only parsing first few criteria!');
    console.log('This explains why only 4 questions are shown in the UI.');
  }
}

// Run the test
testAIParsing();
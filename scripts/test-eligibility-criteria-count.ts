#!/usr/bin/env pnpm tsx

/**
 * Test to verify the eligibility criteria parsing issue
 * Specifically testing NCT06890598 which has 13 inclusion + 5 exclusion criteria
 */

import { eligibilityCheckerService } from '../lib/eligibility-checker';
import type { ClinicalTrial } from '../lib/tools/clinical-trials/types';

console.log('🔍 Testing Eligibility Criteria Count Issue');
console.log('============================================\n');

// Mock trial NCT06890598 with full eligibility criteria
const mockTrial: ClinicalTrial = {
  protocolSection: {
    identificationModule: {
      nctId: 'NCT06890598',
      briefTitle: 'Study of Olomorasib in KRAS G12C-mutant NSCLC'
    },
    eligibilityModule: {
      eligibilityCriteria: `
Inclusion Criteria:

1. Male or female participants who are at least 18 years of age on the day of signing informed consent
2. Histologically or cytologically confirmed diagnosis of non-small cell lung cancer (NSCLC)
3. Documented KRAS G12C mutation
4. Locally advanced or metastatic disease (Stage IIIB-IV) not amenable to curative therapy
5. Measurable disease per RECIST v1.1
6. ECOG performance status of 0 or 1
7. Adequate organ function as defined by protocol laboratory values
8. Life expectancy of at least 12 weeks
9. Willing and able to comply with study procedures
10. Women of childbearing potential must use effective contraception
11. Men with female partners of childbearing potential must use effective contraception
12. Ability to swallow oral medications
13. Prior systemic therapy for advanced/metastatic disease is allowed

Exclusion Criteria:

1. Active brain metastases requiring immediate treatment
2. Prior treatment with KRAS G12C inhibitors
3. Concurrent malignancy requiring active treatment within the past 2 years
4. Significant cardiovascular disease within 6 months
5. Active infection requiring systemic therapy
      `
    }
  }
} as ClinicalTrial;

async function testCriteriaCount() {
  try {
    console.log('📋 Test Setup');
    console.log('-------------');
    console.log(`Trial: ${mockTrial.protocolSection.identificationModule.nctId}`);
    console.log('Expected: 13 inclusion criteria + 5 exclusion criteria = 18 total\n');
    
    // Clear cache to force fresh parsing
    eligibilityCheckerService.clearCache();
    
    console.log('1️⃣ Parsing Eligibility Criteria');
    console.log('---------------------------------');
    
    const startTime = Date.now();
    const criteria = await eligibilityCheckerService.parseEligibilityCriteria(mockTrial);
    const parseTime = Date.now() - startTime;
    
    console.log(`✅ Parsing completed in ${parseTime}ms`);
    console.log(`📊 Parsed ${criteria.length} criteria\n`);
    
    // Count by category
    const inclusionCount = criteria.filter(c => c.category === 'INCLUSION').length;
    const exclusionCount = criteria.filter(c => c.category === 'EXCLUSION').length;
    
    console.log('2️⃣ Criteria Breakdown');
    console.log('---------------------');
    console.log(`Inclusion criteria: ${inclusionCount} (expected: 13)`);
    console.log(`Exclusion criteria: ${exclusionCount} (expected: 5)`);
    console.log(`Total criteria: ${criteria.length} (expected: 18)\n`);
    
    // Check if we're getting the full criteria
    const hasAllCriteria = criteria.length >= 18;
    
    if (!hasAllCriteria) {
      console.log('❌ ISSUE CONFIRMED: Not all criteria are being parsed!');
      console.log(`   Missing ${18 - criteria.length} criteria\n`);
      
      // Display what we got
      console.log('3️⃣ Parsed Criteria Details');
      console.log('---------------------------');
      criteria.forEach((c, i) => {
        const preview = c.originalText.substring(0, 60) + 
                       (c.originalText.length > 60 ? '...' : '');
        console.log(`${i + 1}. [${c.category}] ${preview}`);
      });
      
      console.log('\n4️⃣ Root Cause Analysis');
      console.log('----------------------');
      console.log('Likely causes:');
      console.log('1. Token limit (4000) in AI response is too low for 18 criteria');
      console.log('2. AI might be truncating its response due to token limit');
      console.log('3. Fallback parser might be missing some criteria');
      
      // Check if criteria text is complete
      const criteriaText = mockTrial.protocolSection.eligibilityModule.eligibilityCriteria;
      const criteriaLines = criteriaText.split('\n').filter(line => 
        line.trim().length > 10 && 
        !line.toLowerCase().includes('criteria:') &&
        !line.toLowerCase().includes('inclusion') &&
        !line.toLowerCase().includes('exclusion')
      );
      
      console.log(`\n5️⃣ Input Validation`);
      console.log('-------------------');
      console.log(`Input criteria text length: ${criteriaText.length} characters`);
      console.log(`Potential criteria lines in input: ${criteriaLines.length}`);
      
      if (criteriaLines.length > criteria.length) {
        console.log('✅ Input has all criteria - issue is in parsing/AI response');
      } else {
        console.log('❌ Input might be truncated before parsing');
      }
      
    } else {
      console.log('✅ SUCCESS: All criteria are being parsed correctly!');
    }
    
    console.log('\n6️⃣ Recommendations');
    console.log('------------------');
    console.log('To fix this issue:');
    console.log('1. Increase maxTokens from 4000 to 8000 or higher in /app/api/eligibility-check/parse/route.ts');
    console.log('2. Consider splitting large criteria sets into batches');
    console.log('3. Implement a verification step to ensure all criteria are parsed');
    console.log('4. Add logging to detect when AI response might be truncated');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testCriteriaCount();
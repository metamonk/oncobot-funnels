#!/usr/bin/env pnpm tsx

/**
 * Test script to verify the eligibility checker truncation fix
 * Tests that the "24 more characters" issue is resolved
 */

import { eligibilityCheckerService } from '../lib/eligibility-checker';
import type { ClinicalTrial } from '../lib/tools/clinical-trials/types';

console.log('🧪 Testing Eligibility Checker Truncation Fix');
console.log('============================================\n');

// Mock trial with criteria that was previously getting truncated
const mockTrial: ClinicalTrial = {
  protocolSection: {
    identificationModule: {
      nctId: 'NCT06119581',
      briefTitle: 'Olomorasib and Pembrolizumab for KRAS G12C-Mutant NSCLC'
    },
    eligibilityModule: {
      eligibilityCriteria: `
Inclusion Criteria:
- Histologically or cytologically confirmed NSCLC with Stage IIIB-IIIC or Stage IV disease, not suitable for curative intent radical surgery or radiation therapy.
- Part B and Safety Lead-In Part B: the histology of the tumor must be predominantly non-squamous (in line with pemetrexed label).
- Must have disease with evidence of KRAS G12C mutation.
- Must have known programmed death-ligand 1 (PD-L1) expression

  * Part A: Greater than or equal to (≥)50 percent (%).

Exclusion Criteria:
- History of severe hypersensitivity reactions to any of the study drugs
- Active brain metastases requiring immediate treatment
- Prior treatment with KRAS G12C inhibitors
- Significant cardiovascular disease within 6 months
      `
    }
  }
} as ClinicalTrial;

async function testTruncationFix() {
  try {
    console.log('1️⃣ Testing Criteria Parsing');
    console.log('-----------------------------');
    
    // Clear cache to force fresh parsing
    eligibilityCheckerService.clearCache();
    
    // Parse criteria
    const criteria = await eligibilityCheckerService.parseEligibilityCriteria(mockTrial);
    console.log(`✅ Parsed ${criteria.length} criteria\n`);
    
    console.log('2️⃣ Checking for Truncation');
    console.log('---------------------------');
    
    let hasTruncation = false;
    let truncatedCriteria: string[] = [];
    
    // Check each criterion for truncation markers
    criteria.forEach((c, index) => {
      const text = c.originalText;
      
      // Check for various truncation patterns
      if (text.includes('more characters') || 
          text.includes('...') && text.length < 50 ||
          text.match(/\(\d+ more/) ||
          text.includes('24 more characters')) {
        hasTruncation = true;
        truncatedCriteria.push(`Criterion ${index + 1}: "${text.substring(0, 50)}..."`);
      }
    });
    
    if (hasTruncation) {
      console.log('❌ TRUNCATION DETECTED in the following criteria:');
      truncatedCriteria.forEach(tc => console.log(`   - ${tc}`));
    } else {
      console.log('✅ NO TRUNCATION DETECTED - All criteria are complete');
    }
    
    console.log('\n3️⃣ Sample Criteria Check');
    console.log('------------------------');
    
    // Display first few criteria to verify they're complete
    console.log('First 3 criteria (showing first 100 chars of originalText):');
    criteria.slice(0, 3).forEach((c, i) => {
      const preview = c.originalText.length > 100 
        ? c.originalText.substring(0, 100) + '...[' + (c.originalText.length - 100) + ' more chars]'
        : c.originalText;
      console.log(`\n${i + 1}. Category: ${c.category}`);
      console.log(`   Length: ${c.originalText.length} characters`);
      console.log(`   Preview: "${preview}"`);
    });
    
    console.log('\n4️⃣ Validation Summary');
    console.log('---------------------');
    
    const allCriteriaComplete = criteria.every(c => 
      c.originalText.length > 20 && 
      !c.originalText.includes('more characters') &&
      !(c.originalText.includes('...') && c.originalText.length < 50)
    );
    
    if (allCriteriaComplete) {
      console.log('✅ SUCCESS: All criteria are complete without truncation');
      console.log('✅ The "24 more characters" issue has been fixed');
    } else {
      console.log('❌ FAILURE: Some criteria are still truncated');
      console.log('⚠️  The issue may persist - further investigation needed');
    }
    
    console.log('\n5️⃣ Cache Status');
    console.log('---------------');
    console.log(`Cache size: ${eligibilityCheckerService.getCacheSize()}`);
    
    // Test caching works
    const startTime = Date.now();
    await eligibilityCheckerService.parseEligibilityCriteria(mockTrial);
    const cacheTime = Date.now() - startTime;
    console.log(`Cache retrieval time: ${cacheTime}ms`);
    console.log(`✅ Caching ${cacheTime < 10 ? 'working properly' : 'may need optimization'}`);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run the test
testTruncationFix();
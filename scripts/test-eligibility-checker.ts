#!/usr/bin/env pnpm tsx

/**
 * Test script for the eligibility checker feature
 * 
 * Tests the complete flow from parsing criteria to generating questions
 * and assessing eligibility based on user responses.
 */

import { eligibilityCheckerService } from '../lib/eligibility-checker/eligibility-checker-service';
import type { ClinicalTrial } from '../lib/tools/clinical-trials/types';
import type { HealthProfile } from '../lib/health-profile-actions';

console.log('🧪 Testing Eligibility Checker System');
console.log('=====================================\n');

// Mock trial with eligibility criteria
const mockTrial: ClinicalTrial = {
  protocolSection: {
    identificationModule: {
      nctId: 'NCT12345678',
      briefTitle: 'Test Clinical Trial for NSCLC'
    },
    eligibilityModule: {
      eligibilityCriteria: `
Inclusion Criteria:
- Age 18 years or older
- Histologically confirmed stage IV NSCLC
- KRAS G12C mutation confirmed
- ECOG performance status 0-2
- Adequate organ function as defined by protocol
- Willing and able to provide informed consent

Exclusion Criteria:
- Active brain metastases requiring treatment
- Prior treatment with KRAS G12C inhibitors
- Concurrent malignancy requiring treatment
- Pregnant or nursing
- Significant cardiovascular disease within 6 months
- Active infection requiring systemic therapy
      `
    }
  }
} as ClinicalTrial;

// Mock health profile
const mockHealthProfile: HealthProfile = {
  id: 'test-profile',
  cancerType: 'NSCLC',
  diseaseStage: 'STAGE_IV',
  molecularMarkers: {
    KRAS_G12C: 'POSITIVE'
  },
  age: 55,
  performanceStatus: 'ECOG_1',
  createdAt: new Date(),
  updatedAt: new Date()
} as HealthProfile;

async function testEligibilityChecker() {
  try {
    console.log('1️⃣ Parsing Eligibility Criteria');
    console.log('----------------------------------');
    
    const criteria = await eligibilityCheckerService.parseEligibilityCriteria(mockTrial);
    
    console.log(`✅ Parsed ${criteria.length} criteria\n`);
    
    // Show first few criteria
    criteria.slice(0, 3).forEach((c, i) => {
      console.log(`Criterion ${i + 1}:`);
      console.log(`  Category: ${c.category}`);
      console.log(`  Original: ${c.originalText}`);
      console.log(`  Interpreted: ${c.interpretation}`);
      console.log(`  Question Type: ${c.questionType}`);
      console.log(`  Criticality: ${c.criticalityScore}\n`);
    });
    
    console.log('2️⃣ Generating Questions');
    console.log('------------------------');
    
    const questions = await eligibilityCheckerService.generateQuestions(
      criteria,
      mockHealthProfile
    );
    
    console.log(`✅ Generated ${questions.length} questions\n`);
    
    // Show first few questions
    questions.slice(0, 3).forEach((q, i) => {
      console.log(`Question ${i + 1}:`);
      console.log(`  ${q.question}`);
      if (q.context) {
        console.log(`  Context: ${q.context}`);
      }
      if (q.helperText) {
        console.log(`  Help: ${q.helperText}`);
      }
      console.log(`  Type: ${q.type}`);
      console.log(`  Category: ${q.category}\n`);
    });
    
    console.log('3️⃣ Simulating User Responses');
    console.log('-----------------------------');
    
    // Mock user responses (all positive for inclusion, negative for exclusion)
    const mockResponses = questions.map(q => ({
      questionId: q.id,
      criterionId: q.criterionId,
      value: q.category === 'INCLUSION' ? true : false,
      timestamp: new Date()
    }));
    
    console.log(`✅ Created ${mockResponses.length} responses\n`);
    
    console.log('4️⃣ Assessing Eligibility');
    console.log('------------------------');
    
    const assessment = await eligibilityCheckerService.assessEligibility(
      mockResponses,
      criteria,
      nctId,
      null
    );
    
    console.log(`Overall Eligibility: ${assessment.overallEligibility}`);
    console.log(`Confidence: ${Math.round(assessment.confidence * 100)}%`);
    
    if (assessment.summary) {
      console.log(`\nSummary: ${assessment.summary}`);
    }
    
    if (assessment.qualifications.length > 0) {
      console.log('\n✅ Qualifying Factors:');
      assessment.qualifications.forEach(q => console.log(`  - ${q}`));
    }
    
    if (assessment.concerns.length > 0) {
      console.log('\n⚠️ Concerns:');
      assessment.concerns.forEach(c => console.log(`  - ${c}`));
    }
    
    console.log('\n✨ Eligibility Check Complete!');
    console.log('==============================\n');
    
    // Test error handling
    console.log('5️⃣ Testing Error Handling');
    console.log('-------------------------');
    
    const emptyTrial: ClinicalTrial = {
      protocolSection: {
        identificationModule: {
          nctId: 'NCT00000000'
        }
      }
    } as ClinicalTrial;
    
    const emptyCriteria = await eligibilityCheckerService.parseEligibilityCriteria(emptyTrial);
    console.log(`✅ Handled empty criteria gracefully: ${emptyCriteria.length} criteria\n`);
    
    console.log('🎉 All Tests Passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testEligibilityChecker();
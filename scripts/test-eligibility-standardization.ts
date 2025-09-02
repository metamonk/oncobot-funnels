/**
 * Test script to verify standardized yes/no/maybe eligibility questions
 * 
 * This script tests that:
 * 1. All questions are framed as yes/no questions
 * 2. ECOG scores are converted to yes/no format
 * 3. Age criteria become yes/no questions
 * 4. All questions have standardized options
 */

import { eligibilityCheckerService } from '../lib/eligibility-checker/eligibility-checker-service';
import type { ClinicalTrial } from '../lib/tools/clinical-trials/types';

// Mock trial with various criteria types
const mockTrial: ClinicalTrial = {
  protocolSection: {
    identificationModule: {
      nctId: 'NCT-TEST-001',
      briefTitle: 'Test Trial for Standardization'
    },
    eligibilityModule: {
      eligibilityCriteria: `
Inclusion Criteria:
* Age ≥ 18 years
* ECOG performance status 0-1
* Stage IV NSCLC with KRAS G12C mutation
* Adequate organ function defined as:
  - Absolute neutrophil count ≥ 1,500/μL
  - Platelets ≥ 100,000/μL
  - Hemoglobin ≥ 9 g/dL
* At least 4 weeks since prior chemotherapy

Exclusion Criteria:
* Active brain metastases
* Prior treatment with KRAS G12C inhibitor
* History of interstitial lung disease
* Pregnant or breastfeeding
* Uncontrolled hypertension (systolic BP > 160 mmHg)
`
    }
  }
} as ClinicalTrial;

async function testStandardization() {
  console.log('🔬 Testing Eligibility Question Standardization\n');
  console.log('=' .repeat(60));
  
  try {
    // Parse criteria with AI
    console.log('\n1️⃣ Parsing eligibility criteria...');
    const criteria = await eligibilityCheckerService.parseEligibilityCriteria(mockTrial);
    console.log(`   ✅ Parsed ${criteria.length} criteria`);
    
    // Generate questions
    console.log('\n2️⃣ Generating questions...');
    const questions = await eligibilityCheckerService.generateQuestions(criteria);
    console.log(`   ✅ Generated ${questions.length} questions`);
    
    // Verify standardization
    console.log('\n3️⃣ Verifying standardization:');
    console.log('=' .repeat(60));
    
    let allStandardized = true;
    const issues: string[] = [];
    
    questions.forEach((q, index) => {
      console.log(`\n📋 Question ${index + 1}:`);
      console.log(`   Category: ${q.category}`);
      console.log(`   Question: "${q.question}"`);
      console.log(`   Type: ${q.type}`);
      console.log(`   Options: ${JSON.stringify(q.options)}`);
      
      // Check if type is BOOLEAN
      if (q.type !== 'BOOLEAN') {
        allStandardized = false;
        issues.push(`Question ${index + 1} has type ${q.type} instead of BOOLEAN`);
      }
      
      // Check if options are standardized
      const expectedOptions = ['Yes', 'No', 'Maybe/Uncertain'];
      if (!q.options || JSON.stringify(q.options) !== JSON.stringify(expectedOptions)) {
        allStandardized = false;
        issues.push(`Question ${index + 1} has non-standard options: ${JSON.stringify(q.options)}`);
      }
      
      // Check for specific conversions
      const questionText = q.question.toLowerCase();
      
      // Check ECOG conversion
      if (questionText.includes('ecog') && !questionText.includes('do you') && !questionText.includes('is your')) {
        issues.push(`ECOG question not properly converted to yes/no format`);
      }
      
      // Check age conversion  
      if (questionText.includes('age') && questionText.includes('what is')) {
        issues.push(`Age question still asking for numeric value instead of yes/no`);
      }
    });
    
    // Report results
    console.log('\n' + '=' .repeat(60));
    console.log('📊 STANDARDIZATION RESULTS:');
    console.log('=' .repeat(60));
    
    if (allStandardized && issues.length === 0) {
      console.log('✅ SUCCESS: All questions are properly standardized!');
      console.log('   - All questions use BOOLEAN type');
      console.log('   - All questions have Yes/No/Maybe options');
      console.log('   - Numeric criteria converted to yes/no format');
    } else {
      console.log('⚠️ ISSUES FOUND:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    // Test specific examples
    console.log('\n4️⃣ Checking specific conversions:');
    console.log('=' .repeat(60));
    
    const ecogQuestion = questions.find(q => q.question.toLowerCase().includes('ecog'));
    if (ecogQuestion) {
      console.log('\n✓ ECOG Question:');
      console.log(`  "${ecogQuestion.question}"`);
      const isProperlyConverted = ecogQuestion.question.includes('1 or less') || 
                                   ecogQuestion.question.includes('0 or 1') ||
                                   ecogQuestion.question.includes('0-1');
      console.log(`  Properly converted: ${isProperlyConverted ? '✅' : '❌'}`);
    }
    
    const ageQuestion = questions.find(q => q.question.toLowerCase().includes('age') || q.question.toLowerCase().includes('18'));
    if (ageQuestion) {
      console.log('\n✓ Age Question:');
      console.log(`  "${ageQuestion.question}"`);
      const isProperlyConverted = ageQuestion.question.includes('Are you') || 
                                   ageQuestion.question.includes('Do you');
      console.log(`  Properly converted: ${isProperlyConverted ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error during testing:', error);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('Test complete!');
  process.exit(0);
}

// Run the test
testStandardization();
#!/usr/bin/env tsx

/**
 * Test the eligibility checker service directly
 * Following AI-DRIVEN ARCHITECTURE PRINCIPLE from CLAUDE.md
 */

import { config } from 'dotenv';
import { EligibilityCheckerService } from '../lib/eligibility-checker/eligibility-checker-service';

config({ path: '.env.local' });

// Real eligibility criteria examples
const testCases = [
  {
    nctId: 'NCT03785249',
    rawText: `
Inclusion Criteria:
- Age 18 Years and older
- ECOG performance status should be 0 or 1
- Patient must be able to swallow pills
- Documented NSCLC with confirmed KRAS G12C mutation

Exclusion Criteria:
- Active brain metastases
- Prior treatment with KRAS G12C inhibitor
- Uncontrolled hypertension
    `
  },
  {
    nctId: 'NCT04123456',
    rawText: `
Inclusion Criteria:
- Histologically confirmed NSCLC
- Measurable disease per RECIST 1.1
- Adequate organ function defined as absolute neutrophil count ≥1500/μL
- Life expectancy greater than 3 months

Exclusion Criteria:
- Pregnancy or breastfeeding
- Active autoimmune disease requiring systemic treatment
    `
  }
];

async function testServiceQuestionGeneration() {
  console.log('🧪 Testing Eligibility Service Question Generation\n');
  console.log('============================================================');
  console.log('AI-DRIVEN ARCHITECTURE: Relying on GPT-4o intelligence');
  console.log('============================================================\n');

  const service = new EligibilityCheckerService();

  for (const testCase of testCases) {
    console.log(`\n📋 Testing ${testCase.nctId}`);
    console.log('-----------------------------------------------------------');

    try {
      // Parse the criteria
      const parsed = await service.parseEligibilityCriteria(
        testCase.nctId,
        testCase.rawText
      );

      if (!parsed || !parsed.criteria) {
        throw new Error('Failed to parse criteria');
      }

      console.log(`\n✅ Parsed ${parsed.criteria.length} criteria\n`);

      // Analyze each question
      let properQuestions = 0;
      let statements = 0;
      const questionStarters = [
        'Are ', 'Do ', 'Have ', 'Is ', 'Was ', 'Were ',
        'Did ', 'Will ', 'Would ', 'Can ', 'Could ', 'Should '
      ];

      parsed.criteria.forEach((criterion, index) => {
        const question = criterion.question;
        const isProperQuestion = questionStarters.some(starter => 
          question.startsWith(starter)
        );

        if (isProperQuestion) {
          properQuestions++;
          console.log(`   ✅ Q${index + 1}: "${question}"`);
        } else {
          statements++;
          console.log(`   ❌ Q${index + 1}: "${question}" (Statement, not a question)`);
        }
        
        console.log(`      Category: ${criterion.category}`);
        console.log(`      Original: "${criterion.originalText}"`);
        console.log('');
      });

      // Summary
      const successRate = (properQuestions / (properQuestions + statements)) * 100;
      console.log(`📊 Results:`);
      console.log(`   ✅ Proper questions: ${properQuestions}`);
      console.log(`   ❌ Statements: ${statements}`);
      console.log(`   📈 Success rate: ${successRate.toFixed(1)}%`);
      
      if (successRate === 100) {
        console.log(`   🎉 Perfect! All questions are grammatically correct!`);
      } else if (successRate >= 80) {
        console.log(`   👍 Good! Most questions are properly formatted.`);
      } else {
        console.log(`   ⚠️ Needs improvement - too many statements instead of questions.`);
      }

    } catch (error) {
      console.error(`❌ Error testing ${testCase.nctId}:`, error);
    }
  }

  console.log('\n============================================================');
  console.log('Test Complete!');
  console.log('\nKey Insight: With AI-DRIVEN approach, the system adapts');
  console.log('to various criteria formats without brittle conditionals.');
  console.log('============================================================\n');
}

// Run the test
testServiceQuestionGeneration().catch(console.error);
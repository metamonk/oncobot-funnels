#!/usr/bin/env tsx

/**
 * Test script to verify API-generated questions are grammatically correct
 * Following AI-DRIVEN ARCHITECTURE PRINCIPLE from CLAUDE.md
 */

import { config } from 'dotenv';

config({ path: '.env.local' });

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Test eligibility criteria from real trials
const testCriteria = [
  {
    nctId: 'NCT03785249',
    criteria: [
      "Age 18 Years and older",
      "ECOG performance status should be 0 or 1",
      "Patient must be able to swallow pills",
      "Prior chemotherapy treatment",
      "Active brain metastases"
    ]
  },
  {
    nctId: 'NCT04123456',
    criteria: [
      "Histologically confirmed NSCLC",
      "Measurable disease per RECIST 1.1",
      "Adequate organ function",
      "Life expectancy greater than 3 months",
      "Uncontrolled hypertension"
    ]
  }
];

async function testAPIQuestionGeneration() {
  console.log('🧪 Testing API Question Generation\n');
  console.log('============================================================');
  console.log('Following AI-DRIVEN ARCHITECTURE PRINCIPLE from CLAUDE.md');
  console.log('============================================================\n');

  for (const trial of testCriteria) {
    console.log(`\n📋 Testing NCT ID: ${trial.nctId}`);
    console.log('-----------------------------------------------------------');

    try {
      // Call the parse API
      const response = await fetch(`${API_URL}/api/eligibility/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nctId: trial.nctId,
          criteriaText: trial.criteria.join('\n')
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.criteria) {
        throw new Error('Invalid API response structure');
      }

      // Check each generated question
      console.log('\n📝 Generated Questions:\n');
      let properQuestions = 0;
      let improperQuestions = 0;

      result.criteria.forEach((criterion: any, index: number) => {
        const question = criterion.question;
        const isProperQuestion = 
          question.startsWith('Are ') ||
          question.startsWith('Do ') ||
          question.startsWith('Have ') ||
          question.startsWith('Is ') ||
          question.startsWith('Was ') ||
          question.startsWith('Were ') ||
          question.startsWith('Did ') ||
          question.startsWith('Will ') ||
          question.startsWith('Would ') ||
          question.startsWith('Can ') ||
          question.startsWith('Could ') ||
          question.startsWith('Should ');

        const icon = isProperQuestion ? '✅' : '❌';
        
        if (isProperQuestion) {
          properQuestions++;
        } else {
          improperQuestions++;
        }

        console.log(`   ${icon} Q${index + 1}: "${question}"`);
        console.log(`      Original: "${trial.criteria[index] || 'N/A'}"`);
        console.log(`      Category: ${criterion.category}`);
        console.log('');
      });

      // Summary for this trial
      console.log(`\n📊 Results for ${trial.nctId}:`);
      console.log(`   ✅ Proper questions: ${properQuestions}`);
      console.log(`   ❌ Improper questions: ${improperQuestions}`);
      console.log(`   Success rate: ${((properQuestions / (properQuestions + improperQuestions)) * 100).toFixed(1)}%`);

    } catch (error) {
      console.error(`❌ Error testing ${trial.nctId}:`, error);
    }
  }

  console.log('\n============================================================');
  console.log('✅ API Question Generation Test Complete!');
  console.log('============================================================\n');
}

// Run the test
testAPIQuestionGeneration().catch(console.error);
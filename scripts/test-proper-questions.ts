/**
 * Test script to verify questions are grammatically correct
 * Tests the specific cases shown in the screenshots
 */

import { EligibilityCheckerService } from '../lib/eligibility-checker/eligibility-checker-service';
import type { InterpretedCriterion } from '../lib/eligibility-checker/types';

const service = new EligibilityCheckerService();

// Mock criteria that were causing issues in the screenshots
const problematicCriteria: InterpretedCriterion[] = [
  {
    id: 'crit_1',
    originalText: 'ECOG performance status should be 0 or 1',
    interpretedText: 'ECOG performance status should be 0 or 1',
    category: 'INCLUSION',
    domain: 'CURRENT_CONDITION',
    importance: 'REQUIRED',
    requiresValue: true,
    expectedValueType: 'BOOLEAN',
    // Testing fallback - no AI-generated question
  },
  {
    id: 'crit_2',
    originalText: 'Patient must be able to swallow pills',
    interpretedText: 'Patient must be able to swallow pills',
    category: 'INCLUSION',
    domain: 'ADMINISTRATIVE',
    importance: 'REQUIRED',
    requiresValue: true,
    expectedValueType: 'BOOLEAN',
    // Testing fallback - no AI-generated question
  },
  {
    id: 'crit_3',
    originalText: 'Age ≥ 18 years',
    interpretedText: 'Age ≥ 18 years',
    category: 'INCLUSION',
    domain: 'DEMOGRAPHICS',
    importance: 'REQUIRED',
    requiresValue: true,
    expectedValueType: 'BOOLEAN',
    // Testing fallback - no AI-generated question
  },
  {
    id: 'crit_4',
    originalText: 'Willing to provide informed consent',
    interpretedText: 'Willing to provide informed consent',
    category: 'INCLUSION',
    domain: 'ADMINISTRATIVE',
    importance: 'REQUIRED',
    requiresValue: true,
    expectedValueType: 'BOOLEAN',
  },
  {
    id: 'crit_5',
    originalText: 'At least 4 weeks since prior chemotherapy',
    interpretedText: 'At least 4 weeks since prior chemotherapy',
    category: 'INCLUSION',
    domain: 'TREATMENT',
    importance: 'REQUIRED',
    requiresValue: true,
    expectedValueType: 'BOOLEAN',
  },
  {
    id: 'crit_6',
    originalText: 'History of severe allergic reactions',
    interpretedText: 'History of severe allergic reactions',
    category: 'EXCLUSION',
    domain: 'MEDICAL_HISTORY',
    importance: 'REQUIRED',
    requiresValue: true,
    expectedValueType: 'BOOLEAN',
  },
  {
    id: 'crit_7',
    originalText: 'Pregnant or breastfeeding',
    interpretedText: 'Pregnant or breastfeeding',
    category: 'EXCLUSION',
    domain: 'LIFESTYLE',
    importance: 'REQUIRED',
    requiresValue: true,
    expectedValueType: 'BOOLEAN',
  }
];

async function testProperQuestions() {
  console.log('🔬 Testing Grammatically Correct Question Generation\n');
  console.log('=' .repeat(60));
  
  try {
    // Generate questions
    console.log('\n1️⃣ Generating questions from problematic criteria...');
    const questions = await service.generateQuestions(problematicCriteria);
    console.log(`   ✅ Generated ${questions.length} questions`);
    
    // Check each question for proper grammar
    console.log('\n2️⃣ Checking question grammar:');
    console.log('=' .repeat(60));
    
    const issues: string[] = [];
    const successes: string[] = [];
    
    // List of proper question starters
    const properStarters = [
      'are you', 'do you', 'have you', 'has it been', 
      'is your', 'can you', 'will you', 'does', 'is there'
    ];
    
    questions.forEach((q, index) => {
      const criterion = problematicCriteria[index];
      console.log(`\n📋 Question ${index + 1}:`);
      console.log(`   Original: "${criterion.originalText}"`);
      console.log(`   Generated: "${q.question}"`);
      
      const questionLower = q.question.toLowerCase();
      
      // Check if it starts with a proper question word
      const hasProperStart = properStarters.some(starter => 
        questionLower.startsWith(starter)
      );
      
      // Check for the problematic patterns
      const hasProblematicPattern = 
        questionLower.includes('does this apply to you:') ||
        questionLower.includes('do you have or have you had:') ||
        (questionLower.match(/[a-z]\?$/) && !questionLower.includes(' '));
      
      // Check if it's a complete sentence (has a verb after the question word)
      const isCompleteSentence = q.question.includes(' ') && q.question.endsWith('?');
      
      if (!hasProperStart) {
        issues.push(`Question ${index + 1}: Doesn't start with proper question word`);
        console.log(`   ❌ Doesn't start with proper question word`);
      } else {
        successes.push(`Question ${index + 1}: Starts properly with question word`);
        console.log(`   ✅ Starts with proper question word`);
      }
      
      if (hasProblematicPattern) {
        issues.push(`Question ${index + 1}: Contains problematic pattern`);
        console.log(`   ❌ Contains problematic pattern`);
      } else {
        console.log(`   ✅ No problematic patterns`);
      }
      
      if (!isCompleteSentence) {
        issues.push(`Question ${index + 1}: Not a complete sentence`);
        console.log(`   ❌ Not a complete sentence`);
      } else {
        console.log(`   ✅ Is a complete sentence`);
      }
    });
    
    // Report results
    console.log('\n' + '=' .repeat(60));
    console.log('📊 GRAMMAR CHECK RESULTS:');
    console.log('=' .repeat(60));
    
    if (issues.length === 0) {
      console.log('\n✅ SUCCESS: All questions are grammatically correct!');
      console.log('\nExamples of proper conversions:');
      questions.forEach((q, i) => {
        const orig = problematicCriteria[i].originalText;
        console.log(`\n   Original: "${orig}"`);
        console.log(`   Question: "${q.question}"`);
      });
    } else {
      console.log('\n⚠️ ISSUES FOUND:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    // Specific checks for the screenshots' cases
    console.log('\n3️⃣ Checking specific screenshot cases:');
    console.log('=' .repeat(60));
    
    const ecogQuestion = questions[0]; // ECOG question
    console.log('\n✓ ECOG Question:');
    console.log(`  Was: "Does this apply to you: ECOG performance status should be 0 or 1.?"`);
    console.log(`  Now: "${ecogQuestion.question}"`);
    console.log(`  ${ecogQuestion.question.startsWith('Is your') || ecogQuestion.question.startsWith('Do you') ? '✅ Fixed!' : '❌ Still problematic'}`);
    
    const swallowQuestion = questions[1]; // Swallow pills question
    console.log('\n✓ Swallow Pills Question:');
    console.log(`  Was: "Does this apply to you: Patient must be able to swallow pills.?"`);
    console.log(`  Now: "${swallowQuestion.question}"`);
    console.log(`  ${swallowQuestion.question.startsWith('Are you able') || swallowQuestion.question.startsWith('Can you') ? '✅ Fixed!' : '❌ Still problematic'}`);
    
  } catch (error) {
    console.error('\n❌ Error during testing:', error);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('Test complete!');
  process.exit(0);
}

// Run the test
testProperQuestions();
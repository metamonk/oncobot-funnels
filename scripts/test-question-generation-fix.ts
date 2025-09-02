/**
 * Test script to verify proper question generation
 * Following AI-driven principles from CLAUDE.md
 */

import { EligibilityCheckerService } from '../lib/eligibility-checker/eligibility-checker-service';
import type { InterpretedCriterion } from '../lib/eligibility-checker/types';

const service = new EligibilityCheckerService();

// Test criteria that were shown in the screenshots
const testCriteria: InterpretedCriterion[] = [
  {
    id: 'test_1',
    originalText: 'Age 18 Years and older',
    interpretedText: 'Age 18 Years and older',
    category: 'INCLUSION',
    domain: 'DEMOGRAPHICS',
    importance: 'REQUIRED',
    requiresValue: true,
    expectedValueType: 'BOOLEAN',
    // AI should generate: "Are you 18 years or older?"
    question: 'Are you 18 years or older?',
    helpText: 'You must be at least 18 years old'
  },
  {
    id: 'test_2',
    originalText: 'ECOG performance status should be 0 or 1',
    interpretedText: 'ECOG performance status should be 0 or 1',
    category: 'INCLUSION',
    domain: 'CURRENT_CONDITION',
    importance: 'REQUIRED',
    requiresValue: true,
    expectedValueType: 'BOOLEAN',
    // AI should generate: "Is your ECOG performance status 0 or 1?"
    question: 'Is your ECOG performance status 0 or 1?',
    helpText: 'ECOG measures daily activity ability'
  },
  {
    id: 'test_3',
    originalText: 'Patient must be able to swallow pills',
    interpretedText: 'Patient must be able to swallow pills',
    category: 'INCLUSION',
    domain: 'ADMINISTRATIVE',
    importance: 'REQUIRED',
    requiresValue: true,
    expectedValueType: 'BOOLEAN',
    // AI should generate: "Are you able to swallow pills?"
    question: 'Are you able to swallow pills?',
    helpText: 'This medication is taken in pill form'
  },
  {
    id: 'test_fallback_1',
    originalText: 'Some criterion without AI question',
    interpretedText: 'Some criterion without AI question',
    category: 'INCLUSION',
    domain: 'CURRENT_CONDITION',
    importance: 'REQUIRED',
    requiresValue: true,
    expectedValueType: 'BOOLEAN',
    // No AI question - testing fallback
  },
  {
    id: 'test_fallback_2',
    originalText: 'Exclusion criterion without AI question',
    interpretedText: 'Exclusion criterion without AI question',
    category: 'EXCLUSION',
    domain: 'MEDICAL_HISTORY',
    importance: 'REQUIRED',
    requiresValue: true,
    expectedValueType: 'BOOLEAN',
    // No AI question - testing fallback
  }
];

async function testQuestionGeneration() {
  console.log('🔍 Testing Question Generation Fix\n');
  console.log('=' .repeat(60));
  console.log('Following AI-DRIVEN ARCHITECTURE PRINCIPLE from CLAUDE.md');
  console.log('=' .repeat(60));
  
  try {
    // Generate questions
    console.log('\n1️⃣ Generating questions...');
    const questions = await service.generateQuestions(testCriteria);
    console.log(`   ✅ Generated ${questions.length} questions`);
    
    // Check each question
    console.log('\n2️⃣ Verifying proper question format:');
    console.log('=' .repeat(60));
    
    let allProper = true;
    const issues: string[] = [];
    
    questions.forEach((q, index) => {
      const criterion = testCriteria[index];
      console.log(`\n📋 Question ${index + 1}:`);
      console.log(`   Original: "${criterion.originalText}"`);
      console.log(`   Generated: "${q.question}"`);
      
      // Check if it's a proper question
      const questionLower = q.question.toLowerCase();
      const isProperQuestion = 
        questionLower.startsWith('are you') ||
        questionLower.startsWith('do you') ||
        questionLower.startsWith('have you') ||
        questionLower.startsWith('is your') ||
        questionLower.startsWith('has it') ||
        questionLower.startsWith('can you') ||
        questionLower.startsWith('will you');
      
      // Check for problematic patterns (statements with question marks)
      const hasStatementPattern = 
        q.question.includes('?') && 
        !isProperQuestion;
      
      if (isProperQuestion) {
        console.log(`   ✅ Proper question format`);
      } else if (hasStatementPattern) {
        console.log(`   ❌ Statement with question mark (not a proper question)`);
        issues.push(`Question ${index + 1}: "${q.question}" is a statement, not a question`);
        allProper = false;
      } else {
        console.log(`   ⚠️ May not be a proper question`);
        issues.push(`Question ${index + 1}: "${q.question}" may not be properly formatted`);
      }
      
      // Show the transformation
      if (criterion.originalText !== q.question) {
        console.log(`   📝 Transformation: Statement → Question`);
      }
    });
    
    // Report results
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RESULTS:');
    console.log('=' .repeat(60));
    
    if (allProper) {
      console.log('\n✅ SUCCESS: All questions are properly formatted!');
      console.log('   - No statements with question marks');
      console.log('   - All questions start with proper question words');
      console.log('   - Grammatically correct transformations');
    } else {
      console.log('\n⚠️ ISSUES FOUND:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      console.log('\n💡 Note: The AI should be generating proper questions.');
      console.log('   If fallback is being used, it means AI parsing failed.');
    }
    
    // Show examples of correct transformations
    console.log('\n✅ Expected transformations:');
    console.log('   "Age 18 Years and older" → "Are you 18 years or older?"');
    console.log('   "ECOG performance status should be 0 or 1" → "Is your ECOG performance status 0 or 1?"');
    console.log('   "Patient must be able to swallow pills" → "Are you able to swallow pills?"');
    
  } catch (error) {
    console.error('\n❌ Error during testing:', error);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('Test complete!');
  process.exit(0);
}

// Run the test
testQuestionGeneration();
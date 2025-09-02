#!/usr/bin/env pnpm tsx

/**
 * Test script to identify the source of truncation in eligibility criteria parsing
 * This tests the complete flow from fetching a real trial to parsing it
 */

import { eligibilityCheckerService } from '../lib/eligibility-checker/eligibility-checker-service';
import type { ClinicalTrial } from '../lib/tools/clinical-trials/types';

console.log('🔬 Testing Eligibility Criteria Parsing Issue');
console.log('=============================================\n');

async function fetchRealTrial(nctId: string): Promise<ClinicalTrial> {
  const apiUrl = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
  
  console.log(`📥 Fetching trial ${nctId} from ClinicalTrials.gov...`);
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data as ClinicalTrial;
  } catch (error) {
    console.error('Error fetching trial:', error);
    throw error;
  }
}

async function testParsingFlow(nctId: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing ${nctId}`);
  console.log('='.repeat(60));
  
  try {
    // Step 1: Fetch the real trial
    const trial = await fetchRealTrial(nctId);
    console.log('✅ Trial fetched successfully\n');
    
    // Step 2: Check eligibility criteria structure
    const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
    
    if (!eligibilityCriteria) {
      console.log('❌ No eligibility criteria found in trial');
      return;
    }
    
    console.log('📋 Raw Eligibility Criteria:');
    console.log(`  Length: ${eligibilityCriteria.length} characters`);
    console.log(`  First 200 chars: "${eligibilityCriteria.substring(0, 200)}..."`);
    console.log('');
    
    // Step 3: Parse using our service
    console.log('🤖 Parsing with EligibilityCheckerService...');
    const parsedCriteria = await eligibilityCheckerService.parseEligibilityCriteria(trial);
    
    console.log(`✅ Parsed ${parsedCriteria.length} criteria\n`);
    
    // Step 4: Examine parsed criteria for truncation
    console.log('🔍 Checking for truncation in parsed criteria:');
    let truncationFound = false;
    
    parsedCriteria.forEach((criterion, index) => {
      // Check for truncation markers
      const truncationPatterns = [
        'more characters',
        '...',
        'characters)',
        '\\d+ more',
        'truncated'
      ];
      
      const hasMarkers = truncationPatterns.some(pattern => {
        const regex = new RegExp(pattern, 'i');
        return regex.test(criterion.originalText) || 
               regex.test(criterion.interpretation) || 
               regex.test(criterion.question);
      });
      
      if (hasMarkers) {
        truncationFound = true;
        console.log(`\n  ⚠️ TRUNCATION FOUND in criterion ${index + 1}:`);
        console.log(`     Original: "${criterion.originalText}"`);
        console.log(`     Interpretation: "${criterion.interpretation}"`);
        console.log(`     Question: "${criterion.question}"`);
      }
    });
    
    if (!truncationFound) {
      console.log('  ✅ No truncation detected in parsed criteria');
    }
    
    // Step 5: Generate questions and check for truncation there
    console.log('\n📝 Generating questions...');
    const questions = await eligibilityCheckerService.generateQuestions(parsedCriteria);
    
    console.log(`✅ Generated ${questions.length} questions\n`);
    
    console.log('🔍 Checking for truncation in questions:');
    let questionTruncationFound = false;
    
    questions.forEach((question, index) => {
      const truncationPatterns = [
        'more characters',
        '\\(\\d+ more',
        'characters\\)',
        'truncated'
      ];
      
      const hasMarkers = truncationPatterns.some(pattern => {
        const regex = new RegExp(pattern, 'i');
        return regex.test(question.question) || 
               (question.helperText && regex.test(question.helperText)) ||
               (question.context && regex.test(question.context));
      });
      
      if (hasMarkers) {
        questionTruncationFound = true;
        console.log(`\n  ⚠️ TRUNCATION FOUND in question ${index + 1}:`);
        console.log(`     Question: "${question.question}"`);
        if (question.helperText) {
          console.log(`     Helper: "${question.helperText}"`);
        }
        if (question.context) {
          console.log(`     Context: "${question.context}"`);
        }
      }
    });
    
    if (!questionTruncationFound) {
      console.log('  ✅ No truncation detected in questions');
    }
    
    // Step 6: Show sample of parsed data
    console.log('\n📊 Sample of parsed criteria (first 3):');
    parsedCriteria.slice(0, 3).forEach((criterion, index) => {
      console.log(`\n  Criterion ${index + 1}:`);
      console.log(`    Category: ${criterion.category}`);
      console.log(`    Original (length ${criterion.originalText.length}): "${criterion.originalText.substring(0, 100)}${criterion.originalText.length > 100 ? '...' : ''}"`);
      console.log(`    Interpretation (length ${criterion.interpretation.length}): "${criterion.interpretation.substring(0, 100)}${criterion.interpretation.length > 100 ? '...' : ''}"`);
      console.log(`    Question (length ${criterion.question.length}): "${criterion.question}"`);
    });
    
    // Step 7: Show sample of questions
    console.log('\n📊 Sample of questions (first 3):');
    questions.slice(0, 3).forEach((question, index) => {
      console.log(`\n  Question ${index + 1}:`);
      console.log(`    Text (length ${question.question.length}): "${question.question}"`);
      console.log(`    Type: ${question.type}`);
      console.log(`    Category: ${question.category}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function runTests() {
  // Test the specific trial the user mentioned
  await testParsingFlow('NCT05568550');
  
  // Test another trial for comparison
  await testParsingFlow('NCT03337698');
  
  console.log('\n✨ Testing complete!');
  console.log('\n📌 Summary:');
  console.log('  - If truncation is found, it\'s happening in the AI parsing');
  console.log('  - If no truncation is found, the issue might be elsewhere');
  console.log('  - Check the console output above for details');
}

// Run the tests
runTests();
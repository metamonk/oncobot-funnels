#!/usr/bin/env pnpm tsx

/**
 * Test if the prompt is causing the AI to stop early
 * NCT06497556 should have 20 criteria but only returns 3
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('🔍 Testing Prompt Issue for NCT06497556');
console.log('========================================\n');

async function testPromptIssue() {
  const nctId = 'NCT06497556';
  
  // Fetch trial
  const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
  const response = await fetch(url);
  const trial = await response.json();
  
  const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
  
  console.log('📝 Eligibility Criteria Analysis');
  console.log('-'.repeat(40));
  
  // Look for patterns that might confuse the AI
  const lines = eligibilityCriteria.split('\n');
  
  console.log(`Total lines: ${lines.length}`);
  console.log('\nFirst 10 lines:');
  lines.slice(0, 10).forEach((line, i) => {
    console.log(`${i + 1}: ${line}`);
  });
  
  // Check for special characters or formatting
  console.log('\n🔍 Special Character Analysis:');
  
  const hasSpecialChars = {
    'backslash': eligibilityCriteria.includes('\\'),
    'greaterThan': eligibilityCriteria.includes('>'),
    'lessThan': eligibilityCriteria.includes('<'),
    'equals': eligibilityCriteria.includes('>=') || eligibilityCriteria.includes('<='),
    'asterisk': eligibilityCriteria.includes('*'),
    'parentheses': eligibilityCriteria.includes('(') && eligibilityCriteria.includes(')'),
  };
  
  Object.entries(hasSpecialChars).forEach(([char, found]) => {
    console.log(`  ${char}: ${found ? '✓' : '✗'}`);
  });
  
  // Check the specific line that might be causing issues
  console.log('\n📋 Checking Line 7 (where parsing might stop):');
  if (lines[6]) {
    console.log(`Line 7: "${lines[6]}"`);
    console.log(`Length: ${lines[6].length}`);
    console.log(`Contains \\>=: ${lines[6].includes('\\>=')}`);
  }
  
  // Test with escaped version
  console.log('\n🔧 Testing escaped version:');
  const escapedCriteria = eligibilityCriteria.replace(/\\/g, '\\\\');
  const escapedLines = escapedCriteria.split('\n');
  
  console.log('Line 7 escaped:', escapedLines[6]);
  
  // Check if there's an issue with the JSON structure
  console.log('\n📊 JSON Safety Check:');
  
  // Test if the criteria text can be safely put in JSON
  try {
    const testObj = {
      criteria: eligibilityCriteria
    };
    const jsonStr = JSON.stringify(testObj);
    const parsed = JSON.parse(jsonStr);
    console.log('✅ Criteria can be safely JSON encoded');
  } catch (e) {
    console.log('❌ JSON encoding issue:', e);
  }
  
  // Look for the exact point where it stops
  console.log('\n🎯 Finding where AI stops parsing:');
  
  let bulletCount = 0;
  let lastParsedLine = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('*')) {
      bulletCount++;
      if (bulletCount <= 3) {
        console.log(`Bullet ${bulletCount} at line ${i + 1}: ${line.substring(0, 50)}...`);
        lastParsedLine = i;
      }
    }
  }
  
  if (lastParsedLine >= 0 && lastParsedLine < lines.length - 1) {
    console.log(`\n⚠️ AI stops after line ${lastParsedLine + 1}`);
    console.log(`Next line (${lastParsedLine + 2}): "${lines[lastParsedLine + 1]}"`);
    
    // Check if there's something special about the next line
    const nextLine = lines[lastParsedLine + 1];
    if (nextLine.includes('\\>=')) {
      console.log('🔴 FOUND ISSUE: Next line contains "\\>=" which might break parsing!');
      console.log('   This special character sequence might cause the AI to stop.');
    }
  }
  
  // Test the fallback parser
  console.log('\n🔄 Testing Fallback Parser:');
  const { eligibilityCheckerService } = require('../lib/eligibility-checker');
  
  // Use the private simpleParser method indirectly
  const simpleParserTest = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const criteria: any[] = [];
    let currentSection = 'INCLUSION';
    
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      
      if (lineLower.includes('inclusion')) {
        currentSection = 'INCLUSION';
        continue;
      }
      if (lineLower.includes('exclusion')) {
        currentSection = 'EXCLUSION';
        continue;
      }
      
      if (line.length < 10 || lineLower.includes('criteria:')) {
        continue;
      }
      
      const cleanedLine = line
        .replace(/^[-•*]\s*/, '')
        .replace(/^\d+\.\s*/, '')
        .trim();
      
      if (cleanedLine.length < 5) {
        continue;
      }
      
      criteria.push({
        category: currentSection,
        text: cleanedLine.substring(0, 50) + '...'
      });
    }
    
    return criteria;
  };
  
  const fallbackResult = simpleParserTest(eligibilityCriteria);
  console.log(`Fallback parser found: ${fallbackResult.length} criteria`);
  
  const fallbackInc = fallbackResult.filter(c => c.category === 'INCLUSION').length;
  const fallbackExc = fallbackResult.filter(c => c.category === 'EXCLUSION').length;
  console.log(`  Inclusion: ${fallbackInc}`);
  console.log(`  Exclusion: ${fallbackExc}`);
}

// Run test
testPromptIssue().catch(console.error);
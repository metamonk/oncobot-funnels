#!/usr/bin/env pnpm tsx

/**
 * Debug why bullet counting is failing
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

async function debugCounting() {
  const response = await fetch('https://clinicaltrials.gov/api/v2/studies/NCT06119581');
  const trial = await response.json();
  
  const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
  
  if (!eligibilityCriteria) {
    console.log('No criteria found');
    return;
  }
  
  console.log('📊 DEBUGGING BULLET COUNTING FOR NCT06119581');
  console.log('=============================================\n');
  
  // Method 1: Current method from route.ts
  const criteriaLines = eligibilityCriteria.split('\n');
  let expectedCount = 0;
  for (const line of criteriaLines) {
    if (/^\s*[\*\-•]/.test(line) || /^\s*\d+\./.test(line) || /^-{2,3}\s/.test(line)) {
      expectedCount++;
    }
  }
  console.log(`Method 1 (current): ${expectedCount} bullets found`);
  
  // Method 2: Look for asterisks anywhere
  let method2Count = 0;
  for (const line of criteriaLines) {
    if (line.includes('*')) {
      method2Count++;
    }
  }
  console.log(`Method 2 (includes *): ${method2Count} bullets found`);
  
  // Method 3: More specific regex
  let method3Count = 0;
  const bulletCriteria: string[] = [];
  for (const line of criteriaLines) {
    // Match * at start with any amount of whitespace (including multiple spaces)
    if (/^\s*\*\s+/.test(line)) {
      method3Count++;
      bulletCriteria.push(line.trim().substring(0, 50) + '...');
    }
  }
  console.log(`Method 3 (specific regex): ${method3Count} bullets found`);
  
  // Method 4: Check for different bullet types
  let asteriskCount = 0;
  let dashCount = 0;
  let doubleDashCount = 0;
  
  for (const line of criteriaLines) {
    if (/^\s*\*/.test(line)) asteriskCount++;
    if (/^\s*-\s/.test(line)) dashCount++;
    if (/^\s*--/.test(line)) doubleDashCount++;
  }
  
  console.log(`\n📋 Bullet type breakdown:`);
  console.log(`  Asterisks (*): ${asteriskCount}`);
  console.log(`  Single dash (-): ${dashCount}`);
  console.log(`  Double dash (--): ${doubleDashCount}`);
  
  // Show first few bullets found
  console.log('\n📝 Sample bullets found:');
  bulletCriteria.slice(0, 5).forEach((b, i) => {
    console.log(`  ${i + 1}. ${b}`);
  });
  
  // Debug: Show lines that look like bullets but weren't counted
  console.log('\n🔍 Checking for edge cases:');
  let lineNum = 0;
  for (const line of criteriaLines) {
    lineNum++;
    // If line has asterisk but wasn't counted by method 1
    if (line.includes('*') && !/^\s*[\*\-•]/.test(line)) {
      console.log(`  Line ${lineNum}: Not counted but has *`);
      console.log(`    Content: "${line.substring(0, 60)}..."`);
      console.log(`    Char codes at start: [${line.substring(0, 10).split('').map(c => c.charCodeAt(0)).join(', ')}]`);
    }
  }
  
  // The correct answer
  console.log('\n✅ CORRECT ANSWER: NCT06119581 has 21 total criteria (we confirmed this manually)');
  console.log(`❌ CURRENT CODE: Finding only ${expectedCount} criteria`);
  
  if (expectedCount !== 21) {
    console.log('\n🚨 BUG CONFIRMED: Bullet counting logic is broken!');
  }
}

debugCounting().catch(console.error);
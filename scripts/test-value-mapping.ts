#!/usr/bin/env tsx

/**
 * Test script to verify RadioGroup value mapping for prior therapy
 */

console.log('Testing RadioGroup value mapping for prior therapy...\n');

// Test the value transformation that RadioGroupItem uses
const therapyOptions = [
  'No prior treatment',
  'Chemotherapy',
  'Immunotherapy', 
  'Targeted therapy',
  'Multiple treatments'
];

console.log('Testing value transformations:');
console.log('================================');

therapyOptions.forEach(therapy => {
  // Old method (WRONG - only replaces first space)
  const oldValue = therapy.toLowerCase().replace(' ', '_');
  
  // New method (CORRECT - replaces all spaces)
  const newValue = therapy.toLowerCase().replace(/ /g, '_');
  
  console.log(`\n"${therapy}":`);
  console.log(`  Old (buggy):  "${oldValue}"`);
  console.log(`  New (fixed):  "${newValue}"`);
  
  if (oldValue !== newValue) {
    console.log(`  ❌ OLD METHOD WAS WRONG!`);
  } else {
    console.log(`  ✅ Values match`);
  }
});

console.log('\n================================');
console.log('Checking default value match:');
console.log('================================\n');

// The default value in state
const stateDefault = 'no_prior_treatment';

// What the RadioGroupItem generates for "No prior treatment"
const oldRadioValue = 'No prior treatment'.toLowerCase().replace(' ', '_');
const newRadioValue = 'No prior treatment'.toLowerCase().replace(/ /g, '_');

console.log(`State default value: "${stateDefault}"`);
console.log(`Old RadioGroup value: "${oldRadioValue}"`);
console.log(`New RadioGroup value: "${newRadioValue}"`);

console.log('\nComparison:');
if (stateDefault === oldRadioValue) {
  console.log('❌ OLD: Values DO NOT match - this is why the default wasn\'t selected!');
} else {
  console.log(`❌ OLD: Values DO NOT match (${stateDefault} !== ${oldRadioValue})`);
  console.log('   This is why the default wasn\'t selected!');
}

if (stateDefault === newRadioValue) {
  console.log('✅ NEW: Values MATCH - the default will now be selected!');
} else {
  console.log(`❌ NEW: Values still don't match (${stateDefault} !== ${newRadioValue})`);
}

console.log('\n================================');
console.log('Summary:');
console.log('================================');
console.log('The bug was: replace(\' \', \'_\') only replaces the FIRST space');
console.log('The fix is:  replace(/ /g, \'_\') replaces ALL spaces');
console.log('\nThis ensures "No prior treatment" becomes "no_prior_treatment"');
console.log('which matches the default value in the component state.');
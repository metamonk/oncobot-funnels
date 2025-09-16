#!/usr/bin/env tsx

/**
 * Test script to verify the correct time value transformation
 */

const timeOptions = [
  'Morning (8am-12pm)',
  'Afternoon (12pm-5pm)', 
  'Evening (5pm-8pm)',
  'Anytime'
];

console.log('Testing time value transformations:');
console.log('===================================\n');

timeOptions.forEach(time => {
  const transformed = time.toLowerCase().replace(/[^a-z0-9]/g, '-');
  console.log(`"${time}"`);
  console.log(`  → "${transformed}"\n`);
});

console.log('Current state default: "morning-8am-12pm"');
console.log('RadioGroup generates:  "' + 'Morning (8am-12pm)'.toLowerCase().replace(/[^a-z0-9]/g, '-') + '"');
console.log('\nThese DO NOT match! That\'s why Morning isn\'t selected.');
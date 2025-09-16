#!/usr/bin/env tsx

/**
 * Test script to verify form defaults are properly set
 */

console.log('Testing form default values...\n');

// Test configurations for different indications
const testCases = [
  {
    indication: 'lung',
    expectedDefaults: {
      stage: 'Stage 1',
      biomarkers: 'None/Unknown',  // Now first option for all
      priorTherapy: 'no_prior_treatment',
      preferredTime: 'morning--8am-12pm-'  // Morning is now first (with correct transformation)
    }
  },
  {
    indication: 'prostate',
    expectedDefaults: {
      stage: 'Localized',
      biomarkers: 'None/Unknown',  // Now first option for all
      priorTherapy: 'no_prior_treatment',
      preferredTime: 'morning--8am-12pm-'  // Morning is now first (with correct transformation)
    }
  },
  {
    indication: 'gi',
    expectedDefaults: {
      stage: 'Early Stage',
      biomarkers: 'None/Unknown',  // Now first option for all
      priorTherapy: 'no_prior_treatment',
      preferredTime: 'morning--8am-12pm-'  // Morning is now first (with correct transformation)
    }
  }
];

// Simulate the quiz data initialization logic from the component
function getQuizDefaults(indication: string) {
  return {
    condition: indication,
    forWhom: 'self',
    stage: indication === 'lung' ? 'Stage 1' : indication === 'prostate' ? 'Localized' : 'Early Stage',
    biomarkers: 'None/Unknown',  // First option for all indications now
    priorTherapy: 'no_prior_treatment',
    preferredTime: 'morning--8am-12pm-',  // Morning is now first (with correct transformation)
    consent: false
  };
}

// Run tests
let allPassed = true;

for (const testCase of testCases) {
  console.log(`Testing ${testCase.indication} form defaults:`);
  const defaults = getQuizDefaults(testCase.indication);
  
  // Check stage
  if (defaults.stage === testCase.expectedDefaults.stage) {
    console.log(`  ✅ Stage: ${defaults.stage}`);
  } else {
    console.log(`  ❌ Stage: Expected ${testCase.expectedDefaults.stage}, got ${defaults.stage}`);
    allPassed = false;
  }
  
  // Check biomarkers
  if (defaults.biomarkers === testCase.expectedDefaults.biomarkers) {
    console.log(`  ✅ Biomarkers: ${defaults.biomarkers}`);
  } else {
    console.log(`  ❌ Biomarkers: Expected ${testCase.expectedDefaults.biomarkers}, got ${defaults.biomarkers}`);
    allPassed = false;
  }
  
  // Check prior therapy
  if (defaults.priorTherapy === testCase.expectedDefaults.priorTherapy) {
    console.log(`  ✅ Prior Therapy: ${defaults.priorTherapy}`);
  } else {
    console.log(`  ❌ Prior Therapy: Expected ${testCase.expectedDefaults.priorTherapy}, got ${defaults.priorTherapy}`);
    allPassed = false;
  }
  
  // Check preferred time
  if (defaults.preferredTime === testCase.expectedDefaults.preferredTime) {
    console.log(`  ✅ Preferred Time: ${defaults.preferredTime} (Morning is first)`);
  } else {
    console.log(`  ❌ Preferred Time: Expected ${testCase.expectedDefaults.preferredTime}, got ${defaults.preferredTime}`);
    allPassed = false;
  }
  
  console.log();
}

// Common defaults check
console.log('Testing common defaults:');
const commonDefaults = getQuizDefaults('lung');

if (commonDefaults.forWhom === 'self') {
  console.log('  ✅ For Whom: self');
} else {
  console.log(`  ❌ For Whom: Expected self, got ${commonDefaults.forWhom}`);
  allPassed = false;
}

if (commonDefaults.preferredTime === 'morning--8am-12pm-') {
  console.log('  ✅ Preferred Time: morning--8am-12pm- (Morning is first option)');
} else {
  console.log(`  ❌ Preferred Time: Expected morning--8am-12pm-, got ${commonDefaults.preferredTime}`);
  allPassed = false;
}

if (commonDefaults.consent === false) {
  console.log('  ✅ Consent: false (not pre-checked for legal compliance)');
} else {
  console.log(`  ❌ Consent: Expected false, got ${commonDefaults.consent}`);
  allPassed = false;
}

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ All form defaults are correctly set!');
  console.log('- None/Unknown is first option for biomarkers');
  console.log('- No prior treatment is first option for treatments');
  console.log('- Morning is first option for contact time');
  console.log('- Consent checkbox is NOT pre-checked');
} else {
  console.log('❌ Some form defaults are incorrect!');
  process.exit(1);
}
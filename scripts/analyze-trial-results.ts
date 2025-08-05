#!/usr/bin/env tsx

// Analyze the trial results from the logs to understand KRAS G12C coverage

const trialDescriptions = [
  {
    nctId: "NCT06732401",
    description: "Testing durvalumab alone or with ceralasertib for NSCLC in stages II-IIIA or IIIB"
  },
  {
    nctId: "NCT05909137",
    description: "Phase 3 observational study for unresectable stage IIIA or IIIB NSCLC"
  },
  {
    nctId: "NCT06775002",
    description: "Distinguishing NSCLC from small cell lung cancer using serum screening"
  },
  {
    nctId: "NCT06772363",
    description: "Targets NSCLC with possible metastasis, using advanced screening methods"
  },
  {
    nctId: "NCT03514329",
    description: "A pilot study for localized NSCLC up to 2cm, testing vapor ablation"
  },
  {
    nctId: "NCT05275374",
    description: "Investigates treatments for NSCLC with BRAF mutations"
  },
  {
    nctId: "NCT06502249",
    description: "Explores NSCLC immune responses with potential therapies"
  },
  {
    nctId: "NCT04266730",
    description: "A vaccine-based trial for advanced squamous NSCLC"
  },
  {
    nctId: "NCT06982222",
    description: "Tests a new agent for advanced EGFR wild-type NSCLC"
  },
  {
    nctId: "NCT05764928",
    description: "Examines combination therapy for advanced inoperable NSCLC"
  }
];

console.log('Analysis of Top 10 Trials Returned:\n');

// Check for mutation-specific trials
const mutationTrials = trialDescriptions.filter(trial => 
  trial.description.toLowerCase().includes('mutation') ||
  trial.description.toLowerCase().includes('braf') ||
  trial.description.toLowerCase().includes('egfr') ||
  trial.description.toLowerCase().includes('kras') ||
  trial.description.toLowerCase().includes('alk') ||
  trial.description.toLowerCase().includes('ros1')
);

console.log(`Mutation-specific trials: ${mutationTrials.length}/10`);
mutationTrials.forEach(trial => {
  console.log(`  - ${trial.nctId}: ${trial.description}`);
});

console.log('\nKey Observations:');
console.log('1. NO trials specifically mention KRAS or KRAS G12C');
console.log('2. Only 2 trials mention specific mutations:');
console.log('   - NCT05275374: BRAF mutations');
console.log('   - NCT06982222: EGFR wild-type (not a mutation target)');
console.log('3. Most trials are general NSCLC trials without molecular targeting');

console.log('\nPossible Explanations:');
console.log('1. KRAS G12C trials may be less common than expected');
console.log('2. They may use different terminology in their titles/descriptions');
console.log('3. They may be ranked lower due to other factors (recruitment status, phase, etc.)');
console.log('4. The search returned 2,328 total trials - KRAS trials might be in positions 11-100');

console.log('\nRecommendations:');
console.log('1. Search specifically for "KRAS" in the condition field');
console.log('2. Increase maxResults to 25-50 to see if KRAS trials appear');
console.log('3. Consider adjusting scoring weights to prioritize molecular marker matches even more');
console.log('4. Add a "boost" factor for trials that match the user\'s specific mutations');
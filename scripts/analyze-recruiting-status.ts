#!/usr/bin/env tsx

// Analyze the recruiting status of trials from the logs

const trialStatuses = [
  { nctId: "NCT06732401", status: "RECRUITING", description: "durvalumab alone or with ceralasertib" },
  { nctId: "NCT05909137", status: "NOT_YET_RECRUITING", description: "observational study" },
  { nctId: "NCT06775002", status: "NOT_YET_RECRUITING", description: "serum screening" },
  { nctId: "NCT06772363", status: "NOT_YET_RECRUITING", description: "metastasis screening" },
  { nctId: "NCT03514329", status: "NOT_YET_RECRUITING", description: "vapor ablation" },
  { nctId: "NCT05275374", status: "NOT_YET_RECRUITING", description: "BRAF mutations" },
  { nctId: "NCT06502249", status: "NOT_YET_RECRUITING", description: "immune responses" },
  { nctId: "NCT04266730", status: "NOT_YET_RECRUITING", description: "vaccine-based" },
  { nctId: "NCT06982222", status: "NOT_YET_RECRUITING", description: "EGFR wild-type" },
  { nctId: "NCT05764928", status: "NOT_YET_RECRUITING", description: "combination therapy" }
];

console.log('Analysis of Trial Recruiting Status\n');
console.log('=' .repeat(60));

// Count by status
const statusCounts = trialStatuses.reduce((acc, trial) => {
  acc[trial.status] = (acc[trial.status] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

console.log('\nStatus Distribution:');
Object.entries(statusCounts).forEach(([status, count]) => {
  const percentage = (count / trialStatuses.length * 100).toFixed(0);
  console.log(`${status}: ${count}/10 (${percentage}%)`);
});

console.log('\nScoring Impact:');
console.log('Based on current scoring system:');
console.log('- RECRUITING: 60 points');
console.log('- NOT_YET_RECRUITING: 15 points');
console.log('- Score difference: 45 points');

console.log('\nKey Observations:');
console.log('1. Only 1/10 trials is actively RECRUITING');
console.log('2. 9/10 trials are NOT_YET_RECRUITING');
console.log('3. The single RECRUITING trial gets a 45-point advantage');
console.log('4. This explains why NCT06732401 is ranked #1');

console.log('\nPotential Issues:');
console.log('1. RECRUITING status (60 points) can override molecular marker match (40 points)');
console.log('2. A generic RECRUITING trial ranks higher than a perfect molecular match that\'s NOT_YET_RECRUITING');
console.log('3. Patients might miss highly relevant trials just because they\'re not recruiting yet');

console.log('\nRecommendations:');
console.log('1. Reduce RECRUITING bonus to 30-40 points (from 60)');
console.log('2. Increase molecular marker match to 60-80 points (from 40)');
console.log('3. Consider a multiplicative bonus: if molecular match AND recruiting, extra boost');
console.log('4. Show trials in tiers:');
console.log('   - Tier 1: Recruiting + Molecular Match');
console.log('   - Tier 2: Recruiting OR Molecular Match');
console.log('   - Tier 3: General matches');

// Simulate adjusted scoring
console.log('\n' + '='.repeat(60));
console.log('\nSimulated Adjusted Scoring:');
console.log('\nCurrent System:');
console.log('- Generic RECRUITING trial: 60 (status) + 50 (condition) = 110 points');
console.log('- Perfect molecular match NOT_YET: 15 (status) + 50 (condition) + 40 (marker) = 105 points');
console.log('→ Generic trial wins by 5 points!');

console.log('\nProposed System:');
console.log('- Generic RECRUITING trial: 35 (status) + 50 (condition) = 85 points');
console.log('- Perfect molecular match NOT_YET: 15 (status) + 50 (condition) + 70 (marker) = 135 points');
console.log('→ Molecular match wins by 50 points!');

console.log('\nWith Multiplicative Bonus:');
console.log('- RECRUITING + molecular match: 35 (status) + 50 (condition) + 70 (marker) + 20 (bonus) = 175 points');
console.log('→ Best of both worlds gets highest score');
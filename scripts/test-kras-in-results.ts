#!/usr/bin/env tsx

// Test to check if KRAS G12C trials exist in the full search results

import { searchClinicalTrials } from '../lib/tools/clinical-trials';

async function testKrasInResults() {
  console.log('Testing if KRAS G12C trials exist in search results...\n');

  // Simulate the search with more results
  const searchParams = {
    condition: 'lung cancer nsclc',
    maxResults: 50, // Get more results to check
  };

  try {
    const results = await searchClinicalTrials(searchParams);
    
    console.log(`Total trials found: ${results.totalCount}`);
    console.log(`Trials returned: ${results.trials.length}\n`);

    // Check each trial for KRAS mentions
    let krasTrials = 0;
    let krasG12CTrials = 0;

    results.trials.forEach((trial, index) => {
      const nctId = trial.protocolSection.identificationModule.nctId;
      const title = trial.protocolSection.identificationModule.briefTitle || '';
      const eligibility = trial.protocolSection.eligibilityModule?.eligibilityCriteria || '';
      const interventions = trial.protocolSection.armsInterventionsModule?.interventions || [];
      
      // Combine all text to search
      const allText = (title + ' ' + eligibility + ' ' + 
        interventions.map(i => (i.name || '') + ' ' + (i.description || '')).join(' ')
      ).toLowerCase();

      const hasKras = allText.includes('kras');
      const hasG12C = allText.includes('g12c');
      const hasKrasG12C = hasKras && hasG12C;

      if (hasKras) krasTrials++;
      if (hasKrasG12C) krasG12CTrials++;

      if (hasKrasG12C) {
        console.log(`\n✅ FOUND KRAS G12C Trial #${index + 1}:`);
        console.log(`   NCT ID: ${nctId}`);
        console.log(`   Title: ${title.substring(0, 100)}...`);
        
        // Show where KRAS G12C was found
        if (title.toLowerCase().includes('kras')) {
          console.log('   Found in: Title');
        }
        if (eligibility.toLowerCase().includes('kras') && eligibility.toLowerCase().includes('g12c')) {
          console.log('   Found in: Eligibility Criteria');
        }
        interventions.forEach(intervention => {
          const intText = ((intervention.name || '') + ' ' + (intervention.description || '')).toLowerCase();
          if (intText.includes('kras') && intText.includes('g12c')) {
            console.log(`   Found in: Intervention (${intervention.name})`);
          }
        });
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY:');
    console.log(`Total trials mentioning KRAS: ${krasTrials}`);
    console.log(`Total trials mentioning KRAS G12C: ${krasG12CTrials}`);
    console.log(`Percentage with KRAS: ${((krasTrials / results.trials.length) * 100).toFixed(1)}%`);
    console.log(`Percentage with KRAS G12C: ${((krasG12CTrials / results.trials.length) * 100).toFixed(1)}%`);

    if (krasG12CTrials === 0) {
      console.log('\n⚠️  NO KRAS G12C trials found in top 50 results!');
      console.log('This suggests:');
      console.log('1. KRAS G12C trials might be rare or use different terminology');
      console.log('2. We might need to search with more specific terms');
      console.log('3. The trials might be buried deeper in the 2328 total results');
    }

  } catch (error) {
    console.error('Error searching trials:', error);
  }
}

// Run the test
testKrasInResults();
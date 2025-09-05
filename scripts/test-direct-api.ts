#!/usr/bin/env tsx

/**
 * Test direct API calls to understand what's happening
 */

async function testDirectAPI() {
  console.log('🧪 Testing Direct ClinicalTrials.gov API\n');
  
  const queries = [
    'TROPION-Lung12',
    'TROPION-Lung 12',
    'TROPION Lung 12',
    'TROPION-12',
    'TROPION',
    'NCT06564844'
  ];
  
  for (const query of queries) {
    console.log(`\n📋 Testing query: "${query}"`);
    
    // Try in term field
    const termUrl = `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(query)}&format=json&pageSize=5&countTotal=true`;
    const termResponse = await fetch(termUrl);
    const termData = await termResponse.json();
    
    console.log(`  Term field results: ${termData.totalCount} trials`);
    if (termData.studies && termData.studies.length > 0) {
      const nctIds = termData.studies.map((s: any) => s.protocolSection?.identificationModule?.nctId).slice(0, 3);
      console.log(`    NCT IDs: ${nctIds.join(', ')}`);
      
      // Check if NCT06564844 is in results
      const hasTarget = termData.studies.some((s: any) => 
        s.protocolSection?.identificationModule?.nctId === 'NCT06564844'
      );
      if (hasTarget) {
        console.log('    ✅ FOUND NCT06564844!');
        const trial = termData.studies.find((s: any) => 
          s.protocolSection?.identificationModule?.nctId === 'NCT06564844'
        );
        console.log(`    Title: ${trial.protocolSection?.identificationModule?.briefTitle}`);
        console.log(`    Acronym: ${trial.protocolSection?.identificationModule?.acronym}`);
      }
    }
    
    // Try in intervention field (drug field)
    const intrUrl = `https://clinicaltrials.gov/api/v2/studies?query.intr=${encodeURIComponent(query)}&format=json&pageSize=5&countTotal=true`;
    const intrResponse = await fetch(intrUrl);
    const intrData = await intrResponse.json();
    
    console.log(`  Intervention field results: ${intrData.totalCount} trials`);
    if (intrData.studies && intrData.studies.length > 0) {
      const nctIds = intrData.studies.map((s: any) => s.protocolSection?.identificationModule?.nctId).slice(0, 3);
      console.log(`    NCT IDs: ${nctIds.join(', ')}`);
      
      // Check if NCT06564844 is in results
      const hasTarget = intrData.studies.some((s: any) => 
        s.protocolSection?.identificationModule?.nctId === 'NCT06564844'
      );
      if (hasTarget) {
        console.log('    ✅ FOUND NCT06564844!');
      }
    }
    
    // Try in title field
    const titleUrl = `https://clinicaltrials.gov/api/v2/studies?query.titles=${encodeURIComponent(query)}&format=json&pageSize=5&countTotal=true`;
    const titleResponse = await fetch(titleUrl);
    const titleData = await titleResponse.json();
    
    console.log(`  Title field results: ${titleData.totalCount} trials`);
    if (titleData.studies && titleData.studies.length > 0) {
      const nctIds = titleData.studies.map((s: any) => s.protocolSection?.identificationModule?.nctId).slice(0, 3);
      console.log(`    NCT IDs: ${nctIds.join(', ')}`);
      
      // Check if NCT06564844 is in results
      const hasTarget = titleData.studies.some((s: any) => 
        s.protocolSection?.identificationModule?.nctId === 'NCT06564844'
      );
      if (hasTarget) {
        console.log('    ✅ FOUND NCT06564844!');
      }
    }
  }
  
  console.log('\n\n📋 Testing direct NCT ID lookup:');
  const nctUrl = `https://clinicaltrials.gov/api/v2/studies?query.id=NCT06564844&format=json`;
  const nctResponse = await fetch(nctUrl);
  const nctData = await nctResponse.json();
  
  if (nctData.studies && nctData.studies.length > 0) {
    const trial = nctData.studies[0];
    console.log('✅ Direct NCT ID lookup succeeded!');
    console.log(`  Title: ${trial.protocolSection?.identificationModule?.briefTitle}`);
    console.log(`  Acronym: ${trial.protocolSection?.identificationModule?.acronym}`);
    console.log(`  Status: ${trial.protocolSection?.statusModule?.overallStatus}`);
    
    // Check interventions
    const interventions = trial.protocolSection?.armsInterventionsModule?.interventions || [];
    console.log(`  Interventions: ${interventions.map((i: any) => i.name).join(', ')}`);
  }
}

// Run the test
testDirectAPI().catch(console.error);
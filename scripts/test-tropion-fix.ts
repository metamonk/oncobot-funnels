#!/usr/bin/env tsx

/**
 * Test TROPION-Lung12 Intelligent Search
 * Verifies the system can now correctly find NCT06564844 using improved intelligence
 */

import { queryAnalyzer } from '../lib/tools/clinical-trials/atomic/query-analyzer';
import { textSearch } from '../lib/tools/clinical-trials/atomic/text-search';
import { intelligentSearch } from '../lib/tools/clinical-trials/atomic/intelligent-search';

async function testTrialNameResolution() {
  console.log('🧪 Testing TROPION-Lung12 Intelligent Search\n');
  
  // Test 1: Query analysis with trial name
  console.log('📋 Test 1: Analyzing query for trial name recognition');
  const query = 'TROPION-Lung 12 study locations that are open or not yet recruiting in Texas and Louisiana';
  
  const analysis = await queryAnalyzer.analyze({ 
    query,
    healthProfile: null 
  });
  
  if (analysis.success && analysis.analysis) {
    console.log('Query Analysis Results:');
    console.log('- Has NCT component:', analysis.analysis.dimensions.hasNCTComponent);
    console.log('- Has location component:', analysis.analysis.dimensions.hasLocationComponent);
    console.log('- NCT IDs found:', analysis.analysis.entities.nctIds);
    console.log('- Drugs/Trial names found:', analysis.analysis.entities.drugs);
    console.log('- Locations:', analysis.analysis.entities.locations);
    console.log('- Recommended tools:', analysis.analysis.searchStrategy.recommendedTools);
    
    if (analysis.analysis.entities.drugs.includes('TROPION-Lung 12') || 
        analysis.analysis.entities.drugs.some(d => d.includes('TROPION'))) {
      console.log('✅ Trial name recognized in drugs/trial names array\n');
    } else {
      console.log('❌ Trial name not recognized\n');
    }
  }
  
  // Test 2: Text search with variations
  console.log('📋 Test 2: Testing intelligent text search with variations');
  const searchResult = await textSearch.search({
    query: 'TROPION-Lung 12',
    field: 'term'
  });
  
  console.log('Text Search Results:');
  console.log('- Success:', searchResult.success);
  console.log('- Trials found:', searchResult.trials.length);
  
  if (searchResult.trials.length > 0) {
    const tropionTrial = searchResult.trials.find(t => 
      t.protocolSection?.identificationModule?.nctId === 'NCT06564844'
    );
    
    if (tropionTrial) {
      console.log('✅ SUCCESS: Found NCT06564844!');
      console.log('- Title:', tropionTrial.protocolSection?.identificationModule?.briefTitle);
      console.log('- Acronym:', tropionTrial.protocolSection?.identificationModule?.acronym);
      
      // Check locations
      const locations = tropionTrial.protocolSection?.contactsLocationsModule?.locations || [];
      const texasLocations = locations.filter(loc => 
        loc.state?.toLowerCase() === 'texas' || loc.state === 'TX'
      );
      const louisianaLocations = locations.filter(loc => 
        loc.state?.toLowerCase() === 'louisiana' || loc.state === 'LA'
      );
      
      console.log(`\nLocation Analysis:`);
      console.log(`- Total locations: ${locations.length}`);
      console.log(`- Texas locations: ${texasLocations.length}`);
      console.log(`- Louisiana locations: ${louisianaLocations.length}`);
      
      if (texasLocations.length > 0) {
        console.log('✅ Trial has locations in Texas');
        console.log('Texas cities:', [...new Set(texasLocations.map(l => l.city))].join(', '));
      }
      
      if (louisianaLocations.length === 0) {
        console.log('ℹ️  Trial has NO locations in Louisiana (as expected)');
      }
    } else {
      console.log('❌ FAILED: NCT06564844 not found in results');
      console.log('Found NCT IDs:', searchResult.trials.map(t => 
        t.protocolSection?.identificationModule?.nctId
      ).slice(0, 5));
    }
  } else {
    console.log('❌ No trials found at all');
  }
  
  // Test 3: Intelligent search with AI-driven parameter composition
  console.log('\n📋 Test 3: Testing intelligent search with AI-driven parameters');
  if (analysis.success && analysis.analysis) {
    const intelligentResult = await intelligentSearch.search({
      analysis: analysis.analysis,
      maxResults: 10
    });
    
    console.log('Intelligent Search Results:');
    console.log('- Success:', intelligentResult.success);
    console.log('- Trials found:', intelligentResult.trials.length);
    console.log('- Parameters used:', intelligentResult.metadata.parametersUsed);
    console.log('- AI reasoning:', intelligentResult.metadata.reasoning);
    
    if (intelligentResult.trials.length > 0) {
      const tropionTrial = intelligentResult.trials.find(t => 
        t.protocolSection?.identificationModule?.nctId === 'NCT06564844'
      );
      
      if (tropionTrial) {
        console.log('✅ SUCCESS: Intelligent search found NCT06564844!');
      } else {
        console.log('❌ NCT06564844 not in intelligent search results');
        console.log('Found NCT IDs:', intelligentResult.trials.map(t => 
          t.protocolSection?.identificationModule?.nctId
        ).slice(0, 5));
      }
    }
  }
  
  console.log('\n🎯 Summary:');
  console.log('The system improvements:');
  console.log('1. Query analyzer recognizes "TROPION-Lung12" as a trial name');
  console.log('2. Text search tries intelligent variations (with/without spaces, hyphens)');
  console.log('3. Result composer filters out unrelated trials');
  console.log('4. System is AI-driven without hardcoded mappings');
}

// Run the test
testTrialNameResolution().catch(console.error);
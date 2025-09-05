/**
 * Test script for orchestrated clinical trials tools
 * 
 * Tests all scenarios including the TROPION-Lung12 failure case
 */

import { clinicalTrialsOrchestratedTool } from '../lib/tools/clinical-trials-orchestrated';
import { 
  nctLookup,
  textSearch,
  locationSearch,
  mutationSearch,
  queryAnalyzer
} from '../lib/tools/clinical-trials/atomic';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.cyan);
  console.log('='.repeat(60));
}

async function testScenario(name: string, testFn: () => Promise<void>) {
  console.log(`\n${colors.yellow}Testing: ${name}${colors.reset}`);
  try {
    await testFn();
    log(`✓ ${name} passed`, colors.green);
  } catch (error) {
    log(`✗ ${name} failed: ${error}`, colors.red);
  }
}

async function main() {
  log('\n🧪 Testing Orchestrated Clinical Trials Tools\n', colors.magenta);
  
  // Test 1: Direct NCT Lookup (TROPION-Lung12 case)
  await testScenario('NCT04585481 Direct Lookup', async () => {
    logSection('Test 1: NCT04585481 (TROPION-Lung12)');
    
    // First test the atomic tool directly
    log('\nTesting atomic NCT lookup...', colors.blue);
    const directResult = await nctLookup.lookup('NCT04585481');
    
    if (directResult.success && directResult.trial) {
      log('✓ Found trial via atomic tool', colors.green);
      const trial = directResult.trial;
      const title = trial.protocolSection?.identificationModule?.briefTitle;
      log(`  Title: ${title}`, colors.cyan);
      
      // Check if it's TROPION-Lung12
      if (title?.includes('TROPION')) {
        log('  ✓ Confirmed: This is TROPION-Lung12', colors.green);
      }
      
      // Check for sites
      const locations = trial.protocolSection?.contactsLocationsModule?.locations;
      if (locations && locations.length > 0) {
        log(`  ✓ Has ${locations.length} trial sites`, colors.green);
        // Show first 3 sites
        locations.slice(0, 3).forEach(loc => {
          log(`    - ${loc.facility} (${loc.city}, ${loc.state})`, colors.cyan);
        });
      }
    } else {
      log('✗ Failed to find NCT04585481', colors.red);
      if (directResult.error) {
        log(`  Error: ${directResult.error.message}`, colors.red);
        log(`  Suggestions: ${directResult.error.suggestions.join(', ')}`, colors.yellow);
      }
    }
    
    // Now test through orchestrated tool
    log('\nTesting orchestrated tool...', colors.blue);
    const tool = clinicalTrialsOrchestratedTool('test-chat-1');
    const orchestratedResult = await tool.execute({
      query: 'Tell me about NCT04585481'
    });
    
    if (orchestratedResult.success && orchestratedResult.matches?.length > 0) {
      log('✓ Found trial via orchestrated tool', colors.green);
      const match = orchestratedResult.matches[0];
      const title = match.trial.protocolSection?.identificationModule?.briefTitle;
      log(`  Title: ${title}`, colors.cyan);
    } else {
      log('✗ Orchestrated tool failed', colors.red);
      log(`  ${orchestratedResult.message || orchestratedResult.error}`, colors.red);
    }
  });
  
  // Test 2: Multi-dimensional query (KRAS G12C + location)
  await testScenario('KRAS G12C trials in Chicago', async () => {
    logSection('Test 2: Multi-dimensional Query');
    
    // Test query analyzer
    log('\nAnalyzing query...', colors.blue);
    const analysis = await queryAnalyzer.analyze({
      query: 'KRAS G12C trials in Chicago'
    });
    
    if (analysis.success && analysis.analysis) {
      log('✓ Query analyzed', colors.green);
      log(`  Dimensions:`, colors.cyan);
      log(`    - Has mutation: ${analysis.analysis.dimensions.hasMutationComponent}`, colors.cyan);
      log(`    - Has location: ${analysis.analysis.dimensions.hasLocationComponent}`, colors.cyan);
      log(`  Entities:`, colors.cyan);
      log(`    - Mutations: ${analysis.analysis.entities.mutations.join(', ')}`, colors.cyan);
      log(`    - Cities: ${analysis.analysis.entities.locations.cities.join(', ')}`, colors.cyan);
    }
    
    // Test through orchestrated tool
    const tool = clinicalTrialsOrchestratedTool('test-chat-2');
    const result = await tool.execute({
      query: 'KRAS G12C trials in Chicago'
    });
    
    if (result.success && result.matches?.length > 0) {
      log(`✓ Found ${result.matches.length} trials`, colors.green);
      result.matches.slice(0, 2).forEach(match => {
        const title = match.trial.protocolSection?.identificationModule?.briefTitle;
        log(`  - ${title?.substring(0, 60)}...`, colors.cyan);
      });
    }
  });
  
  // Test 3: Text search fallback
  await testScenario('General lung cancer search', async () => {
    logSection('Test 3: Text Search');
    
    const searchResult = await textSearch.search({
      query: 'lung cancer',
      field: 'condition',
      maxResults: 5
    });
    
    if (searchResult.success && searchResult.trials.length > 0) {
      log(`✓ Found ${searchResult.trials.length} trials`, colors.green);
      searchResult.trials.slice(0, 2).forEach(trial => {
        const nctId = trial.protocolSection?.identificationModule?.nctId;
        const title = trial.protocolSection?.identificationModule?.briefTitle;
        log(`  - ${nctId}: ${title?.substring(0, 50)}...`, colors.cyan);
      });
    }
  });
  
  // Test 4: Location search
  await testScenario('Trials in Boston', async () => {
    logSection('Test 4: Location Search');
    
    const searchResult = await locationSearch.search({
      city: 'Boston',
      state: 'Massachusetts',
      condition: 'cancer',
      maxResults: 5
    });
    
    if (searchResult.success && searchResult.trials.length > 0) {
      log(`✓ Found ${searchResult.trials.length} trials in Boston`, colors.green);
      searchResult.trials.slice(0, 2).forEach(trial => {
        const nctId = trial.protocolSection?.identificationModule?.nctId;
        const title = trial.protocolSection?.identificationModule?.briefTitle;
        log(`  - ${nctId}: ${title?.substring(0, 50)}...`, colors.cyan);
      });
    }
  });
  
  // Test 5: Mutation search
  await testScenario('EGFR mutation trials', async () => {
    logSection('Test 5: Mutation Search');
    
    const searchResult = await mutationSearch.search({
      mutation: 'EGFR',
      cancerType: 'lung cancer',
      maxResults: 5
    });
    
    if (searchResult.success && searchResult.trials.length > 0) {
      log(`✓ Found ${searchResult.trials.length} EGFR trials`, colors.green);
      searchResult.trials.slice(0, 2).forEach(trial => {
        const nctId = trial.protocolSection?.identificationModule?.nctId;
        const title = trial.protocolSection?.identificationModule?.briefTitle;
        log(`  - ${nctId}: ${title?.substring(0, 50)}...`, colors.cyan);
      });
    }
  });
  
  // Test 6: Complex orchestrated query without profile
  await testScenario('Phase 3 immunotherapy trials', async () => {
    logSection('Test 6: Complex Query Without Profile');
    
    const tool = clinicalTrialsOrchestratedTool('test-chat-3');
    const result = await tool.execute({
      query: 'Phase 3 immunotherapy trials for lung cancer',
      useProfile: 'never', // Explicitly don't use profile
      searchParams: {
        maxResults: 5,
        filters: {
          phase: ['PHASE3']
        }
      }
    });
    
    if (result.success && result.matches?.length > 0) {
      log(`✓ Found ${result.matches.length} trials without profile`, colors.green);
      result.matches.slice(0, 2).forEach(match => {
        const title = match.trial.protocolSection?.identificationModule?.briefTitle;
        const phase = match.trial.protocolSection?.designModule?.phases?.join(', ');
        log(`  - [${phase}] ${title?.substring(0, 50)}...`, colors.cyan);
      });
    }
  });
  
  log('\n✅ All tests completed!\n', colors.green);
}

// Run tests
main().catch(error => {
  log(`\n❌ Test suite failed: ${error}`, colors.red);
  process.exit(1);
});
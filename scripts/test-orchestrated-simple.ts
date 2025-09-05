/**
 * Simplified test for orchestrated clinical trials tools
 * Tests core functionality without full environment setup
 */

import { nctLookup } from '../lib/tools/clinical-trials/atomic/nct-lookup';
import { textSearch } from '../lib/tools/clinical-trials/atomic/text-search';
import { locationSearch } from '../lib/tools/clinical-trials/atomic/location-search';
import { mutationSearch } from '../lib/tools/clinical-trials/atomic/mutation-search';

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
  await testScenario('NCT06564844 Direct Lookup', async () => {
    logSection('Test 1: NCT06564844 (TROPION-Lung12)');
    
    log('\nTesting atomic NCT lookup...', colors.blue);
    const result = await nctLookup.lookup('NCT06564844');
    
    if (result.success && result.trial) {
      log('✓ Found trial via atomic tool', colors.green);
      const trial = result.trial;
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
      log('✗ Failed to find NCT06564844', colors.red);
      if (result.error) {
        log(`  Error: ${result.error.message}`, colors.red);
        log(`  Suggestions: ${result.error.suggestions.join(', ')}`, colors.yellow);
      }
    }
  });
  
  // Test 2: Text search
  await testScenario('General lung cancer search', async () => {
    logSection('Test 2: Text Search');
    
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
    } else {
      log('✗ No trials found', colors.red);
    }
  });
  
  // Test 3: Location search
  await testScenario('Trials in Boston', async () => {
    logSection('Test 3: Location Search');
    
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
    } else {
      log('✗ No trials found in Boston', colors.red);
    }
  });
  
  // Test 4: Mutation search
  await testScenario('KRAS G12C mutation trials', async () => {
    logSection('Test 4: Mutation Search');
    
    const searchResult = await mutationSearch.search({
      mutation: 'KRAS G12C',
      cancerType: 'lung cancer',
      maxResults: 5
    });
    
    if (searchResult.success && searchResult.trials.length > 0) {
      log(`✓ Found ${searchResult.trials.length} KRAS G12C trials`, colors.green);
      searchResult.trials.slice(0, 2).forEach(trial => {
        const nctId = trial.protocolSection?.identificationModule?.nctId;
        const title = trial.protocolSection?.identificationModule?.briefTitle;
        log(`  - ${nctId}: ${title?.substring(0, 50)}...`, colors.cyan);
      });
    } else {
      log('✗ No KRAS G12C trials found', colors.red);
    }
  });
  
  log('\n✅ All atomic tool tests completed!\n', colors.green);
}

// Run tests
main().catch(error => {
  log(`\n❌ Test suite failed: ${error}`, colors.red);
  process.exit(1);
});
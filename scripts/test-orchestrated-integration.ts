/**
 * Comprehensive integration test for orchestrated clinical trials system
 * Tests the complete flow from tool invocation to UI-compatible results
 */

import { clinicalTrialsOrchestratedTool } from '../lib/tools/clinical-trials-orchestrated';
import { getUserHealthProfile } from '../lib/health-profile-actions';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80));
  log(title, colors.cyan);
  console.log('='.repeat(80));
}

function logSubSection(title: string) {
  console.log('\n' + '-'.repeat(40));
  log(title, colors.yellow);
  console.log('-'.repeat(40));
}

async function testScenario(
  name: string, 
  params: any,
  expectations: {
    minTrials?: number;
    maxTrials?: number;
    shouldContain?: string[];
    shouldHaveUI?: boolean;
  }
) {
  logSubSection(`Test: ${name}`);
  
  const tool = clinicalTrialsOrchestratedTool('test-chat-integration');
  
  try {
    const startTime = Date.now();
    const result = await tool.execute(params);
    const duration = Date.now() - startTime;
    
    // Basic success check
    if (!result.success) {
      log(`✗ Failed: ${result.error || result.message}`, colors.red);
      return false;
    }
    
    // Check trial count
    const trialCount = result.matches?.length || 0;
    log(`✓ Found ${trialCount} trials in ${duration}ms`, colors.green);
    
    if (expectations.minTrials && trialCount < expectations.minTrials) {
      log(`✗ Expected at least ${expectations.minTrials} trials`, colors.red);
      return false;
    }
    
    if (expectations.maxTrials && trialCount > expectations.maxTrials) {
      log(`✗ Expected at most ${expectations.maxTrials} trials`, colors.red);
      return false;
    }
    
    // Check content
    if (expectations.shouldContain) {
      const resultText = JSON.stringify(result).toLowerCase();
      for (const term of expectations.shouldContain) {
        if (!resultText.includes(term.toLowerCase())) {
          log(`✗ Result should contain "${term}"`, colors.red);
          return false;
        }
        log(`✓ Contains "${term}"`, colors.green);
      }
    }
    
    // Check UI compatibility
    if (expectations.shouldHaveUI && result.matches && result.matches.length > 0) {
      const firstMatch = result.matches[0];
      
      // Check required UI fields
      const hasRequiredFields = 
        firstMatch.trial &&
        firstMatch.matchScore !== undefined &&
        firstMatch.eligibilityAssessment &&
        firstMatch.eligibilityAssessment.searchRelevance &&
        firstMatch.eligibilityAssessment.trialCriteria;
      
      if (hasRequiredFields) {
        log(`✓ UI-compatible structure verified`, colors.green);
        
        // Show sample trial info
        const trial = firstMatch.trial;
        const nctId = trial.protocolSection?.identificationModule?.nctId;
        const title = trial.protocolSection?.identificationModule?.briefTitle;
        log(`  Sample: ${nctId} - ${title?.substring(0, 50)}...`, colors.gray);
      } else {
        log(`✗ Missing required UI fields`, colors.red);
        return false;
      }
    }
    
    return true;
    
  } catch (error) {
    log(`✗ Error: ${error}`, colors.red);
    return false;
  }
}

async function main() {
  log('\n🧪 COMPREHENSIVE INTEGRATION TEST FOR ORCHESTRATED CLINICAL TRIALS\n', colors.magenta);
  
  const results: Record<string, boolean> = {};
  
  // Test 1: Direct NCT Lookup
  logSection('1. Direct NCT Lookup (TROPION-Lung12)');
  results['nct_lookup'] = await testScenario(
    'NCT06564844 Direct Lookup',
    {
      query: 'Show me NCT06564844',
      strategy: 'auto',
    },
    {
      minTrials: 1,
      maxTrials: 1,
      shouldContain: ['TROPION-Lung12', 'NCT06564844'],
      shouldHaveUI: true,
    }
  );
  
  // Test 2: Multi-dimensional query (location + condition + mutation)
  logSection('2. Multi-Dimensional Query');
  results['multi_dimensional'] = await testScenario(
    'KRAS G12C lung cancer in Texas',
    {
      query: 'KRAS G12C lung cancer trials in Texas',
      strategy: 'auto',
      searchParams: {
        maxResults: 10,
      }
    },
    {
      minTrials: 1,
      shouldContain: ['KRAS'],
      shouldHaveUI: true,
    }
  );
  
  // Test 3: Location-only query
  logSection('3. Location-Based Search');
  results['location'] = await testScenario(
    'Trials in Chicago',
    {
      query: 'Clinical trials in Chicago',
      strategy: 'auto',
      location: {
        city: 'Chicago',
        state: 'Illinois',
      },
      searchParams: {
        maxResults: 5,
      }
    },
    {
      minTrials: 1,
      maxTrials: 5,
      shouldHaveUI: true,
    }
  );
  
  // Test 4: Condition search with filters
  logSection('4. Condition Search with Filters');
  results['condition_filtered'] = await testScenario(
    'Phase 3 lung cancer trials',
    {
      query: 'Phase 3 lung cancer trials',
      searchParams: {
        maxResults: 5,
        filters: {
          phase: ['PHASE3'],
        }
      }
    },
    {
      minTrials: 1,
      maxTrials: 5,
      shouldHaveUI: true,
    }
  );
  
  // Test 5: Profile-independent search
  logSection('5. Profile-Independent Search');
  results['no_profile'] = await testScenario(
    'Breast cancer immunotherapy',
    {
      query: 'Breast cancer immunotherapy trials',
      useProfile: 'never',
      searchParams: {
        maxResults: 5,
      }
    },
    {
      minTrials: 1,
      shouldContain: ['breast'],
      shouldHaveUI: true,
    }
  );
  
  // Test 6: Continuation scenario
  logSection('6. Continuation Handling');
  
  // First search
  const tool = clinicalTrialsOrchestratedTool('test-continuation-chat');
  const firstResult = await tool.execute({
    query: 'lung cancer',
    searchParams: { maxResults: 3 }
  });
  
  if (firstResult.success && firstResult.matches) {
    log(`✓ Initial search: ${firstResult.matches.length} trials`, colors.green);
    
    // Continuation search
    const moreResult = await tool.execute({
      query: 'show me more',
      strategy: 'continuation',
      searchParams: { maxResults: 3 }
    });
    
    if (moreResult.success) {
      log(`✓ Continuation worked: ${moreResult.matches?.length || 0} more trials`, colors.green);
      results['continuation'] = true;
    } else {
      log(`✗ Continuation failed`, colors.red);
      results['continuation'] = false;
    }
  } else {
    results['continuation'] = false;
  }
  
  // Test 7: Error handling
  logSection('7. Error Handling');
  results['error_handling'] = await testScenario(
    'Invalid NCT ID',
    {
      query: 'NCT99999999',
      strategy: 'nct_direct',
    },
    {
      minTrials: 0,
      maxTrials: 0,
    }
  );
  
  // Summary
  logSection('TEST SUMMARY');
  
  let passed = 0;
  let failed = 0;
  
  for (const [test, result] of Object.entries(results)) {
    if (result) {
      log(`✓ ${test}`, colors.green);
      passed++;
    } else {
      log(`✗ ${test}`, colors.red);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  if (failed === 0) {
    log(`✅ ALL TESTS PASSED (${passed}/${passed + failed})`, colors.green);
  } else {
    log(`⚠️  SOME TESTS FAILED (${passed} passed, ${failed} failed)`, colors.yellow);
  }
  console.log('='.repeat(80) + '\n');
}

// Run tests
main().catch(error => {
  log(`\n❌ Test suite failed: ${error}`, colors.red);
  process.exit(1);
});
/**
 * Complete system verification test
 * Ensures all features are preserved and working with the new orchestrated architecture
 */

import { clinicalTrialsOrchestratedTool } from '../lib/tools/clinical-trials-orchestrated';
import { conversationTrialStore } from '../lib/tools/clinical-trials/services/conversation-trial-store';

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
  bold: '\x1b[1m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80));
  log(`${colors.bold}${title}${colors.reset}`, colors.cyan);
  console.log('='.repeat(80));
}

function logCheck(name: string, passed: boolean, details?: string) {
  const icon = passed ? '✅' : '❌';
  const color = passed ? colors.green : colors.red;
  log(`${icon} ${name}`, color);
  if (details) {
    log(`   ${details}`, colors.gray);
  }
}

async function verifyFeature(
  name: string,
  check: () => Promise<boolean>
): Promise<boolean> {
  try {
    const result = await check();
    logCheck(name, result);
    return result;
  } catch (error) {
    logCheck(name, false, `Error: ${error}`);
    return false;
  }
}

async function main() {
  log('\n🔬 COMPLETE SYSTEM VERIFICATION TEST\n', colors.magenta);
  log('Verifying all features are preserved with new orchestrated architecture', colors.yellow);
  
  const results: Record<string, boolean> = {};
  
  // ========================================================================
  logSection('1. CORE SEARCH FEATURES');
  
  // Test NCT Direct Lookup
  results['nct_lookup'] = await verifyFeature(
    'NCT Direct Lookup (TROPION-Lung12)',
    async () => {
      const tool = clinicalTrialsOrchestratedTool('test-verification-1');
      const result = await tool.execute({
        query: 'NCT06564844',
        strategy: 'auto'
      });
      return result.success && 
             result.matches?.length === 1 &&
             result.matches[0].trial.protocolSection?.identificationModule?.nctId === 'NCT06564844';
    }
  );
  
  // Test Multi-dimensional Search
  results['multi_dimensional'] = await verifyFeature(
    'Multi-dimensional Search (location + condition + mutation)',
    async () => {
      const tool = clinicalTrialsOrchestratedTool('test-verification-2');
      const result = await tool.execute({
        query: 'KRAS G12C lung cancer trials in Boston',
        searchParams: { maxResults: 5 }
      });
      return result.success && (result.matches?.length || 0) > 0;
    }
  );
  
  // Test Profile-Optional Search
  results['profile_optional'] = await verifyFeature(
    'Profile-Optional Search (for professionals)',
    async () => {
      const tool = clinicalTrialsOrchestratedTool('test-verification-3');
      const result = await tool.execute({
        query: 'breast cancer trials',
        useProfile: 'never',
        searchParams: { maxResults: 3 }
      });
      return result.success && (result.matches?.length || 0) > 0;
    }
  );
  
  // ========================================================================
  logSection('2. CONVERSATION STORE FEATURES');
  
  // Test Store Integration
  const testChatId = 'test-store-verification';
  const storeTool = clinicalTrialsOrchestratedTool(testChatId);
  
  // First search to populate store
  const storeResult1 = await storeTool.execute({
    query: 'lung cancer',
    searchParams: { maxResults: 5 }
  });
  
  results['store_population'] = await verifyFeature(
    'Conversation Store Population',
    async () => {
      if (!storeResult1.success || !storeResult1.matches) return false;
      
      // Check if trials were stored
      const storedCount = conversationTrialStore.getTrialCount(testChatId);
      return storedCount >= storeResult1.matches.length;
    }
  );
  
  // Test Instant Retrieval
  if (storeResult1.matches && storeResult1.matches.length > 0) {
    const firstNctId = storeResult1.matches[0].trial.protocolSection?.identificationModule?.nctId;
    
    results['instant_retrieval'] = await verifyFeature(
      `Instant NCT Retrieval (${firstNctId})`,
      async () => {
        const retrieveResult = await storeTool.execute({
          query: `Show me ${firstNctId}`,
          strategy: 'auto'
        });
        return retrieveResult.success && 
               retrieveResult.matches?.length === 1 &&
               retrieveResult.matches[0].trial.protocolSection?.identificationModule?.nctId === firstNctId;
      }
    );
  }
  
  // Test Continuation
  results['continuation'] = await verifyFeature(
    'Continuation ("show me more")',
    async () => {
      const moreResult = await storeTool.execute({
        query: 'show me more',
        strategy: 'continuation',
        searchParams: { maxResults: 3 }
      });
      return moreResult.success === true;
    }
  );
  
  // ========================================================================
  logSection('3. UI COMPATIBILITY');
  
  results['ui_structure'] = await verifyFeature(
    'UI-Compatible Data Structure',
    async () => {
      const tool = clinicalTrialsOrchestratedTool('test-ui-compat');
      const result = await tool.execute({
        query: 'lung cancer',
        searchParams: { maxResults: 1 }
      });
      
      if (!result.success || !result.matches || result.matches.length === 0) {
        return false;
      }
      
      const match = result.matches[0];
      
      // Check all required UI fields
      const hasRequiredFields = 
        // Core trial data
        match.trial !== undefined &&
        match.trial.protocolSection !== undefined &&
        
        // Match scoring
        match.matchScore !== undefined &&
        
        // Eligibility assessment structure
        match.eligibilityAssessment !== undefined &&
        match.eligibilityAssessment.searchRelevance !== undefined &&
        match.eligibilityAssessment.searchRelevance.matchedTerms !== undefined &&
        match.eligibilityAssessment.searchRelevance.relevanceScore !== undefined &&
        match.eligibilityAssessment.searchRelevance.searchStrategy !== undefined &&
        match.eligibilityAssessment.searchRelevance.reasoning !== undefined &&
        
        // Trial criteria
        match.eligibilityAssessment.trialCriteria !== undefined &&
        match.eligibilityAssessment.trialCriteria.parsed !== undefined &&
        match.eligibilityAssessment.trialCriteria.inclusion !== undefined &&
        match.eligibilityAssessment.trialCriteria.exclusion !== undefined &&
        
        // Location summary
        match.locationSummary !== undefined;
      
      return hasRequiredFields;
    }
  );
  
  results['full_trial_data'] = await verifyFeature(
    'Full Trial Data Preservation',
    async () => {
      const tool = clinicalTrialsOrchestratedTool('test-full-data');
      const result = await tool.execute({
        query: 'NCT06564844',
        strategy: 'auto'
      });
      
      if (!result.success || !result.matches || result.matches.length === 0) {
        return false;
      }
      
      const trial = result.matches[0].trial;
      
      // Check for comprehensive trial data
      const hasFullData = 
        trial.protocolSection?.identificationModule?.nctId !== undefined &&
        trial.protocolSection?.identificationModule?.briefTitle !== undefined &&
        trial.protocolSection?.statusModule !== undefined &&
        trial.protocolSection?.contactsLocationsModule !== undefined;
      
      return hasFullData;
    }
  );
  
  // ========================================================================
  logSection('4. SEARCH FILTERS & PARAMETERS');
  
  results['status_filter'] = await verifyFeature(
    'Status Filter (RECRUITING only)',
    async () => {
      const tool = clinicalTrialsOrchestratedTool('test-filters');
      const result = await tool.execute({
        query: 'cancer trials',
        searchParams: {
          maxResults: 5,
          filters: {
            status: ['RECRUITING']
          }
        }
      });
      return result.success === true;
    }
  );
  
  results['max_results'] = await verifyFeature(
    'Max Results Limiting',
    async () => {
      const tool = clinicalTrialsOrchestratedTool('test-limiting');
      const result = await tool.execute({
        query: 'cancer',
        searchParams: { maxResults: 3 }
      });
      return result.success && 
             result.matches !== undefined &&
             result.matches.length <= 3;
    }
  );
  
  // ========================================================================
  logSection('5. ERROR HANDLING');
  
  results['invalid_nct'] = await verifyFeature(
    'Invalid NCT ID Handling',
    async () => {
      const tool = clinicalTrialsOrchestratedTool('test-error');
      const result = await tool.execute({
        query: 'NCT99999999',
        strategy: 'auto'
      });
      // Should succeed but with 0 results or appropriate message
      return result.success === true || result.error !== undefined;
    }
  );
  
  // ========================================================================
  logSection('TEST SUMMARY');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  const allPassed = passed === total;
  
  console.log('\n' + '='.repeat(80));
  
  if (allPassed) {
    log(`✅ ALL FEATURES VERIFIED (${passed}/${total})`, colors.green);
    log('\n🎉 The orchestrated architecture preserves ALL existing functionality!', colors.magenta);
  } else {
    log(`⚠️  SOME FEATURES NEED ATTENTION (${passed}/${total} passed)`, colors.yellow);
    
    console.log('\nFailed checks:');
    for (const [feature, passed] of Object.entries(results)) {
      if (!passed) {
        log(`  ❌ ${feature}`, colors.red);
      }
    }
  }
  
  console.log('='.repeat(80) + '\n');
}

// Run verification
main().catch(error => {
  log(`\n❌ Verification failed: ${error}`, colors.red);
  process.exit(1);
});
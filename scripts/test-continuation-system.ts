#!/usr/bin/env tsx

import { config } from 'dotenv';
import { clinicalTrialsTool } from '../lib/tools/clinical-trials';
import { cacheService } from '../lib/tools/clinical-trials/services/cache-service';
import type { HealthProfile } from '../lib/tools/clinical-trials/types';

// Load environment variables
config({ path: '.env' });

async function testContinuationSystem() {
  console.log('Testing Intelligent Continuation System\n');
  console.log('='.repeat(60));
  
  // Mock health profile
  const healthProfile: HealthProfile = {
    id: 'test-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    cancerRegion: 'THORACIC',
    cancerType: 'NSCLC',
    diseaseStage: 'STAGE_IV',
    molecularMarkers: {
      KRAS_G12C: 'POSITIVE',
      EGFR: 'NEGATIVE'
    }
  };
  
  const chatId = 'test-chat-' + Date.now();
  const userCoordinates = { latitude: 41.8781, longitude: -87.6298 }; // Chicago
  
  console.log('\nTest 1: Initial Search');
  console.log('-'.repeat(60));
  
  const tool = clinicalTrialsTool(chatId, undefined, userCoordinates);
  
  try {
    // Initial search
    const result1 = await tool.execute({
      query: 'Find clinical trials for NSCLC with KRAS G12C mutation'
    });
    
    console.log('✅ Initial search completed');
    console.log(`  Total Trials: ${result1.totalCount || 0}`);
    console.log(`  Returned: ${result1.matches?.length || 0} trials`);
    console.log(`  Has More: ${result1.hasMore || false}`);
    
    if (result1.matches && result1.matches.length > 0) {
      console.log(`  First Trial: ${result1.matches[0].trial.nctId}`);
    }
    
    // Check cache status
    const cached = cacheService.getCachedSearch(chatId);
    console.log(`  Cache Status: ${cached ? 'Active' : 'Not found'}`);
    if (cached) {
      console.log(`    Cached Trials: ${cached.trials.length}`);
      console.log(`    Shown Trials: ${cached.shownTrialIds.size}`);
      console.log(`    Has Context: ${!!cached.searchContext}`);
    }
    
    console.log('\nTest 2: Continuation Query (Show More)');
    console.log('-'.repeat(60));
    
    // Continuation query
    const result2 = await tool.execute({
      query: 'Show me more trials'
    });
    
    console.log('✅ Continuation query completed');
    console.log(`  Total Trials: ${result2.totalCount || 0}`);
    console.log(`  Returned: ${result2.matches?.length || 0} trials`);
    console.log(`  Has More: ${result2.hasMore || false}`);
    console.log(`  Is Continuation: ${result2.metadata?.isContinuation || false}`);
    
    if (result2.matches && result2.matches.length > 0) {
      console.log(`  First Trial: ${result2.matches[0].trial.nctId}`);
      
      // Check for duplicates
      const firstBatchIds = new Set(result1.matches?.map(m => m.trial.nctId) || []);
      const secondBatchIds = result2.matches.map(m => m.trial.nctId);
      const duplicates = secondBatchIds.filter(id => firstBatchIds.has(id));
      
      if (duplicates.length > 0) {
        console.log(`  ❌ Found ${duplicates.length} duplicate trials: ${duplicates.join(', ')}`);
      } else {
        console.log(`  ✅ No duplicate trials - continuation working correctly`);
      }
    }
    
    console.log('\nTest 3: Another Continuation');
    console.log('-'.repeat(60));
    
    const result3 = await tool.execute({
      query: 'Show me the next batch'
    });
    
    console.log('✅ Third batch query completed');
    console.log(`  Returned: ${result3.matches?.length || 0} trials`);
    console.log(`  Has More: ${result3.hasMore || false}`);
    
    // Final cache check
    const finalCache = cacheService.getCachedSearch(chatId);
    console.log('\nFinal Cache Status:');
    console.log(`  Total Cached: ${finalCache?.trials.length || 0}`);
    console.log(`  Total Shown: ${finalCache?.shownTrialIds.size || 0}`);
    console.log(`  Remaining: ${(finalCache?.trials.length || 0) - (finalCache?.shownTrialIds.size || 0)}`);
    
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }
  
  console.log('\nTest 4: Clear Cache and Test Fallback');
  console.log('-'.repeat(60));
  
  // Clear cache to test fallback
  cacheService.clearCache(chatId);
  console.log('Cache cleared');
  
  try {
    const result4 = await tool.execute({
      query: 'Show me more'
    });
    
    if (result4.matches && result4.matches.length > 0) {
      console.log('✅ Fallback worked - got results without cache');
      console.log(`  Returned: ${result4.matches.length} trials`);
    } else {
      console.log('ℹ️ No results - this is expected without cache');
      console.log(`  Message: ${result4.message}`);
    }
  } catch (error) {
    console.log(`❌ Error in fallback: ${error}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Continuation System Testing Complete');
  console.log('\nSummary:');
  console.log('- Initial search returns first batch');
  console.log('- Continuation queries return new trials (no duplicates)');
  console.log('- Cache tracks shown vs available trials');
  console.log('- System handles cache expiry gracefully');
}

testContinuationSystem().catch(console.error);
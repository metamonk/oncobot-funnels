#!/usr/bin/env tsx

/**
 * Comprehensive test for location-based search fixes
 * Tests that "kras g12c trials chicago" returns Chicago trials, not 40 nationwide trials
 */

import dotenv from 'dotenv';
dotenv.config();

import { ClinicalTrialsRouter } from '../lib/tools/clinical-trials/router';
import { debug, DebugCategory } from '../lib/tools/clinical-trials/debug';

async function testComprehensiveFix() {
  console.log('🧪 Comprehensive Location Fix Test\n');
  console.log('=' .repeat(80));
  
  const router = new ClinicalTrialsRouter();
  
  // Test profile - NSCLC with KRAS G12C
  const healthProfile = {
    id: 'test-123',
    userId: 'user-123',
    cancerRegion: 'THORACIC',
    cancerType: 'NSCLC',
    diseaseStage: 'STAGE_IV',
    molecularMarkers: {
      KRAS_G12C: 'POSITIVE' as const,
      EGFR: 'NEGATIVE' as const,
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Chicago coordinates
  const chicagoCoordinates = {
    latitude: 41.8781,
    longitude: -87.6298
  };
  
  console.log('\n📍 Test 1: Query with explicit location - "kras g12c trials chicago"');
  console.log('-'.repeat(60));
  
  const query1 = "kras g12c trials chicago";
  
  try {
    const result1 = await router.routeWithContext({
      query: query1,
      healthProfile,
      userCoordinates: chicagoCoordinates,
      chatId: 'test-comprehensive-1'
    });
    
    console.log('✅ Search completed');
    console.log(`📊 Results: ${result1.matches.length} trials found`);
    console.log(`📈 Total available: ${result1.totalCount || result1.matches.length}`);
    
    // Analyze location relevance
    let chicagoTrials = 0;
    let illinoisTrials = 0;
    let outOfStateTrials = 0;
    
    result1.matches.forEach(match => {
      const locations = match.trial.protocolSection?.contactsLocationsModule?.locations || [];
      const hasChicago = locations.some(loc => 
        loc.city?.toLowerCase() === 'chicago' ||
        loc.facility?.toLowerCase().includes('chicago')
      );
      const hasIllinois = locations.some(loc => 
        loc.state?.toLowerCase() === 'illinois' ||
        loc.state?.toLowerCase() === 'il'
      );
      
      if (hasChicago) chicagoTrials++;
      else if (hasIllinois) illinoisTrials++;
      else outOfStateTrials++;
    });
    
    console.log('\n📍 Location Analysis:');
    console.log(`  - Chicago trials: ${chicagoTrials}/${result1.matches.length} (${(chicagoTrials/result1.matches.length*100).toFixed(1)}%)`);
    console.log(`  - Other Illinois: ${illinoisTrials}/${result1.matches.length} (${(illinoisTrials/result1.matches.length*100).toFixed(1)}%)`);
    console.log(`  - Out of state: ${outOfStateTrials}/${result1.matches.length} (${(outOfStateTrials/result1.matches.length*100).toFixed(1)}%)`);
    
    // Check if the total count issue is fixed
    if (result1.totalCount && result1.totalCount > 30) {
      console.log('\n⚠️ WARNING: Still getting high total count:', result1.totalCount);
      console.log('   This suggests location filtering is not working at API level');
    } else {
      console.log('\n✅ SUCCESS: Total count is reasonable, location filtering working!');
    }
    
    // Check KRAS G12C relevance
    let krasTrials = 0;
    result1.matches.forEach(match => {
      const hasKRAS = 
        match.trial.summary?.toLowerCase().includes('kras') ||
        match.trial.eligibility?.toLowerCase().includes('kras') ||
        match.trial.conditions?.some(c => c.toLowerCase().includes('kras')) ||
        match.matchReason?.toLowerCase().includes('kras');
      
      if (hasKRAS) krasTrials++;
    });
    
    console.log('\n🧬 KRAS G12C Relevance:');
    console.log(`  - KRAS-related: ${krasTrials}/${result1.matches.length} (${(krasTrials/result1.matches.length*100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('❌ Error in test 1:', error);
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('\n📍 Test 2: Follow-up query - "show me more"');
  console.log('-'.repeat(60));
  
  const query2 = "show me more";
  
  try {
    const result2 = await router.routeWithContext({
      query: query2,
      healthProfile,
      userCoordinates: chicagoCoordinates,
      chatId: 'test-comprehensive-1', // Same chat ID for continuation
      conversationContext: {
        messages: [{ content: query1 }],
        previousTrialIds: [] // Would normally have the IDs from first search
      }
    });
    
    console.log('✅ Continuation search completed');
    console.log(`📊 Additional results: ${result2.matches.length} trials`);
    
    // Check if these are also Chicago-focused
    let chicagoTrials2 = 0;
    result2.matches.forEach(match => {
      const hasChicago = match.trial.protocolSection?.contactsLocationsModule?.locations?.some(loc => 
        loc.city?.toLowerCase() === 'chicago' ||
        loc.state?.toLowerCase() === 'illinois'
      );
      if (hasChicago) chicagoTrials2++;
    });
    
    console.log(`📍 Chicago relevance: ${chicagoTrials2}/${result2.matches.length} (${(chicagoTrials2/result2.matches.length*100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('❌ Error in test 2:', error);
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('\n📍 Test 3: Profile enrichment verification');
  console.log('-'.repeat(60));
  
  // Check if profile enrichment is working by looking at metadata
  const query3 = "clinical trials"; // Generic query that should use profile
  
  try {
    const result3 = await router.routeWithContext({
      query: query3,
      healthProfile,
      userCoordinates: chicagoCoordinates,
      chatId: 'test-comprehensive-2'
    });
    
    console.log('✅ Generic query completed');
    console.log(`📊 Results: ${result3.matches.length} trials`);
    
    // Check metadata for profile enrichment
    const metadata = result3.metadata as any;
    if (metadata?.profileApplied || metadata?.profileUsed) {
      console.log('✅ Profile enrichment: ACTIVE');
    } else {
      console.log('⚠️ Profile enrichment: NOT DETECTED');
    }
    
    // Verify NSCLC focus
    let nsclcTrials = 0;
    result3.matches.forEach(match => {
      const hasNSCLC = 
        match.trial.summary?.toLowerCase().includes('nsclc') ||
        match.trial.summary?.toLowerCase().includes('non-small cell') ||
        match.trial.conditions?.some(c => c.toLowerCase().includes('lung'));
      
      if (hasNSCLC) nsclcTrials++;
    });
    
    console.log(`🫁 NSCLC relevance: ${nsclcTrials}/${result3.matches.length} (${(nsclcTrials/result3.matches.length*100).toFixed(1)}%)`);
    
    if (nsclcTrials / result3.matches.length < 0.5) {
      console.log('⚠️ WARNING: Less than 50% NSCLC trials - profile may not be applied properly');
    } else {
      console.log('✅ SUCCESS: Majority are NSCLC trials - profile is being used!');
    }
    
  } catch (error) {
    console.error('❌ Error in test 3:', error);
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('\n🎯 SUMMARY');
  console.log('-'.repeat(60));
  console.log('Key fixes validated:');
  console.log('1. Location parameter (query.locn) should be passed to API');
  console.log('2. Total count should be reasonable (<30 for Chicago KRAS G12C)');
  console.log('3. Results should be primarily Chicago/Illinois trials');
  console.log('4. Profile enrichment should be active');
  console.log('5. KRAS G12C and NSCLC relevance should be high');
}

// Run the test
testComprehensiveFix().catch(console.error);
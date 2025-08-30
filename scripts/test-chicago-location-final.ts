#!/usr/bin/env tsx

/**
 * Final integration test for Chicago location extraction
 * This tests the complete flow from query to API call
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import { ClinicalTrialsRouter } from '../lib/tools/clinical-trials/router';
import { debug, DebugCategory } from '../lib/tools/clinical-trials/debug';

async function testChicagoQuery() {
  console.log('🧪 Testing Chicago Location Extraction - Full Integration\n');
  console.log('=' .repeat(80));
  
  const router = new ClinicalTrialsRouter();
  
  // Test profile (NSCLC with KRAS G12C mutation)
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
  
  const query = "kras g12c trials chicago";
  
  console.log(`\n📝 Query: "${query}"`);
  console.log(`🧬 Profile: NSCLC, Stage IV, KRAS G12C positive\n`);
  
  try {
    // Route the query
    const result = await router.routeWithContext({
      query,
      healthProfile,
      chatId: 'test-chat-123'
    });
    
    console.log('✅ Search completed successfully!\n');
    console.log('📊 Results:');
    console.log(`- Total trials found: ${result.matches.length}`);
    console.log(`- Metadata:`, JSON.stringify(result.metadata, null, 2));
    
    if (result.matches.length > 0) {
      console.log('\n🏥 First 3 trials:');
      result.matches.slice(0, 3).forEach((trial, index) => {
        console.log(`\n${index + 1}. ${trial.title}`);
        console.log(`   NCT ID: ${trial.nctId}`);
        console.log(`   Status: ${trial.overallStatus}`);
        console.log(`   Sponsor: ${trial.sponsor}`);
        
        // Check if trial mentions Chicago or Illinois
        const hasChicago = trial.locations?.some(loc => 
          loc.facility?.toLowerCase().includes('chicago') ||
          loc.city?.toLowerCase() === 'chicago' ||
          loc.state?.toLowerCase() === 'illinois'
        );
        
        if (hasChicago) {
          console.log(`   ✅ Location: CHICAGO AREA TRIAL`);
          const chicagoLocations = trial.locations?.filter(loc => 
            loc.facility?.toLowerCase().includes('chicago') ||
            loc.city?.toLowerCase() === 'chicago'
          );
          chicagoLocations?.forEach(loc => {
            console.log(`      - ${loc.facility}, ${loc.city}, ${loc.state}`);
          });
        } else {
          console.log(`   ⚠️ Location: Not in Chicago area`);
          if (trial.locations && trial.locations.length > 0) {
            console.log(`      First location: ${trial.locations[0].facility}, ${trial.locations[0].city}, ${trial.locations[0].state}`);
          }
        }
        
        // Check if trial mentions KRAS G12C
        const hasKRAS = trial.summary?.toLowerCase().includes('kras') || 
                        trial.eligibility?.toLowerCase().includes('kras') ||
                        trial.conditions?.some(c => c.toLowerCase().includes('kras'));
        
        if (hasKRAS) {
          console.log(`   ✅ KRAS G12C: Mentioned in trial`);
        } else {
          console.log(`   ⚠️ KRAS G12C: Not explicitly mentioned`);
        }
      });
      
      // Summary statistics
      const chicagoTrials = result.matches.filter(trial => 
        trial.locations?.some(loc => 
          loc.facility?.toLowerCase().includes('chicago') ||
          loc.city?.toLowerCase() === 'chicago' ||
          loc.state?.toLowerCase() === 'illinois'
        )
      );
      
      const krasTrials = result.matches.filter(trial => 
        trial.summary?.toLowerCase().includes('kras') || 
        trial.eligibility?.toLowerCase().includes('kras') ||
        trial.conditions?.some(c => c.toLowerCase().includes('kras'))
      );
      
      console.log('\n📈 Summary Statistics:');
      console.log(`- Chicago-area trials: ${chicagoTrials.length}/${result.matches.length} (${(chicagoTrials.length/result.matches.length*100).toFixed(1)}%)`);
      console.log(`- KRAS-related trials: ${krasTrials.length}/${result.matches.length} (${(krasTrials.length/result.matches.length*100).toFixed(1)}%)`);
      
      if (chicagoTrials.length === 0) {
        console.log('\n❌ ISSUE: No Chicago-area trials found despite location in query!');
        console.log('   The location extraction may not be working properly.');
      } else if (chicagoTrials.length < result.matches.length / 2) {
        console.log('\n⚠️ WARNING: Less than half of results are Chicago-area trials.');
        console.log('   The location filtering may need improvement.');
      } else {
        console.log('\n✅ SUCCESS: Majority of results are Chicago-area trials!');
      }
      
    } else {
      console.log('\n❌ No trials found!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testChicagoQuery().catch(console.error);
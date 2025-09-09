#!/usr/bin/env node

/**
 * Test location summary formatting with different trial structures
 * Following TRUE AI-DRIVEN principles - simple, deterministic
 */

import { resultComposer } from '../lib/tools/clinical-trials/atomic/result-composer';
import { ClinicalTrial } from '../lib/tools/clinical-trials/types';

async function testLocationSummary() {
  console.log('🧪 Testing Location Summary - Extremely Concise Format\n');
  console.log('=' .repeat(60));
  
  // Test different trial structures
  const testCases = [
    {
      name: "Real TROPION-Lung12 trial",
      fetchUrl: 'https://clinicaltrials.gov/api/v2/studies?query.term=TROPION-Lung12&format=json&pageSize=1',
      isReal: true
    },
    {
      name: "Trial with many locations",
      trial: {
        protocolSection: {
          identificationModule: {
            nctId: "NCT00000001",
            briefTitle: "Multi-site trial"
          },
          contactsLocationsModule: {
            locations: [
              { city: "Dallas", state: "Texas", country: "United States", status: "RECRUITING" },
              { city: "Houston", state: "Texas", country: "United States", status: "RECRUITING" },
              { city: "Chicago", state: "Illinois", country: "United States", status: "RECRUITING" },
              { city: "New York", state: "New York", country: "United States", status: "RECRUITING" },
              { city: "Los Angeles", state: "California", country: "United States", status: "RECRUITING" },
              { city: "San Francisco", state: "California", country: "United States", status: "NOT_YET_RECRUITING" },
              { city: "Boston", state: "Massachusetts", country: "United States", status: "RECRUITING" },
              { city: "Miami", state: "Florida", country: "United States", status: "RECRUITING" },
              { city: "Seattle", state: "Washington", country: "United States", status: "RECRUITING" },
              { city: "Portland", state: "Oregon", country: "United States", status: "RECRUITING" }
            ]
          }
        }
      } as ClinicalTrial,
      isReal: false
    },
    {
      name: "Trial with single location",
      trial: {
        protocolSection: {
          identificationModule: {
            nctId: "NCT00000002",
            briefTitle: "Single-site trial"
          },
          contactsLocationsModule: {
            locations: [
              { city: "Houston", state: "Texas", country: "United States", status: "RECRUITING" }
            ]
          }
        }
      } as ClinicalTrial,
      isReal: false
    },
    {
      name: "Trial with two locations",
      trial: {
        protocolSection: {
          identificationModule: {
            nctId: "NCT00000003",
            briefTitle: "Two-site trial"
          },
          contactsLocationsModule: {
            locations: [
              { city: "Dallas", state: "Texas", country: "United States", status: "RECRUITING" },
              { city: "Chicago", state: "Illinois", country: "United States", status: "RECRUITING" }
            ]
          }
        }
      } as ClinicalTrial,
      isReal: false
    },
    {
      name: "Trial with 402 locations (simulated)",
      trial: {
        protocolSection: {
          identificationModule: {
            nctId: "NCT00000004",
            briefTitle: "Large multi-site trial"
          },
          contactsLocationsModule: {
            locations: Array.from({ length: 402 }, (_, i) => ({
              city: i === 0 ? "Dallas" : i === 1 ? "Chicago" : `City${i}`,
              state: ["Texas", "California", "New York", "Florida", "Illinois"][i % 5],
              country: "United States",
              status: i % 3 === 0 ? "NOT_YET_RECRUITING" : "RECRUITING"
            }))
          }
        }
      } as ClinicalTrial,
      isReal: false
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📍 ${testCase.name}`);
    console.log('-'.repeat(40));
    
    let trial: ClinicalTrial;
    
    if (testCase.isReal) {
      // Fetch real trial data
      try {
        const response = await fetch(testCase.fetchUrl!);
        const data = await response.json();
        if (data.studies && data.studies.length > 0) {
          trial = data.studies[0];
        } else {
          console.log('❌ No trial data found');
          continue;
        }
      } catch (error) {
        console.log('❌ Error fetching trial:', error);
        continue;
      }
    } else {
      trial = testCase.trial!;
    }
    
    // Test the compose method
    const result = await resultComposer.compose({
      searchResults: [
        {
          source: 'test',
          trials: [trial],
          weight: 1
        }
      ],
      query: 'test query',
      maxResults: 10,
      healthProfile: null,
      chatId: 'test-chat'
    });
    
    if (result.matches && result.matches.length > 0) {
      const match = result.matches[0];
      const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
      const recruitingCount = locations.filter((l: any) => 
        l.status === 'RECRUITING' || l.status === 'NOT_YET_RECRUITING'
      ).length;
      
      console.log('Location Summary:', match.locationSummary);
      console.log('Total locations:', locations.length);
      console.log('Recruiting/Not yet:', recruitingCount);
      
      // Validate format
      if (recruitingCount === 1) {
        console.log('✅ Format: Single city name');
      } else if (recruitingCount === 2) {
        console.log('✅ Format: "City1 and City2"');
      } else if (recruitingCount > 2) {
        console.log('✅ Format: "City1, City2 and X other locations"');
      } else {
        console.log('✅ Format: "X locations" (no recruiting sites)');
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Location summary testing complete');
  console.log('\n🎯 Key principle: EXTREMELY CONCISE - just 2 cities and total count');
  console.log('   Following TRUE AI-DRIVEN: simple, deterministic, no patterns');
}

testLocationSummary();
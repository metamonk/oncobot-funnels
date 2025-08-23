#!/usr/bin/env tsx

/**
 * Comprehensive test of the clinical trials search flow
 * Tests various query types with the fixed API field names
 */

import { clinicalTrialsRouter } from '../lib/tools/clinical-trials/router';
import type { RouterContext, HealthProfile } from '../lib/tools/clinical-trials/types';

// Mock health profile for testing
const mockHealthProfile: HealthProfile = {
  id: 'test-profile',
  createdAt: new Date(),
  updatedAt: new Date(),
  cancerType: 'Non-Small Cell Lung Cancer',
  diseaseStage: 'Stage IIIA',
  treatmentHistory: ['chemotherapy'],
  performanceStatus: 'ECOG 1',
  molecularMarkers: {
    markers: [
      { name: 'KRAS G12C', status: 'POSITIVE' }
    ]
  }
};

async function testSearchFlow() {
  console.log('=== Testing Clinical Trials Search Flow ===\n');
  
  const testCases = [
    {
      name: 'NCT ID Direct Lookup',
      query: 'Show me NCT03785249',
      expectedField: 'filter.ids'
    },
    {
      name: 'Condition-Based Search',
      query: 'Find trials for lung cancer',
      expectedField: 'cond'
    },
    {
      name: 'Location-Based Search',
      query: 'Clinical trials in Chicago',
      expectedField: 'locn'
    },
    {
      name: 'Profile-Based Search',
      query: 'Find trials for my cancer',
      expectedField: 'term',
      useProfile: true
    },
    {
      name: 'Molecular Marker Search',
      query: 'KRAS G12C trials for NSCLC',
      expectedField: 'cond'
    },
    {
      name: 'Broad Search',
      query: 'cancer clinical trials',
      expectedField: 'term'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n${testCase.name}:`);
    console.log(`Query: "${testCase.query}"`);
    
    try {
      const context: RouterContext = {
        query: testCase.query,
        healthProfile: testCase.useProfile ? mockHealthProfile : undefined,
        dataStream: {
          writeMessageAnnotation: (msg: any) => {
            // Log API calls for debugging
            if (msg.type === 'clinical_trials_query') {
              console.log(`  API Call: field=${msg.data.field}, query="${msg.data.query}"`);
            }
          }
        }
      };
      
      const result = await clinicalTrialsRouter.routeWithContext(context);
      
      if (result.success) {
        console.log(`  ✅ Success: ${result.matches?.length || 0} matches found`);
        if (result.matches && result.matches.length > 0) {
          const firstMatch = result.matches[0];
          console.log(`  First match: ${firstMatch.nctId} - ${firstMatch.title}`);
          
          // Check if location information is included when relevant
          if (testCase.name.includes('Location') && firstMatch.locations) {
            console.log(`  Locations: ${firstMatch.locations.slice(0, 2).map(l => 
              `${l.city}, ${l.state}`).join('; ')}`);
          }
          
          // Check if molecular markers are considered
          if (testCase.name.includes('Molecular') && firstMatch.summary) {
            const hasKRAS = firstMatch.summary.toLowerCase().includes('kras');
            console.log(`  KRAS mentioned: ${hasKRAS ? '✅' : '❌'}`);
          }
        }
        console.log(`  Message: ${result.message}`);
      } else {
        console.log(`  ❌ Failed: ${result.error || result.message}`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  console.log('\n=== Test Complete ===');
}

// Run tests
testSearchFlow().catch(console.error);
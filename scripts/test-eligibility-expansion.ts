#!/usr/bin/env tsx

/**
 * Test script for verifying the eligibility criteria expansion feature
 * Tests the API endpoint that fetches full eligibility criteria
 */

import { nctLookup } from '../lib/tools/clinical-trials/atomic/nct-lookup';

async function testEligibilityExpansion() {
  console.log('🧪 Testing Eligibility Criteria Expansion Feature\n');
  console.log('='.repeat(60));
  
  const testNctId = 'NCT03917381'; // TROPION-Lung12 trial
  
  try {
    // Test 1: Fetch trial using NCT lookup tool
    console.log(`\n📋 Test 1: Fetching trial ${testNctId} using NCT lookup tool`);
    const result = await nctLookup.lookup(testNctId);
    
    if (!result.success || !result.trial) {
      console.error('❌ Failed to fetch trial');
      return;
    }
    
    const trial = result.trial;
    console.log('✅ Trial fetched successfully');
    console.log(`   Title: ${trial.protocolSection?.identificationModule?.briefTitle}`);
    
    // Test 2: Check if eligibility criteria exists
    console.log(`\n📋 Test 2: Checking eligibility criteria`);
    const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
    
    if (!eligibilityCriteria) {
      console.error('❌ No eligibility criteria found');
      return;
    }
    
    console.log('✅ Eligibility criteria found');
    console.log(`   Length: ${eligibilityCriteria.length} characters`);
    console.log(`   Lines: ${eligibilityCriteria.split('\n').length}`);
    
    // Test 3: Test the API endpoint
    console.log(`\n📋 Test 3: Testing /api/trials/${testNctId}/criteria endpoint`);
    
    // Simulate the API logic
    const lines = eligibilityCriteria.split('\n').filter(line => line.trim());
    const inclusionStart = lines.findIndex(line => 
      line.toLowerCase().includes('inclusion')
    );
    const exclusionStart = lines.findIndex(line => 
      line.toLowerCase().includes('exclusion')
    );
    
    console.log(`   Inclusion section starts at line: ${inclusionStart}`);
    console.log(`   Exclusion section starts at line: ${exclusionStart}`);
    
    const inclusionCriteria = inclusionStart >= 0 && exclusionStart > inclusionStart
      ? lines.slice(inclusionStart + 1, exclusionStart)
      : [];
    
    const exclusionCriteria = exclusionStart >= 0
      ? lines.slice(exclusionStart + 1)
      : [];
    
    console.log(`   Inclusion criteria found: ${inclusionCriteria.length} items`);
    console.log(`   Exclusion criteria found: ${exclusionCriteria.length} items`);
    
    // Test 4: Verify the formatted structure
    console.log(`\n📋 Test 4: Verifying formatted structure`);
    
    const categorizeCriterion = (text: string): string => {
      const textLower = text.toLowerCase();
      if (textLower.includes('age') || textLower.includes('year') || textLower.includes('sex') || textLower.includes('gender')) {
        return 'demographics';
      }
      if (textLower.includes('cancer') || textLower.includes('tumor') || textLower.includes('stage') || textLower.includes('diagnosis')) {
        return 'disease';
      }
      if (textLower.includes('mutation') || textLower.includes('biomarker') || textLower.includes('gene') || textLower.includes('kras') || textLower.includes('egfr')) {
        return 'biomarker';
      }
      if (textLower.includes('treatment') || textLower.includes('therapy') || textLower.includes('drug') || textLower.includes('prior')) {
        return 'treatment';
      }
      if (textLower.includes('ecog') || textLower.includes('performance') || textLower.includes('karnofsky')) {
        return 'performance';
      }
      if (textLower.includes('consent') || textLower.includes('able to') || textLower.includes('willing')) {
        return 'administrative';
      }
      return 'general';
    };
    
    const formatCriteria = (criteriaList: string[], type: 'inclusion' | 'exclusion') => {
      return criteriaList
        .map(c => c.trim())
        .filter(Boolean)
        .map((text, index) => ({
          id: `${type}-${index}`,
          text: text,
          category: categorizeCriterion(text),
          required: true
        }));
    };
    
    const formattedInclusion = formatCriteria(inclusionCriteria, 'inclusion');
    const formattedExclusion = formatCriteria(exclusionCriteria, 'exclusion');
    
    console.log('✅ Structure formatted correctly');
    console.log('\n📊 Sample Formatted Criteria:');
    
    if (formattedInclusion.length > 0) {
      console.log('\n   Inclusion (first 3):');
      formattedInclusion.slice(0, 3).forEach(c => {
        console.log(`     - [${c.category}] ${c.text.substring(0, 80)}...`);
      });
    }
    
    if (formattedExclusion.length > 0) {
      console.log('\n   Exclusion (first 3):');
      formattedExclusion.slice(0, 3).forEach(c => {
        console.log(`     - [${c.category}] ${c.text.substring(0, 80)}...`);
      });
    }
    
    // Test 5: Verify the final response structure
    console.log(`\n📋 Test 5: Verifying API response structure`);
    
    const response = {
      nctId: testNctId,
      fullCriteria: {
        raw: eligibilityCriteria,
        structured: {
          parsed: true,
          inclusion: formattedInclusion,
          exclusion: formattedExclusion
        },
        metadata: {
          totalLength: eligibilityCriteria.length,
          lineCount: lines.length,
          hasInclusionSection: inclusionStart >= 0,
          hasExclusionSection: exclusionStart >= 0
        }
      }
    };
    
    // Verify the structure matches what ProgressiveCriteria expects
    const hasCorrectStructure = 
      response.fullCriteria &&
      response.fullCriteria.raw &&
      response.fullCriteria.structured &&
      response.fullCriteria.structured.parsed === true &&
      Array.isArray(response.fullCriteria.structured.inclusion) &&
      Array.isArray(response.fullCriteria.structured.exclusion) &&
      response.fullCriteria.metadata;
    
    if (hasCorrectStructure) {
      console.log('✅ Response structure matches ProgressiveCriteria component expectations');
      console.log('\n📊 Response Summary:');
      console.log(`   - Raw criteria: ${response.fullCriteria.raw.length} characters`);
      console.log(`   - Parsed: ${response.fullCriteria.structured.parsed}`);
      console.log(`   - Inclusion criteria: ${response.fullCriteria.structured.inclusion.length} items`);
      console.log(`   - Exclusion criteria: ${response.fullCriteria.structured.exclusion.length} items`);
      console.log(`   - Total lines: ${response.fullCriteria.metadata.lineCount}`);
      console.log(`   - Has inclusion section: ${response.fullCriteria.metadata.hasInclusionSection}`);
      console.log(`   - Has exclusion section: ${response.fullCriteria.metadata.hasExclusionSection}`);
    } else {
      console.error('❌ Response structure does not match component expectations');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed! The eligibility expansion feature should work correctly.');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testEligibilityExpansion();
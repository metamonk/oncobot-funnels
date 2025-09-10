/**
 * API endpoint for fetching full eligibility criteria for a specific trial
 * Uses the new atomic NCT lookup tool
 */

import { NextRequest, NextResponse } from 'next/server';
import { nctLookup } from '@/lib/tools/clinical-trials/atomic/nct-lookup';
import type { ClinicalTrial } from '@/lib/tools/clinical-trials/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nctId: string }> }
) {
  try {
    const { nctId } = await params;
    
    // Validate NCT ID format
    if (!nctId || !/^NCT\d{8}$/i.test(nctId)) {
      return NextResponse.json(
        { error: 'Invalid NCT ID format. Expected format: NCT12345678' },
        { status: 400 }
      );
    }

    // Fetch the trial using the atomic NCT lookup tool
    const result = await nctLookup.lookup(nctId.toUpperCase());
    
    if (!result.success || !result.trial) {
      return NextResponse.json(
        { error: `Trial ${nctId} not found` },
        { status: 404 }
      );
    }
    
    const trial = result.trial as ClinicalTrial;
    
    // Extract full eligibility criteria
    const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
    
    if (!eligibilityCriteria) {
      return NextResponse.json(
        { 
          nctId,
          fullCriteria: null,
          message: 'No eligibility criteria available for this trial' 
        },
        { status: 200 }
      );
    }
    
    // Parse basic inclusion/exclusion criteria
    const lines = eligibilityCriteria.split('\n').filter(line => line.trim());
    const inclusionStart = lines.findIndex(line => 
      line.toLowerCase().includes('inclusion')
    );
    const exclusionStart = lines.findIndex(line => 
      line.toLowerCase().includes('exclusion')
    );
    
    const inclusionCriteria = inclusionStart >= 0 && exclusionStart > inclusionStart
      ? lines.slice(inclusionStart + 1, exclusionStart)
      : [];
    
    const exclusionCriteria = exclusionStart >= 0
      ? lines.slice(exclusionStart + 1)
      : [];
    
    // Helper function to categorize criteria based on keywords
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
    
    // Format criteria as expected by the component
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
    
    // Return comprehensive criteria data with the correct structure
    return NextResponse.json({
      nctId,
      fullCriteria: {
        raw: eligibilityCriteria,
        structured: {
          parsed: true,
          inclusion: formatCriteria(inclusionCriteria, 'inclusion'),
          exclusion: formatCriteria(exclusionCriteria, 'exclusion')
        },
        metadata: {
          totalLength: eligibilityCriteria.length,
          lineCount: lines.length,
          hasInclusionSection: inclusionStart >= 0,
          hasExclusionSection: exclusionStart >= 0
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching trial criteria:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trial criteria' },
      { status: 500 }
    );
  }
}
/**
 * API endpoint for fetching full eligibility criteria for a specific trial
 * Supports Progressive Disclosure pattern for token efficiency
 */

import { NextRequest, NextResponse } from 'next/server';
import { SearchExecutor } from '@/lib/tools/clinical-trials/search-executor';
import { trialAssessmentBuilder } from '@/lib/tools/clinical-trials/trial-assessment-builder';
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

    // Fetch the full trial data using SearchExecutor
    const searchExecutor = new SearchExecutor();
    
    // Use executeSearch to fetch by NCT ID
    // The ClinicalTrials.gov API uses query.nctid for NCT ID searches
    const result = await searchExecutor.executeSearch(
      `query.nctid:${nctId.toUpperCase()}`,
      { pageSize: 1, countTotal: false }
    );
    
    const trials = result?.studies || [];
    
    if (!trials || trials.length === 0) {
      return NextResponse.json(
        { error: `Trial ${nctId} not found` },
        { status: 404 }
      );
    }
    
    const trial = trials[0] as ClinicalTrial;
    
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
    
    // Build structured assessment with full parsing
    const assessment = await trialAssessmentBuilder.buildAssessment(trial, null);
    
    // Return comprehensive criteria data
    return NextResponse.json({
      nctId,
      fullCriteria: {
        raw: eligibilityCriteria,
        structured: assessment.trialCriteria,
        metadata: {
          totalLength: eligibilityCriteria.length,
          lineCount: eligibilityCriteria.split('\n').length,
          hasInclusionSection: eligibilityCriteria.toLowerCase().includes('inclusion'),
          hasExclusionSection: eligibilityCriteria.toLowerCase().includes('exclusion')
        }
      },
      // Also include other useful trial info for context
      trialInfo: {
        title: trial.protocolSection?.identificationModule?.briefTitle,
        status: trial.protocolSection?.statusModule?.overallStatus,
        conditions: trial.protocolSection?.conditionsModule?.conditions,
        phase: trial.protocolSection?.designModule?.phases,
        lastUpdated: trial.protocolSection?.statusModule?.lastUpdatePostDateStruct?.date
      }
    });
    
  } catch (error) {
    console.error('[API] Error fetching trial criteria:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch trial criteria',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Cache the response for 1 hour to reduce API calls
export const revalidate = 3600;
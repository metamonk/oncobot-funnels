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
    
    // Return comprehensive criteria data
    return NextResponse.json({
      nctId,
      fullCriteria: {
        raw: eligibilityCriteria,
        structured: {
          totalCriteria: inclusionCriteria.length + exclusionCriteria.length,
          inclusionCriteria: inclusionCriteria.map(c => c.trim()).filter(Boolean),
          exclusionCriteria: exclusionCriteria.map(c => c.trim()).filter(Boolean),
          ageRange: {
            min: trial.protocolSection?.eligibilityModule?.minimumAge,
            max: trial.protocolSection?.eligibilityModule?.maximumAge
          },
          sex: trial.protocolSection?.eligibilityModule?.sex,
          acceptsHealthyVolunteers: trial.protocolSection?.eligibilityModule?.healthyVolunteers
        },
        metadata: {
          title: trial.protocolSection?.identificationModule?.briefTitle,
          overallStatus: trial.protocolSection?.statusModule?.overallStatus,
          lastUpdatePosted: trial.protocolSection?.statusModule?.lastUpdatePostDateStruct?.date
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
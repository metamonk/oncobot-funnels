/**
 * Example usage of the pipeline system for batch operations
 */

import { 
  TrialPipeline, 
  PipelineTemplates,
  createBatchPipeline,
  type OperatorContext 
} from '../index';

/**
 * Example 1: Batch NCT lookup with location filter
 * User query: "Which of these trials have sites in Chicago: NCT05853575, NCT04000165, NCT04002440?"
 */
export async function batchLocationExample(context: OperatorContext) {
  const nctIds = ['NCT05853575', 'NCT04000165', 'NCT04002440'];
  
  const pipeline = createBatchPipeline(nctIds, {
    location: 'Chicago',
    streamResults: true
  });
  
  const result = await pipeline.execute([], {
    ...context,
    nctIds,
    location: 'Chicago'
  });
  
  if (result.success) {
    console.log(`Found ${result.data.length} trials with sites in Chicago`);
    
    // Access location metadata
    result.data.forEach((trial: any) => {
      if (trial._locationMatches) {
        console.log(`${trial.protocolSection.identificationModule.nctId} matches: ${trial._locationMatches.join(', ')}`);
      }
    });
  }
  
  return result;
}

/**
 * Example 2: Batch eligibility assessment
 * User query: "Am I eligible for any of these trials: NCT05853575, NCT04000165, NCT04002440?"
 */
export async function batchEligibilityExample(context: OperatorContext) {
  const nctIds = ['NCT05853575', 'NCT04000165', 'NCT04002440'];
  
  const pipeline = PipelineTemplates.batchEligibilityCheck();
  
  const result = await pipeline.execute([], {
    ...context,
    nctIds,
    intent: 'eligibility'
  });
  
  if (result.success) {
    const eligibleTrials = result.data.filter((trial: any) => 
      trial._eligibilityAnalysis?.likelyEligible
    );
    
    console.log(`Likely eligible for ${eligibleTrials.length} out of ${result.data.length} trials`);
    
    // Access detailed eligibility analysis
    result.data.forEach((trial: any) => {
      const analysis = trial._eligibilityAnalysis;
      if (analysis) {
        console.log(`${trial.protocolSection.identificationModule.nctId}:`);
        console.log(`  Score: ${analysis.eligibilityScore}`);
        console.log(`  Matches: ${analysis.inclusionMatches.join(', ')}`);
        console.log(`  Concerns: ${analysis.exclusionConcerns.join(', ')}`);
      }
    });
  }
  
  return result;
}

/**
 * Example 3: Complex multi-location batch query
 * User query: "Show me which of these trials have sites in Chicago, Boston, or New York: [list of NCT IDs]"
 */
export async function multiLocationExample(context: OperatorContext) {
  const nctIds = [
    'NCT05853575', 'NCT04000165', 'NCT04002440',
    'NCT05568550', 'NCT12345678', 'NCT98765432'
  ];
  
  const locations = ['Chicago', 'Boston', 'New York'];
  
  const pipeline = createBatchPipeline(nctIds, {
    locations,
    analyzeEligibility: false,
    streamResults: true
  });
  
  const result = await pipeline.execute([], {
    ...context,
    nctIds,
    locations
  });
  
  if (result.success) {
    // Group trials by location
    const trialsByLocation: Record<string, any[]> = {};
    
    locations.forEach(location => {
      trialsByLocation[location] = result.data.filter((trial: any) => 
        trial._locationMatches?.includes(location)
      );
    });
    
    // Report results
    locations.forEach(location => {
      console.log(`${location}: ${trialsByLocation[location].length} trials`);
      trialsByLocation[location].forEach(trial => {
        console.log(`  - ${trial.protocolSection.identificationModule.nctId}`);
      });
    });
  }
  
  return result;
}

/**
 * Example 4: Full analysis pipeline
 * User query: "Analyze these trials for eligibility and locations near me: [NCT IDs]"
 */
export async function fullAnalysisExample(context: OperatorContext) {
  const nctIds = ['NCT05853575', 'NCT04000165', 'NCT04002440'];
  
  const pipeline = PipelineTemplates.fullAnalysis();
  
  const result = await pipeline.execute([], {
    ...context,
    nctIds,
    location: context.location || 'Boston', // Use user's location or default
    intent: 'eligibility'
  });
  
  if (result.success) {
    // Comprehensive results
    result.data.forEach((trial: any) => {
      const nctId = trial.protocolSection.identificationModule.nctId;
      const title = trial.protocolSection.identificationModule.briefTitle;
      const hasLocation = trial._locationMatches?.length > 0;
      const isEligible = trial._eligibilityAnalysis?.likelyEligible;
      const score = trial._eligibilityAnalysis?.eligibilityScore || 0;
      
      console.log(`\n${nctId}: ${title}`);
      console.log(`  Location Match: ${hasLocation ? 'Yes' : 'No'}`);
      console.log(`  Likely Eligible: ${isEligible ? 'Yes' : 'No'} (Score: ${score.toFixed(2)})`);
      
      if (trial._eligibilityAnalysis?.inclusionMatches?.length > 0) {
        console.log(`  Matches: ${trial._eligibilityAnalysis.inclusionMatches.join(', ')}`);
      }
      
      if (trial._eligibilityAnalysis?.exclusionConcerns?.length > 0) {
        console.log(`  Concerns: ${trial._eligibilityAnalysis.exclusionConcerns.join(', ')}`);
      }
    });
    
    // Pipeline metadata
    console.log('\nPipeline Execution Metadata:');
    result.metadata.forEach(meta => {
      console.log(`  ${meta.operatorName}: ${meta.processingTime}ms (${meta.inputCount} → ${meta.outputCount})`);
    });
  }
  
  return result;
}

/**
 * Example 5: Using the pipeline directly in the clinical-trials tool
 */
export async function integrateWithMainTool(
  userQuery: string,
  healthProfile: any,
  dataStream: any
): Promise<any> {
  // Detect batch NCT IDs in query
  const nctPattern = /NCT\d{8}/gi;
  const nctIds = [...new Set((userQuery.match(nctPattern) || []).map(id => id.toUpperCase()))];
  
  if (nctIds.length > 1) {
    // Batch operation detected
    console.log(`Detected batch operation with ${nctIds.length} NCT IDs`);
    
    // Detect additional filters
    const hasLocationQuery = /in |near |at |located/i.test(userQuery);
    const hasEligibilityQuery = /eligible|qualify|can i|criteria/i.test(userQuery);
    
    // Extract location if mentioned
    let location: string | undefined;
    const locationMatch = userQuery.match(/(?:in|near|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    if (locationMatch) {
      location = locationMatch[1];
    }
    
    // Create appropriate pipeline
    const pipeline = createBatchPipeline(nctIds, {
      location,
      analyzeEligibility: hasEligibilityQuery,
      streamResults: true
    });
    
    // Execute pipeline
    const result = await pipeline.execute([], {
      nctIds,
      location,
      healthProfile,
      userQuery,
      dataStream,
      intent: hasEligibilityQuery ? 'eligibility' : 'discovery'
    });
    
    if (result.success) {
      // Transform to expected format for UI with reduced trial data
      return {
        success: true,
        matches: result.data.map(trial => {
          // Extract only essential data to avoid token limits
          const reducedTrial = {
            protocolSection: {
              identificationModule: {
                nctId: trial.protocolSection?.identificationModule?.nctId,
                briefTitle: trial.protocolSection?.identificationModule?.briefTitle,
                officialTitle: trial.protocolSection?.identificationModule?.officialTitle
              },
              statusModule: {
                overallStatus: trial.protocolSection?.statusModule?.overallStatus || ''
              },
              descriptionModule: {
                briefSummary: trial.protocolSection?.descriptionModule?.briefSummary ? 
                  trial.protocolSection.descriptionModule.briefSummary.substring(0, 500) + '...' : ''
              },
              conditionsModule: {
                conditions: trial.protocolSection?.conditionsModule?.conditions?.slice(0, 3),
                keywords: trial.protocolSection?.conditionsModule?.keywords?.slice(0, 3)
              },
              designModule: {
                phases: trial.protocolSection?.designModule?.phases,
                studyType: trial.protocolSection?.designModule?.studyType
              },
              armsInterventionsModule: {
                interventions: trial.protocolSection?.armsInterventionsModule?.interventions?.slice(0, 2)?.map((intervention: any) => ({
                  type: intervention.type,
                  name: intervention.name,
                  description: intervention.description ? intervention.description.substring(0, 200) + '...' : undefined
                }))
              },
              eligibilityModule: {
                // For batch operations, only include minimal eligibility info
                eligibilityCriteria: trial.protocolSection?.eligibilityModule?.eligibilityCriteria ? 'Available' : 'Not specified',
                sex: trial.protocolSection?.eligibilityModule?.sex,
                minimumAge: trial.protocolSection?.eligibilityModule?.minimumAge,
                maximumAge: trial.protocolSection?.eligibilityModule?.maximumAge
              },
              contactsLocationsModule: {
                // Include only first 3 locations to reduce data size
                locations: trial.protocolSection?.contactsLocationsModule?.locations?.slice(0, 3)?.map((loc: any) => ({
                  facility: loc.facility,
                  city: loc.city,
                  state: loc.state,
                  country: loc.country,
                  status: loc.status
                })),
                centralContacts: trial.protocolSection?.contactsLocationsModule?.centralContacts?.slice(0, 1),
                totalLocations: trial.protocolSection?.contactsLocationsModule?.locations?.length || 0
              }
            }
          };
          
          return {
            trial: reducedTrial,
            matchScore: 100, // Batch lookups are exact matches
            eligibilityAnalysis: (trial as any)._eligibilityAnalysis,
            locationMatches: (trial as any)._locationMatches
          };
        }),
        totalCount: result.data.length,
        message: `Batch operation completed for ${nctIds.length} trials`,
        pipelineMetadata: result.metadata
      };
    }
  }
  
  // Fall back to regular processing for non-batch queries
  return null;
}
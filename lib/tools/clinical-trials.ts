import { tool } from 'ai';
import { z } from 'zod';
import { DataStreamWriter, generateObject } from 'ai';
import { getUserHealthProfile } from '@/lib/health-profile-actions';
import { oncobot } from '@/ai/providers';

// ClinicalTrials.gov API configuration
const BASE_URL = 'https://clinicaltrials.gov/api/v2';
const STUDIES_ENDPOINT = `${BASE_URL}/studies`;

// Only process trials with these statuses
const VIABLE_STUDY_STATUSES = [
  'RECRUITING',
  'ENROLLING_BY_INVITATION', 
  'ACTIVE_NOT_RECRUITING',
  'NOT_YET_RECRUITING'
] as const;

interface ClinicalTrial {
  protocolSection: {
    identificationModule: {
      nctId: string;
      briefTitle: string;
      officialTitle?: string;
    };
    statusModule: {
      overallStatus: string;
    };
    descriptionModule?: {
      briefSummary?: string;
    };
    conditionsModule?: {
      conditions?: string[];
      keywords?: string[];
    };
    designModule?: {
      phases?: string[];
    };
    armsInterventionsModule?: {
      interventions?: Array<{
        type: string;
        name: string;
        description?: string;
      }>;
    };
    eligibilityModule?: {
      eligibilityCriteria?: string;
    };
    contactsLocationsModule?: {
      locations?: Array<{
        facility?: string;
        city?: string;
        state?: string;
        country?: string;
      }>;
    };
  };
}

// Helper function to truncate text
function truncateText(text: string | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}


// Helper function to generate intelligent search queries using AI
async function generateSearchQueries(userQuery: string, healthProfile: any) {
  try {
    const { object: queryPlan } = await generateObject({
      model: oncobot.languageModel('oncobot-x-fast'),
      schema: z.object({
        queries: z.array(z.object({
          query: z.string().describe('A specific search query for ClinicalTrials.gov'),
          rationale: z.string().describe('Why this query is important for this patient')
        })).min(3).max(5).describe('3-5 targeted search queries')
      }),
      prompt: `Generate 3-5 targeted clinical trial search queries for ClinicalTrials.gov based on:
      
User Query: ${userQuery}
Health Profile: ${JSON.stringify(healthProfile, null, 2)}

Guidelines:
- Create specific queries that cover different aspects of the patient's condition
- Include queries for specific mutations (e.g., "KRAS G12C lung cancer")
- Include broader queries for the cancer type
- Include treatment-line specific queries if relevant
- Queries should be 2-8 words, optimized for ClinicalTrials.gov search
- Consider both targeted therapies and immunotherapies
- If molecular markers are present, create specific queries for them`
    });

    return queryPlan.queries.map(q => q.query);
  } catch (error) {
    console.error('Error generating search queries:', error);
    // Fallback to simple query generation
    const queries = [];
    if (healthProfile?.cancerType) {
      queries.push(healthProfile.cancerType);
      if (healthProfile.molecularMarkers?.KRAS_G12C === 'POSITIVE') {
        queries.push(`${healthProfile.cancerType} KRAS G12C`);
      }
    }
    return queries.length > 0 ? queries : [userQuery];
  }
}

// Deduplicate trials by NCT ID
function deduplicateTrials(allTrials: ClinicalTrial[]): ClinicalTrial[] {
  const seen = new Set<string>();
  return allTrials.filter(trial => {
    const nctId = trial.protocolSection.identificationModule.nctId;
    if (seen.has(nctId)) return false;
    seen.add(nctId);
    return true;
  });
}

// Score and rank trials based on relevance
async function rankTrials(trials: ClinicalTrial[], healthProfile: any, maxResults: number) {
  if (trials.length === 0) return [];
  
  try {
    const { object: ranking } = await generateObject({
      model: oncobot.languageModel('oncobot-x-fast'),
      schema: z.object({
        rankedTrials: z.array(z.object({
          nctId: z.string(),
          relevanceScore: z.number().min(0).max(100),
          matchReason: z.string().describe('Brief explanation of why this trial matches')
        }))
      }),
      prompt: `Rank these clinical trials by relevance to the patient's profile:

Health Profile: ${JSON.stringify(healthProfile, null, 2)}

Trials: ${JSON.stringify(trials.map(t => ({
  nctId: t.protocolSection.identificationModule.nctId,
  title: t.protocolSection.identificationModule.briefTitle,
  conditions: t.protocolSection.conditionsModule?.conditions,
  interventions: t.protocolSection.armsInterventionsModule?.interventions?.map(i => i.name),
  eligibility: truncateText(t.protocolSection.eligibilityModule?.eligibilityCriteria, 500)
})), null, 2)}

Scoring criteria:
- Exact molecular marker matches (e.g., KRAS G12C) = highest priority
- Disease stage alignment
- Treatment line appropriateness
- Intervention type relevance
- General cancer type match

Return the trials ranked by relevance score.`
    });

    // Sort trials based on AI ranking
    const rankedNctIds = ranking.rankedTrials
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);
    
    // Create a map of rankings
    const rankMap = new Map(rankedNctIds.map((r, idx) => [r.nctId, { rank: idx, ...r }]));
    
    // Sort original trials based on ranking
    return trials
      .filter(t => rankMap.has(t.protocolSection.identificationModule.nctId))
      .sort((a, b) => {
        const rankA = rankMap.get(a.protocolSection.identificationModule.nctId)?.rank ?? 999;
        const rankB = rankMap.get(b.protocolSection.identificationModule.nctId)?.rank ?? 999;
        return rankA - rankB;
      })
      .map(trial => ({
        ...trial,
        matchReason: rankMap.get(trial.protocolSection.identificationModule.nctId)?.matchReason,
        relevanceScore: rankMap.get(trial.protocolSection.identificationModule.nctId)?.relevanceScore
      }));

  } catch (error) {
    console.error('Error ranking trials:', error);
    // Fallback to simple ranking
    return trials.slice(0, maxResults).map(trial => ({
      ...trial,
      matchReason: 'Matches search criteria',
      relevanceScore: 75
    }));
  }
}

// Create match objects for UI component
function createMatchObjects(trials: any[], healthProfile: any) {
  return trials.map(trial => {
    const locations = trial.protocolSection.contactsLocationsModule?.locations || [];
    const locationSummary = locations.slice(0, 3)
      .map((loc: any) => `${loc.city}, ${loc.state || loc.country || 'USA'}`)
      .join('; ') || 'Locations not specified';
    
    // Create eligibility analysis based on available data
    const eligibilityAnalysis = {
      likelyEligible: true, // Default to true for matched trials
      inclusionMatches: [] as string[],
      exclusionConcerns: [] as string[],
      uncertainFactors: [] as string[]
    };
    
    // Add match reasons based on the trial's match reason
    if (trial.matchReason) {
      eligibilityAnalysis.inclusionMatches.push(trial.matchReason);
    }
    
    // Add specific matches based on health profile
    if (healthProfile?.molecularMarkers?.KRAS_G12C === 'POSITIVE' && 
        (trial.protocolSection.identificationModule.briefTitle?.includes('KRAS') ||
         trial.protocolSection.descriptionModule?.briefSummary?.includes('KRAS'))) {
      eligibilityAnalysis.inclusionMatches.push('KRAS G12C mutation match');
    }
    
    if (healthProfile?.cancerType && 
        trial.protocolSection.conditionsModule?.conditions?.some((c: string) => 
          c.toLowerCase().includes(healthProfile.cancerType.toLowerCase()))) {
      eligibilityAnalysis.inclusionMatches.push(`${healthProfile.cancerType} diagnosis match`);
    }
    
    // Add uncertainty for trials not yet recruiting
    if (trial.protocolSection.statusModule.overallStatus === 'NOT_YET_RECRUITING') {
      eligibilityAnalysis.uncertainFactors.push('Trial not yet recruiting - check back for updates');
    }
    
    // Deduplicate inclusion matches
    eligibilityAnalysis.inclusionMatches = [...new Set(eligibilityAnalysis.inclusionMatches)];
    
    // Create a reduced trial object with only essential fields for UI
    const reducedTrial = {
      protocolSection: {
        identificationModule: {
          nctId: trial.protocolSection.identificationModule.nctId,
          briefTitle: trial.protocolSection.identificationModule.briefTitle,
          officialTitle: trial.protocolSection.identificationModule.officialTitle
        },
        statusModule: {
          overallStatus: trial.protocolSection.statusModule.overallStatus
        },
        descriptionModule: {
          briefSummary: truncateText(trial.protocolSection.descriptionModule?.briefSummary, 500)
        },
        conditionsModule: {
          conditions: trial.protocolSection.conditionsModule?.conditions?.slice(0, 3),
          keywords: trial.protocolSection.conditionsModule?.keywords?.slice(0, 3)
        },
        designModule: {
          phases: trial.protocolSection.designModule?.phases,
          studyType: trial.protocolSection.designModule?.studyType
        },
        armsInterventionsModule: {
          interventions: trial.protocolSection.armsInterventionsModule?.interventions?.slice(0, 2)
        },
        eligibilityModule: {
          // Don't include full eligibility criteria in the response - too much text
          eligibilityCriteria: trial.protocolSection.eligibilityModule?.eligibilityCriteria ? 'Available' : 'Not specified'
        },
        contactsLocationsModule: {
          locations: locations.slice(0, 3),
          centralContacts: trial.protocolSection.contactsLocationsModule?.centralContacts?.slice(0, 2)
        }
      }
    };
    
    return {
      trial: reducedTrial, // Reduced trial object for UI
      matchScore: trial.relevanceScore || 75, // Use AI score or default
      matchingCriteria: eligibilityAnalysis.inclusionMatches,
      eligibilityAnalysis,
      locationSummary
    };
  });
}

// Main tool export
export const clinicalTrialsTool = (dataStream?: DataStreamWriter): any => {
  return tool({
    description: 'Search for clinical trials. Always use action: "search" with searchParams for health-related queries.',
    parameters: z.object({
      action: z.enum(['search', 'details', 'eligibility_check']).describe('Always use "search" for finding trials'),
      searchParams: z.object({
        condition: z.string().optional().describe('The condition or query to search for'),
        location: z.string().optional().describe('Location to search near (e.g., "Chicago")'), 
        useProfile: z.boolean().optional().describe('Whether to use the user health profile (default: true)'),
        maxResults: z.number().optional().describe('Maximum number of results to return (default: 10)'),
        previousSearchId: z.string().optional().describe('For pagination (not currently used)')
      }).optional().describe('Parameters for search action'),
      trialId: z.string().optional().describe('NCT ID for details/eligibility (not currently implemented)'),
      previousSearchId: z.string().optional().describe('For pagination (not currently used)')
    }),
    execute: async ({ action, searchParams }) => {
      // Only implement the search action
      if (action !== 'search') {
        return {
          success: false,
          error: 'Only search action is currently implemented',
          message: 'Details and eligibility check features are coming soon.'
        };
      }

      const userQuery = searchParams?.condition || 'clinical trials';
      const useHealthProfile = searchParams?.useProfile ?? true;
      const maxResults = Math.min(searchParams?.maxResults || 5, 5); // Limit to 5 for token management
      const location = searchParams?.location;

      try {
        dataStream?.writeMessageAnnotation({
          type: 'search_status',
          data: {
            status: 'searching',
            message: 'Analyzing your health profile and searching for matching trials...'
          }
        });

        // Load health profile if requested
        let healthProfile = null;
        if (useHealthProfile) {
          try {
            const profileData = await getUserHealthProfile();
            if (profileData) {
              healthProfile = profileData.profile;
            }
          } catch (error) {
            console.log('Could not load health profile, proceeding without it');
          }
        }

        // Generate intelligent search queries
        const searchQueries = await generateSearchQueries(userQuery, healthProfile);
        console.log('Generated search queries:', searchQueries);

        // Execute all queries in parallel
        const allTrials: ClinicalTrial[] = [];
        const queryPromises = searchQueries.map(async (query) => {
          const params = new URLSearchParams({
            'query.term': query,
            pageSize: '20', // Get 20 per query for better coverage
            'filter.overallStatus': VIABLE_STUDY_STATUSES.join(',')
          });

          if (location) {
            params.append('query.locn', location);
          }

          const url = `${STUDIES_ENDPOINT}?${params}`;
          const response = await fetch(url);
          
          if (response.ok) {
            const data = await response.json();
            return data.studies || [];
          }
          return [];
        });

        const queryResults = await Promise.all(queryPromises);
        queryResults.forEach(trials => allTrials.push(...trials));

        // Deduplicate trials
        const uniqueTrials = deduplicateTrials(allTrials);
        console.log(`Found ${uniqueTrials.length} unique trials from ${allTrials.length} total`);

        if (uniqueTrials.length === 0) {
          return {
            success: true,
            matches: [], // UI expects 'matches' array
            totalCount: 0,
            searchCriteria: {
              condition: userQuery,
              location: location,
              useProfile: useHealthProfile,
              cancerType: healthProfile?.cancerType
            },
            message: 'No trials found matching your criteria. This could be due to limited trials for your specific profile. Consider discussing with your healthcare provider about broadening search criteria.'
          };
        }

        // Rank trials by relevance
        const rankedTrials = await rankTrials(uniqueTrials, healthProfile, maxResults);

        // Create match objects for UI component
        const matches = createMatchObjects(rankedTrials, healthProfile);

        // Store full trial data in annotations (doesn't count toward token limit)
        dataStream?.writeMessageAnnotation({
          type: 'trial_details',
          data: rankedTrials.map(trial => ({
            nctId: trial.protocolSection.identificationModule.nctId,
            fullTitle: trial.protocolSection.identificationModule.briefTitle,
            officialTitle: trial.protocolSection.identificationModule.officialTitle || '',
            status: trial.protocolSection.statusModule.overallStatus,
            phase: trial.protocolSection.designModule?.phases || [],
            conditions: trial.protocolSection.conditionsModule?.conditions || [],
            interventions: trial.protocolSection.armsInterventionsModule?.interventions || [],
            eligibility: trial.protocolSection.eligibilityModule?.eligibilityCriteria || '',
            locations: trial.protocolSection.contactsLocationsModule?.locations || [],
            description: trial.protocolSection.descriptionModule?.briefSummary || '',
            matchReason: trial.matchReason || ''
          }))
        });

        dataStream?.writeMessageAnnotation({
          type: 'search_status',
          data: {
            status: 'completed',
            totalResults: uniqueTrials.length,
            returnedResults: matches.length,
            searchQueries,
            message: `Found ${uniqueTrials.length} trials using ${searchQueries.length} targeted searches`
          }
        });

        // Return structure expected by UI component
        return {
          success: true,
          matches: matches, // UI expects 'matches' array, not 'results'
          totalCount: uniqueTrials.length,
          searchCriteria: {
            condition: userQuery,
            location: location,
            useProfile: useHealthProfile,
            cancerType: healthProfile?.cancerType
          },
          query: searchQueries.join('; '),
          message: `Found ${uniqueTrials.length} clinical trials. Showing the ${matches.length} most relevant matches based on your health profile.`
        };

      } catch (error) {
        console.error('Clinical trials search error:', error);
        
        return {
          success: false,
          matches: [], // UI expects 'matches' array
          totalCount: 0,
          error: error instanceof Error ? error.message : 'Search failed',
          message: 'Unable to search clinical trials at this time. Please try again.'
        };
      }
    }
  });
};
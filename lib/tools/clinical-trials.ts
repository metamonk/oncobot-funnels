import { tool } from 'ai';
import { z } from 'zod';
import { DataStreamWriter } from 'ai';
import { generateObject } from 'ai';
import { oncobot } from '@/ai/providers';
import { getUserHealthProfile } from '@/lib/health-profile-actions';

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

// Schema for AI entity extraction
const entityExtractionSchema = z.object({
  mutations: z.array(z.string()).describe('Genetic mutations mentioned (e.g., KRAS G12C, EGFR)'),
  cancerTypes: z.array(z.string()).describe('Cancer types mentioned (e.g., NSCLC, lung cancer)'),
  drugs: z.array(z.string()).describe('Drug names mentioned (e.g., sotorasib, adagrasib)'),
  locations: z.array(z.string()).describe('Locations mentioned (e.g., Chicago, Boston)'),
  trialNames: z.array(z.string()).describe('Specific trial names (e.g., CodeBreak, KRYSTAL)'),
  lineOfTherapy: z.enum(['first', 'second_or_later', 'any', 'unknown']).describe('Treatment line preference'),
  otherTerms: z.array(z.string()).describe('Other relevant search terms')
});

// Schema for AI query generation
const queryGenerationSchema = z.object({
  queries: z.array(z.object({
    priority: z.number().describe('Query priority (1-10, higher is more important)'),
    type: z.enum(['term', 'condition', 'intervention', 'location']).describe('API field to use'),
    value: z.string().describe('Query value'),
    rationale: z.string().describe('Why this query is important')
  })).describe('List of queries to execute, ordered by priority')
});

// Schema for AI result ranking
const resultRankingSchema = z.object({
  rankedTrials: z.array(z.object({
    nctId: z.string(),
    relevanceScore: z.number().describe('Relevance score 0-100'),
    matchReasons: z.array(z.string()).describe('Why this trial matches'),
    lineOfTherapy: z.enum(['first', 'second_or_later', 'unknown']).optional(),
    hasChicagoSite: z.boolean().optional()
  }))
});

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

// Extract entities from user query using AI
async function extractEntities(userQuery: string, healthProfile?: any): Promise<z.infer<typeof entityExtractionSchema>> {
  const { object: entities } = await generateObject({
    model: oncobot.languageModel('oncobot-haiku'),
    schema: entityExtractionSchema,
    prompt: `Extract key entities from this clinical trial search query. Be comprehensive but accurate.

User Query: "${userQuery}"

${healthProfile ? `Health Profile Context:
- Cancer Type: ${healthProfile.cancerType || 'Not specified'}
- Molecular Markers: ${JSON.stringify(healthProfile.molecularMarkers || {})}
- Disease Stage: ${healthProfile.diseaseStage || 'Not specified'}` : 'No health profile available'}

Instructions:
- Extract ALL mutations mentioned (include variations like KRAS G12C, KRAS p.G12C, KRASG12C)
- Include drug names if searching for specific treatments
- Identify locations if mentioned
- Note any specific trial names (CodeBreak, KRYSTAL, etc.)
- Determine line of therapy if mentioned (first-line, previously treated, etc.)`,
    temperature: 0
  });

  return entities;
}

// Generate simple API queries based on extracted entities
async function generateQueries(entities: z.infer<typeof entityExtractionSchema>): Promise<z.infer<typeof queryGenerationSchema>['queries']> {
  const { object: { queries } } = await generateObject({
    model: oncobot.languageModel('oncobot-haiku'),
    schema: queryGenerationSchema,
    prompt: `Generate simple, effective ClinicalTrials.gov API queries based on these entities.

Entities:
${JSON.stringify(entities, null, 2)}

API Query Types:
- query.term: Searches across all text fields (use for mutations, general terms)
- query.cond: Searches condition/disease fields (use sparingly, can be too restrictive)
- query.intr: Searches intervention fields (use for drug names)
- Location should be added as a simple string to any query

Guidelines:
1. Keep queries SIMPLE - usually just 1-2 terms
2. Prefer query.term for mutations and general searches
3. Use query.intr specifically for drug names
4. Start broad, can narrow later
5. If location exists, it should be added to the highest priority queries
6. Generate 3-7 queries maximum
7. Order by likelihood of finding relevant results

Example good queries:
- {type: "term", value: "KRAS G12C", priority: 10}
- {type: "intervention", value: "sotorasib adagrasib", priority: 8}
- {type: "term", value: "CodeBreak KRYSTAL", priority: 7}`,
    temperature: 0
  });

  return queries.sort((a, b) => b.priority - a.priority);
}

// Execute queries progressively until we have enough results
async function executeQueries(
  queries: z.infer<typeof queryGenerationSchema>['queries'],
  location?: string,
  maxResults: number = 20,
  dataStream?: DataStreamWriter
): Promise<ClinicalTrial[]> {
  const allTrials = new Map<string, ClinicalTrial>();
  const executedQueries: { query: string; count: number }[] = [];

  for (const query of queries) {
    // Build API parameters
    const params = new URLSearchParams({
      pageSize: maxResults.toString(),
      'filter.overallStatus': VIABLE_STUDY_STATUSES.join(',')
    });

    // Add query based on type
    if (query.type === 'term') {
      params.append('query.term', query.value);
    } else if (query.type === 'condition') {
      params.append('query.cond', query.value);
    } else if (query.type === 'intervention') {
      params.append('query.intr', query.value);
    }

    // Add location if provided
    if (location && query.priority >= 7) { // Only add location to high-priority queries
      params.append('query.locn', location);
    }

    const url = `${STUDIES_ENDPOINT}?${params}`;
    console.log(`Executing query: ${query.value} (${query.type}) - ${query.rationale}`);

    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const trials = data.studies || [];
        
        // Add unique trials to our collection
        trials.forEach((trial: ClinicalTrial) => {
          const nctId = trial.protocolSection.identificationModule.nctId;
          if (!allTrials.has(nctId)) {
            allTrials.set(nctId, trial);
          }
        });

        executedQueries.push({
          query: `${query.type}: ${query.value}${location ? ` + ${location}` : ''}`,
          count: trials.length
        });

        console.log(`Found ${trials.length} trials (${allTrials.size} unique total)`);
      }
    } catch (error) {
      console.error(`Query failed: ${query.value}`, error);
    }

    // Stop if we have enough results
    if (allTrials.size >= maxResults * 2) {
      break;
    }
  }

  // Log query execution summary
  dataStream?.writeMessageAnnotation({
    type: 'search_status',
    data: {
      status: 'queries_executed',
      queries: executedQueries,
      totalUnique: allTrials.size
    }
  });

  return Array.from(allTrials.values());
}

// AI-powered result ranking
async function rankResults(
  trials: ClinicalTrial[],
  entities: z.infer<typeof entityExtractionSchema>,
  userQuery: string
): Promise<z.infer<typeof resultRankingSchema>['rankedTrials']> {
  // Batch trials for efficient ranking
  const batchSize = 10;
  const rankedResults: z.infer<typeof resultRankingSchema>['rankedTrials'] = [];

  for (let i = 0; i < trials.length; i += batchSize) {
    const batch = trials.slice(i, i + batchSize);
    
    const { object: { rankedTrials } } = await generateObject({
      model: oncobot.languageModel('oncobot-haiku'),
      schema: resultRankingSchema,
      prompt: `Rank these clinical trials based on relevance to the user's search.

User Query: "${userQuery}"

Search Entities:
${JSON.stringify(entities, null, 2)}

Trials to Rank:
${batch.map(trial => ({
  nctId: trial.protocolSection.identificationModule.nctId,
  title: trial.protocolSection.identificationModule.briefTitle,
  conditions: trial.protocolSection.conditionsModule?.conditions,
  keywords: trial.protocolSection.conditionsModule?.keywords,
  phase: trial.protocolSection.designModule?.phases,
  eligibility: trial.protocolSection.eligibilityModule?.eligibilityCriteria?.substring(0, 500),
  hasChicagoSite: trial.protocolSection.contactsLocationsModule?.locations?.some(
    loc => loc.city?.toLowerCase().includes('chicago')
  )
})).map(t => JSON.stringify(t)).join('\n\n')}

Ranking Criteria:
1. Direct mutation matches (e.g., KRAS G12C) - highest priority
2. Location matches (Chicago sites) - very important
3. Cancer type matches
4. Line of therapy alignment
5. Drug/intervention matches
6. Trial phase (prefer Phase 2/3 for efficacy)

Assign relevance scores 0-100 and explain match reasons.`,
      temperature: 0
    });

    rankedResults.push(...rankedTrials);
  }

  // Sort by relevance score
  return rankedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// Main tool export
export const clinicalTrialsTool = (dataStream?: DataStreamWriter): any => {
  return tool({
    description: 'Search for clinical trials using AI-powered query generation and ranking. Automatically extracts key terms and builds optimal searches.',
    parameters: z.object({
      userQuery: z.string()
        .describe('Natural language description of what trials to search for'),
      useHealthProfile: z.boolean()
        .default(true)
        .describe('Whether to incorporate user health profile data'),
      maxResults: z.number()
        .default(10)
        .describe('Maximum number of results to return'),
      previousResults: z.array(z.string())
        .optional()
        .describe('NCT IDs to exclude from results (for pagination)')
    }),
    execute: async ({ userQuery, useHealthProfile, maxResults, previousResults }) => {
      try {
        // Stream status
        dataStream?.writeMessageAnnotation({
          type: 'search_status',
          data: {
            status: 'started',
            message: 'Analyzing your search request...'
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

        // Extract entities from query
        const entities = await extractEntities(userQuery, healthProfile);
        console.log('Extracted entities:', entities);

        dataStream?.writeMessageAnnotation({
          type: 'search_status',
          data: {
            status: 'entities_extracted',
            entities: entities
          }
        });

        // Generate optimized queries
        const queries = await generateQueries(entities);
        console.log(`Generated ${queries.length} queries`);

        // Execute queries
        const location = entities.locations?.[0]; // Use first location if any
        const trials = await executeQueries(queries, location, maxResults * 3, dataStream);

        if (trials.length === 0) {
          return {
            success: true,
            matches: [],
            totalCount: 0,
            message: 'No trials found matching your criteria. Try broadening your search.',
            searchSummary: {
              entities,
              queriesExecuted: queries.length
            }
          };
        }

        // Filter out previous results if provided
        const newTrials = previousResults 
          ? trials.filter(t => !previousResults.includes(t.protocolSection.identificationModule.nctId))
          : trials;

        // Rank results using AI
        dataStream?.writeMessageAnnotation({
          type: 'search_status',
          data: {
            status: 'ranking',
            message: `Ranking ${newTrials.length} trials for relevance...`
          }
        });

        const rankedResults = await rankResults(newTrials, entities, userQuery);
        
        // Take top results
        const topResults = rankedResults.slice(0, maxResults);

        // Fetch full trial data for top results
        const enrichedResults = topResults.map(ranked => {
          const trial = trials.find(t => 
            t.protocolSection.identificationModule.nctId === ranked.nctId
          )!;
          
          return {
            trial,
            relevanceScore: ranked.relevanceScore,
            matchReasons: ranked.matchReasons,
            lineOfTherapy: ranked.lineOfTherapy,
            hasChicagoSite: ranked.hasChicagoSite
          };
        });

        dataStream?.writeMessageAnnotation({
          type: 'search_status',
          data: {
            status: 'completed',
            totalResults: trials.length,
            returnedResults: enrichedResults.length,
            message: `Found ${enrichedResults.length} highly relevant trials`
          }
        });

        return {
          success: true,
          matches: enrichedResults,
          totalCount: trials.length,
          searchSummary: {
            entities,
            queriesExecuted: queries.length,
            topQueryTypes: queries.slice(0, 3).map(q => q.type)
          },
          hasMore: trials.length > maxResults,
          message: `Found ${enrichedResults.length} trials matching your search for "${userQuery}"`
        };

      } catch (error) {
        console.error('Clinical trials search error:', error);
        
        return {
          success: false,
          matches: [],
          totalCount: 0,
          error: error instanceof Error ? error.message : 'Search failed',
          message: 'Unable to search clinical trials at this time. Please try again.'
        };
      }
    }
  });
};
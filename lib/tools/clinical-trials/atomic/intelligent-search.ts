/**
 * Intelligent Search Atomic Tool
 * 
 * CONTEXT-AWARE: Following CLAUDE.md principles
 * - AI-DRIVEN: No hardcoded patterns or conditionals
 * - ROBUST: Adapts to new query patterns without code changes
 * - FLEXIBLE: Handles any combination of search entities
 * - DETERMINISTIC: Uses temperature 0.0 for consistency
 * 
 * This tool intelligently composes API parameters based on extracted entities,
 * avoiding brittle if/else chains and pattern libraries.
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { oncobot } from '@/ai/providers';
import { ClinicalTrial } from '../types';
import { debug, DebugCategory } from '../debug';
import type { QueryAnalysis } from './query-analyzer';

// Schema for AI-driven parameter composition
const ParameterCompositionSchema = z.object({
  parameters: z.record(z.string(), z.string()).describe('API parameters to use'),
  reasoning: z.string().describe('Explanation of parameter choices'),
  searchStrategy: z.enum(['single', 'parallel', 'sequential']).describe('How to execute the search')
});

interface IntelligentSearchParams {
  analysis: QueryAnalysis;
  healthProfile?: {
    cancerType?: string;
    molecularMarkers?: Record<string, string>;
  };
  maxResults?: number;
  filters?: {
    status?: string[];
    phase?: string[];
  };
}

interface IntelligentSearchResult {
  success: boolean;
  trials: ClinicalTrial[];
  totalCount: number;
  error?: {
    type: 'composition_failed' | 'api_error' | 'no_results';
    message: string;
    fallbackUsed?: boolean;
  };
  metadata: {
    parametersUsed: Record<string, string>;
    reasoning: string;
    latency: number;
  };
}

export class IntelligentSearchTool {
  private static readonly API_BASE = 'https://clinicaltrials.gov/api/v2';
  
  /**
   * AI-driven intelligent parameter composition
   * No hardcoded patterns - pure AI intelligence
   */
  private async composeSearchParameters(
    analysis: QueryAnalysis,
    healthProfile?: { cancerType?: string; molecularMarkers?: Record<string, string> }
  ): Promise<{ parameters: Record<string, string>; reasoning: string }> {
    try {
      // Build context for AI
      const entities = analysis.entities;
      const dimensions = analysis.dimensions;
      
      // Construct a clear prompt for parameter mapping
      const prompt = `You are composing ClinicalTrials.gov API parameters for optimal search results.

EXTRACTED ENTITIES:
- Mutations/Biomarkers: ${entities.mutations.length > 0 ? entities.mutations.join(', ') : 'none'}
- Locations (cities): ${entities.locations.cities.length > 0 ? entities.locations.cities.join(', ') : 'none'}
- Locations (states): ${entities.locations.states.length > 0 ? entities.locations.states.join(', ') : 'none'}
- Conditions/Diseases: ${entities.conditions.length > 0 ? entities.conditions.join(', ') : 'none'}
- Cancer Types: ${entities.cancerTypes.length > 0 ? entities.cancerTypes.join(', ') : 'none'}
- Drugs/Interventions/Trial Names: ${entities.drugs.length > 0 ? entities.drugs.join(', ') : 'none'}
- NCT IDs: ${entities.nctIds.length > 0 ? entities.nctIds.join(', ') : 'none'}
- Trial Phases: ${entities.phases.length > 0 ? entities.phases.join(', ') : 'none'}
- Sponsors: ${entities.sponsors.length > 0 ? entities.sponsors.join(', ') : 'none'}

${healthProfile ? `
PATIENT PROFILE:
- Cancer Type: ${healthProfile.cancerType || 'not specified'}
- Molecular Markers: ${healthProfile.molecularMarkers ? Object.entries(healthProfile.molecularMarkers)
  .filter(([_, v]) => v === 'POSITIVE')
  .map(([k]) => k)
  .join(', ') : 'none'}
` : ''}

AVAILABLE API PARAMETERS:
- query.term: General text search across all fields (searches everything including acronyms)
- query.locn: Location filter (cities, states, countries, postal codes)
- query.cond: Condition/disease filter (cancer types, diseases)
- query.intr: Intervention/drug filter (medications, treatments)
- query.spons: Sponsor organization filter
- query.titles: Search in trial titles and acronyms
- query.outc: Outcome measures search
- query.id: NCT ID search (for specific trial IDs)

CRITICAL INTELLIGENCE FOR TRIAL NAMES:
- If you see something that looks like a trial name (e.g., "TROPION-Lung 12", "KEYNOTE-671"):
  1. The ClinicalTrials.gov API is VERY LITERAL about matching
  2. "TROPION-Lung12" (no space) is DIFFERENT from "TROPION-Lung 12" (with space)
  3. Try the exact string in query.term FIRST
  4. If the trial name has spaces around numbers, also consider removing them
  5. Trial names are often stored as acronyms, so they match better in query.term

RULES:
1. NEVER put location terms in query.term - use query.locn for ALL location data
2. When both mutation AND location exist, use BOTH query.term (for mutation) AND query.locn (for location)
3. For trial names, use query.term with the EXACT string provided
4. Cancer types typically go in query.cond
5. Mutations and biomarkers typically go in query.term
6. If NCT IDs are present, use query.id for direct lookup

Compose the optimal parameter combination for finding relevant trials.
When dealing with trial names that might have spacing variations, prefer the version without spaces before numbers.
Return empty string for unused parameters.`;

      const result = await generateObject({
        model: oncobot.languageModel('oncobot-4o-mini'),
        schema: ParameterCompositionSchema,
        prompt,
        temperature: 0.0, // Deterministic as per CLAUDE.md
      });

      debug.log(DebugCategory.SEARCH, 'AI parameter composition', {
        input: { mutations: entities.mutations, locations: entities.locations },
        output: result.object.parameters,
        reasoning: result.object.reasoning
      });

      return {
        parameters: result.object.parameters,
        reasoning: result.object.reasoning
      };

    } catch (error) {
      debug.error(DebugCategory.ERROR, 'AI parameter composition failed', error);
      
      // Simple fallback - just use what we have directly
      // This is minimal as per CLAUDE.md - only for complete AI failure
      const fallbackParams: Record<string, string> = {};
      
      // Only the most basic fallback logic
      if (analysis.entities.nctIds.length > 0) {
        fallbackParams['query.id'] = analysis.entities.nctIds.join(' OR ');
      } else {
        // Combine everything into term as last resort
        const allTerms = [
          ...analysis.entities.mutations,
          ...analysis.entities.conditions,
          ...analysis.entities.cancerTypes,
          ...analysis.entities.drugs
        ].filter(Boolean);
        
        if (allTerms.length > 0) {
          fallbackParams['query.term'] = allTerms.join(' ');
        }
        
        // Still use location properly even in fallback
        const locationTerms = [
          ...analysis.entities.locations.cities,
          ...analysis.entities.locations.states
        ].filter(Boolean);
        
        if (locationTerms.length > 0) {
          fallbackParams['query.locn'] = locationTerms.join(', ');
        }
      }
      
      return {
        parameters: fallbackParams,
        reasoning: 'AI composition failed - using basic fallback'
      };
    }
  }
  
  /**
   * Execute intelligent search with AI-composed parameters
   */
  async search(params: IntelligentSearchParams): Promise<IntelligentSearchResult> {
    const startTime = Date.now();
    const { analysis, healthProfile, maxResults = 50, filters } = params;
    
    debug.log(DebugCategory.SEARCH, 'Intelligent search starting', {
      dimensions: analysis.dimensions,
      entityCounts: {
        mutations: analysis.entities.mutations.length,
        locations: analysis.entities.locations.cities.length,
        conditions: analysis.entities.conditions.length
      }
    });
    
    // Step 1: Use AI to compose optimal parameters
    const composition = await this.composeSearchParameters(analysis, healthProfile);
    
    // Step 2: Build API call with composed parameters
    const apiParams = new URLSearchParams({
      'format': 'json',
      'pageSize': maxResults.toString(),
      'countTotal': 'true'
    });
    
    // Add all composed parameters
    for (const [key, value] of Object.entries(composition.parameters)) {
      if (value && value.trim()) {
        apiParams.append(key, value);
      }
    }
    
    // Add filters if provided
    if (filters?.status && filters.status.length > 0) {
      apiParams.append('filter.overallStatus', filters.status.join(','));
    }
    
    if (filters?.phase && filters.phase.length > 0) {
      apiParams.append('filter.phase', filters.phase.join(','));
    }
    
    debug.log(DebugCategory.SEARCH, 'API call parameters', {
      url: `${IntelligentSearchTool.API_BASE}/studies`,
      params: Object.fromEntries(apiParams.entries())
    });
    
    try {
      const url = `${IntelligentSearchTool.API_BASE}/studies?${apiParams}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const trials = data.studies || [];
      const totalCount = data.totalCount || 0;
      
      debug.log(DebugCategory.SEARCH, 'Intelligent search results', {
        count: trials.length,
        total: totalCount,
        parameters: composition.parameters
      });
      
      if (trials.length === 0) {
        return {
          success: true,
          trials: [],
          totalCount: 0,
          error: {
            type: 'no_results',
            message: 'No trials found with the composed search parameters',
            fallbackUsed: composition.reasoning.includes('fallback')
          },
          metadata: {
            parametersUsed: composition.parameters,
            reasoning: composition.reasoning,
            latency: Date.now() - startTime
          }
        };
      }
      
      return {
        success: true,
        trials,
        totalCount,
        metadata: {
          parametersUsed: composition.parameters,
          reasoning: composition.reasoning,
          latency: Date.now() - startTime
        }
      };
      
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'Intelligent search failed', error);
      
      return {
        success: false,
        trials: [],
        totalCount: 0,
        error: {
          type: 'api_error',
          message: error instanceof Error ? error.message : 'Unknown error',
          fallbackUsed: composition.reasoning.includes('fallback')
        },
        metadata: {
          parametersUsed: composition.parameters,
          reasoning: composition.reasoning,
          latency: Date.now() - startTime
        }
      };
    }
  }
}

// Export singleton instance
export const intelligentSearch = new IntelligentSearchTool();
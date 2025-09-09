/**
 * Query Analyzer Atomic Tool - CLEAN VERSION
 * 
 * TRUE AI-DRIVEN: Following CLAUDE.md principles strictly
 * - NO pattern matching or regex
 * - NO hardcoded fallbacks
 * - Pure AI intelligence with temperature 0.0
 * - If AI fails, return minimal analysis
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { oncobot } from '@/ai/providers';
import { HealthProfile } from '../types';
import { debug, DebugCategory } from '../debug';

// Multi-dimensional understanding schema
const QueryAnalysisSchema = z.object({
  dimensions: z.object({
    hasLocationComponent: z.boolean(),
    hasConditionComponent: z.boolean(),
    hasMutationComponent: z.boolean(),
    hasNCTComponent: z.boolean(),
    hasEligibilityComponent: z.boolean(),
  }),
  
  entities: z.object({
    nctIds: z.array(z.string()),
    conditions: z.array(z.string()),
    cancerTypes: z.array(z.string()),
    mutations: z.array(z.string()),
    drugs: z.array(z.string()),
    locations: z.object({
      cities: z.array(z.string()),
      states: z.array(z.string()),
      countries: z.array(z.string()),
      isNearMe: z.boolean(),
    }),
    phases: z.array(z.string()),
    sponsors: z.array(z.string()),
  }),
  
  userIntent: z.object({
    primaryGoals: z.array(z.enum([
      'find_trials',
      'check_eligibility', 
      'get_trial_details',
      'find_locations',
      'continue_search'
    ])),
    specificity: z.enum(['very_specific', 'moderate', 'exploratory']),
  }),
  
  searchStrategy: z.object({
    recommendedTools: z.array(z.string()),
    reasoning: z.string(),
  }),
});

export type QueryAnalysis = z.infer<typeof QueryAnalysisSchema>;

interface QueryAnalyzerParams {
  query: string;
  conversationHistory?: string[];
  healthProfile?: HealthProfile | null;
}

export class QueryAnalyzerTool {
  /**
   * Analyze query using pure AI intelligence
   * NO PATTERNS, NO FALLBACKS - Trust AI completely
   */
  async analyze(params: QueryAnalyzerParams): Promise<{
    success: boolean;
    analysis?: QueryAnalysis;
    error?: string;
  }> {
    const { query, conversationHistory = [], healthProfile } = params;
    
    debug.log(DebugCategory.QUERY, 'Analyzing query', { query });
    
    try {
      // Build context for AI
      let context = `Analyze this clinical trials query comprehensively.\n\n`;
      context += `Query: "${query}"\n\n`;
      
      if (conversationHistory.length > 0) {
        context += `Recent conversation:\n${conversationHistory.slice(-3).join('\n')}\n\n`;
      }
      
      if (healthProfile) {
        context += `Patient has health profile with:\n`;
        context += `- Cancer Type: ${healthProfile.cancerType || 'not specified'}\n`;
        context += `- Stage: ${healthProfile.diseaseStage || 'not specified'}\n`;
        if (healthProfile.molecularMarkers) {
          const markers = Object.entries(healthProfile.molecularMarkers)
            .filter(([_, status]) => status === 'POSITIVE')
            .map(([marker]) => marker);
          if (markers.length > 0) {
            context += `- Mutations: ${markers.join(', ')}\n`;
          }
        }
        context += '\n';
      }
      
      const prompt = `${context}
Analyze this query for clinical trial search. Extract ALL entities mentioned:

CRITICAL EXTRACTION RULES:

1. TRIAL NAMES/STUDIES (put in drugs array):
   - "TROPION-Lung12" → drugs: ["TROPION-Lung12"]
   - "KEYNOTE-671" → drugs: ["KEYNOTE-671"]
   - These are study names, NOT NCT IDs
   
2. NCT IDs (only if explicitly like "NCT" followed by digits):
   - "NCT04595559" → nctIds: ["NCT04595559"]
   - "TROPION-Lung12" is NOT an NCT ID
   
3. LOCATIONS (extract ALL mentioned):
   - "Texas and Louisiana" → states: ["Texas", "Louisiana"]
   - "Chicago" → cities: ["Chicago"]
   - "near me" → isNearMe: true
   
4. CONDITIONS/CANCERS:
   - "lung cancer" → conditions: ["lung cancer"]
   - "NSCLC" → conditions: ["NSCLC"]
   
5. RECRUITMENT STATUS:
   - "open or not yet recruiting" → extract these as status requirements

EXAMPLES:
- "TROPION-Lung12 in Texas" → drugs: ["TROPION-Lung12"], states: ["Texas"]
- "NCT04595559 near Chicago" → nctIds: ["NCT04595559"], cities: ["Chicago"]
- "lung cancer trials in Texas and Louisiana" → conditions: ["lung cancer"], states: ["Texas", "Louisiana"]

EXTRACT EVERYTHING - don't miss any entities!`;
      
      const result = await generateObject({
        model: oncobot.languageModel('oncobot-default'), // Use default model for reliability
        schema: QueryAnalysisSchema,
        prompt,
        temperature: 0.0, // Deterministic
      });
      
      debug.log(DebugCategory.QUERY, 'Query analysis complete', {
        dimensions: result.object.dimensions,
        entityCounts: {
          conditions: result.object.entities.conditions.length,
          mutations: result.object.entities.mutations.length,
          locations: result.object.entities.locations.cities.length + result.object.entities.locations.states.length,
          nctIds: result.object.entities.nctIds.length,
          drugs: result.object.entities.drugs.length,
        },
        extractedEntities: {
          drugs: result.object.entities.drugs,
          states: result.object.entities.locations.states,
          cities: result.object.entities.locations.cities,
        }
      });
      
      return {
        success: true,
        analysis: result.object
      };
      
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'Query analysis failed', error);
      
      // AI failed - return minimal analysis, no patterns
      // This is honest: we couldn't analyze it properly
      return {
        success: false,
        error: 'AI analysis unavailable',
        analysis: {
          dimensions: {
            hasLocationComponent: false,
            hasConditionComponent: false,
            hasMutationComponent: false,
            hasNCTComponent: false,
            hasEligibilityComponent: false,
          },
          entities: {
            nctIds: [],
            conditions: [],
            cancerTypes: [],
            mutations: [],
            drugs: [],
            locations: {
              cities: [],
              states: [],
              countries: [],
              isNearMe: false,
            },
            phases: [],
            sponsors: [],
          },
          userIntent: {
            primaryGoals: ['find_trials'],
            specificity: 'exploratory',
          },
          searchStrategy: {
            recommendedTools: ['unified-search'],
            reasoning: 'AI unavailable - using basic search',
          },
        }
      };
    }
  }
}

// Export singleton instance
export const queryAnalyzer = new QueryAnalyzerTool();
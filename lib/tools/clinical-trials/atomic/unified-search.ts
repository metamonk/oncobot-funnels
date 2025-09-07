/**
 * Unified Search Atomic Tool
 * 
 * TRUE AI-DRIVEN: Following CLAUDE.md principles strictly
 * - NO patterns or variations
 * - NO complex conditionals  
 * - Just direct API calls with AI-composed parameters
 * - Accept that some searches will miss (and that's OK)
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { oncobot } from '@/ai/providers';
import { ClinicalTrial } from '../types';
import { debug, DebugCategory } from '../debug';
import type { QueryAnalysis } from './query-analyzer';

// Schema for AI to compose search parameters
const SearchStrategySchema = z.object({
  apiParameters: z.record(z.string(), z.string()).describe('ClinicalTrials.gov API parameters'),
  reasoning: z.string().describe('Why these parameters were chosen')
});

interface UnifiedSearchParams {
  query: string;
  analysis?: QueryAnalysis; // Optional AI analysis
  maxResults?: number;
  filters?: {
    status?: string[];
    phase?: string[];
  };
}

interface UnifiedSearchResult {
  success: boolean;
  trials: ClinicalTrial[];
  totalCount: number;
  metadata: {
    parametersUsed: Record<string, string>;
    reasoning: string;
    latency: number;
  };
}

export class UnifiedSearchTool {
  private static readonly API_BASE = 'https://clinicaltrials.gov/api/v2';
  
  /**
   * Search with AI-driven parameter composition
   * NO PATTERNS, NO FALLBACKS - Pure AI intelligence
   */
  async search(params: UnifiedSearchParams): Promise<UnifiedSearchResult> {
    const startTime = Date.now();
    const { query, analysis, maxResults = 50, filters } = params;
    
    debug.log(DebugCategory.SEARCH, 'Unified search', { query });
    
    // Step 1: Use AI to decide how to search (if analysis provided)
    let searchParams: Record<string, string>;
    let reasoning: string;
    
    if (analysis) {
      // Use AI to compose parameters based on analysis
      const strategy = await this.composeSearchStrategy(query, analysis);
      searchParams = strategy.apiParameters;
      reasoning = strategy.reasoning;
    } else {
      // Direct query without AI composition - simple term search
      searchParams = { 'query.term': query };
      reasoning = 'Direct search without analysis';
    }
    
    // Step 2: Execute the search - NO VARIATIONS, NO RETRIES
    try {
      const apiParams = new URLSearchParams({
        'format': 'json',
        'pageSize': maxResults.toString(),
        'countTotal': 'true'
      });
      
      // Add composed parameters
      for (const [key, value] of Object.entries(searchParams)) {
        // Handle both string values and potential object values from AI
        // Following TRUE AI-DRIVEN: Accept what AI provides, extract the value
        let paramValue = value;
        
        // If AI accidentally sends an object, extract the string value
        if (typeof value === 'object' && value !== null) {
          // Try to extract the actual value from the object
          paramValue = Object.values(value)[0] as string;
        }
        
        // Now safely handle string values
        if (paramValue && typeof paramValue === 'string' && paramValue.trim()) {
          apiParams.append(key, paramValue);
        }
      }
      
      // Add filters if provided
      if (filters?.status?.length) {
        apiParams.append('filter.overallStatus', filters.status.join(','));
      }
      if (filters?.phase?.length) {
        apiParams.append('filter.phase', filters.phase.join(','));
      }
      
      const url = `${UnifiedSearchTool.API_BASE}/studies?${apiParams}`;
      
      // Debug: Log the exact API call being made
      debug.log(DebugCategory.SEARCH, 'API URL', { url });
      debug.log(DebugCategory.SEARCH, 'API Parameters', {
        params: Object.fromEntries(apiParams.entries())
      });
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      debug.log(DebugCategory.SEARCH, 'Unified search complete', {
        count: data.studies?.length || 0,
        total: data.totalCount || 0
      });
      
      return {
        success: true,
        trials: data.studies || [],
        totalCount: data.totalCount || 0,
        metadata: {
          parametersUsed: searchParams,
          reasoning,
          latency: Date.now() - startTime
        }
      };
      
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'Search failed', error);
      
      // Simple, honest failure - no fallbacks
      return {
        success: false,
        trials: [],
        totalCount: 0,
        metadata: {
          parametersUsed: searchParams,
          reasoning: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          latency: Date.now() - startTime
        }
      };
    }
  }
  
  /**
   * AI composes search parameters - NO HARDCODED RULES
   */
  private async composeSearchStrategy(
    query: string,
    analysis: QueryAnalysis
  ): Promise<{ apiParameters: Record<string, string>; reasoning: string }> {
    try {
      const prompt = `Compose ClinicalTrials.gov API parameters for this search.

Query: "${query}"

Extracted entities from analysis:
- Conditions: ${analysis.entities.conditions.join(', ') || 'none'}
- Cities: ${analysis.entities.locations.cities.join(', ') || 'none'}
- States: ${analysis.entities.locations.states.join(', ') || 'none'}
- Mutations: ${analysis.entities.mutations.join(', ') || 'none'}
- Trial Names/Drugs: ${analysis.entities.drugs.join(', ') || 'none'}
- NCT IDs: ${analysis.entities.nctIds.join(', ') || 'none'}

Available API parameters:
- query.term: General text search
- query.cond: Condition/disease filter
- query.locn: Location filter (FORMAT: "City, State" or "State" for US locations)
- query.intr: Intervention/drug filter
- query.id: NCT ID search (ONLY if NCT ID is provided)
- query.titles: Title search
- query.spons: Sponsor filter

IMPORTANT: Each parameter value must be a simple STRING, not an object.

COMPOSITION RULES:
1. If trial names/drugs exist (like "TROPION-Lung12"):
   - Use query.term OR query.intr with just the trial name as a STRING
   - CORRECT: "query.term": "TROPION-Lung12"
   - WRONG: "query.term": { "term": "TROPION-Lung12" }
   
2. If multiple states exist (like ["Texas", "Louisiana"]):
   - Combine them: query.locn = "Texas OR Louisiana"
   - Or search each separately if the API doesn't support OR
   
3. NEVER send the entire user query as a single parameter
   - Break it down into specific API parameters
   - Example: "TROPION-Lung12 in Texas" becomes:
     - "query.term": "TROPION-Lung12"  (STRING value)
     - "query.locn": "Texas"  (STRING value)

4. RECRUITMENT STATUS WORDS should be EXCLUDED from search terms:
   - Words like "open", "recruiting", "not yet recruiting", "closed", "active" are recruitment statuses
   - These are handled separately through filters, NOT in query.term
   - Example: "TROPION-Lung12 with recruitment status open or not yet recruiting" becomes:
     - "query.term": "TROPION-Lung12"  (just the trial name, NO status words)
   - WRONG: "query.term": "TROPION-Lung12 open not yet recruiting"

5. Return a flat object where keys are parameter names and values are STRINGS
   - CORRECT: { "query.term": "TROPION-Lung12", "query.locn": "Texas" }
   - WRONG: { "query.term": { "term": "TROPION-Lung12" } }`;

      const result = await generateObject({
        model: oncobot.languageModel('oncobot-default'), // Use same model as main conversation
        schema: SearchStrategySchema,
        prompt,
        temperature: 0.0, // Deterministic
      });
      
      return result.object;
      
    } catch (error) {
      // AI failed - just search with the raw query
      debug.error(DebugCategory.ERROR, 'AI composition failed', error);
      return {
        apiParameters: { 'query.term': query },
        reasoning: 'AI unavailable - using direct search'
      };
    }
  }
}

// Export singleton instance
export const unifiedSearch = new UnifiedSearchTool();
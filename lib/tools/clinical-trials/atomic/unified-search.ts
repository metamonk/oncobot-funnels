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
      const prompt = `Compose ClinicalTrials.gov API parameters.

Query: "${query}"

Entities from analysis:
${JSON.stringify(analysis.entities, null, 2)}

API parameters:
- query.term: General text search (DO NOT put recruitment status here)
- query.cond: Condition/disease  
- query.locn: Location ("City, State" or "State")
- query.intr: Intervention/drug name
- query.id: NCT ID
- query.titles: Title search
- query.spons: Sponsor

IMPORTANT:
- For drug/trial names like "TROPION-Lung12", use query.intr NOT query.term
- NEVER put recruitment status words in any parameter (recruiting, open, closed are handled separately)
- If multiple locations, use format: "Texas, Louisiana"

Return a flat object with parameter names as keys and STRING values.
Example: { "query.intr": "TROPION-Lung12", "query.locn": "Texas, Louisiana" }

The API is literal - it may not match variations. That's OK.`;

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
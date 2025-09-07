/**
 * Result Composer Atomic Tool - CLEAN VERSION
 * 
 * TRUE AI-DRIVEN: Following CLAUDE.md principles strictly
 * - NO pattern matching or validation
 * - NO complex scoring algorithms
 * - Simple merging and presentation
 * - Trust AI's selection
 */

import { ClinicalTrial, HealthProfile } from '../types';
import { debug, DebugCategory } from '../debug';
import { conversationTrialStore } from '../services/conversation-trial-store';

// This matches the exact interface the UI expects
interface ClinicalTrialResult {
  success: boolean;
  totalCount?: number;
  matches?: Array<{
    trial: ClinicalTrial;
    matchScore: number;
    eligibilityAssessment: any;
    locationSummary?: string;
    recommendations?: string[];
  }>;
  searchCriteria?: any;
  query?: string;
  error?: string;
  message?: string;
  suggestion?: string;
  hasMore?: boolean;
}

export interface CompositionRequest {
  // Results from atomic tools
  searchResults: Array<{
    source: string;
    trials: ClinicalTrial[];
    weight: number;
  }>;
  
  // Query context
  query: string;
  queryAnalysis?: any;
  
  // User context
  healthProfile?: HealthProfile | null;
  userLocation?: { city?: string; state?: string };
  chatId?: string;
  
  // UI requirements
  maxResults?: number;
}

export class ResultComposerTool {
  /**
   * Compose results - TRUST AI's selection
   * NO validation, NO scoring patterns
   */
  async compose(request: CompositionRequest): Promise<ClinicalTrialResult> {
    const {
      searchResults,
      query,
      queryAnalysis,
      healthProfile,
      userLocation,
      chatId,
      maxResults = 10,
    } = request;
    
    debug.log(DebugCategory.TOOL, 'Simple composition', {
      sources: searchResults.map(r => r.source),
      totalTrials: searchResults.reduce((sum, r) => sum + r.trials.length, 0)
    });
    
    // Step 1: Simple deduplication
    const uniqueTrials = this.deduplicate(searchResults);
    
    // Step 2: Take requested amount (trust AI's ordering)
    const selectedTrials = uniqueTrials.slice(0, maxResults);
    
    // Step 3: Build matches for UI
    const matches = selectedTrials.map(trial => ({
      trial,
      matchScore: 0.8, // Fixed score - AI already selected relevant ones
      eligibilityAssessment: this.buildSimpleAssessment(trial, healthProfile),
      locationSummary: this.buildLocationSummary(trial, query),
      recommendations: []
    }));
    
    // Step 4: Store for conversation retrieval
    if (chatId && matches.length > 0) {
      this.storeInConversation(chatId, matches, query);
    }
    
    // Step 5: Return the full matches for UI
    // TRUE AI-DRIVEN: The UI needs the full trial data, not references
    // The AI tool wrapper can extract what it needs for the LLM
    
    return {
      success: true,
      totalCount: uniqueTrials.length,
      matches: matches,  // Full trial data for UI
      query,
      hasMore: uniqueTrials.length > maxResults,
      message: `Found ${uniqueTrials.length} trials`
    };
  }
  
  /**
   * Simple deduplication by NCT ID
   */
  private deduplicate(searchResults: CompositionRequest['searchResults']): ClinicalTrial[] {
    const seen = new Set<string>();
    const unique: ClinicalTrial[] = [];
    
    for (const result of searchResults) {
      for (const trial of result.trials) {
        const nctId = trial.protocolSection?.identificationModule?.nctId;
        if (nctId && !seen.has(nctId)) {
          seen.add(nctId);
          unique.push(trial);
        }
      }
    }
    
    return unique;
  }
  
  /**
   * Build simple assessment for UI
   */
  private buildSimpleAssessment(trial: ClinicalTrial, healthProfile?: HealthProfile | null): any {
    return {
      searchRelevance: {
        matchedTerms: [],
        relevanceScore: 0.8,
        searchStrategy: 'ai-driven',
        reasoning: 'AI selected as relevant'
      },
      trialCriteria: {
        parsed: false,
        inclusion: [],
        exclusion: [],
        demographics: {
          ageRange: undefined,
          sex: trial.protocolSection?.eligibilityModule?.sex
        },
        parseConfidence: 0,
        rawText: trial.protocolSection?.eligibilityModule?.eligibilityCriteria?.substring(0, 500)
      },
      userAssessment: healthProfile ? {
        hasProfile: true,
        eligibilityScore: 0.5,
        confidence: 'low',
        recommendation: 'review',
        missingData: [],
        matches: {
          inclusion: [],
          exclusion: []
        }
      } : undefined
    };
  }
  
  /**
   * Build location summary - TRUE AI-DRIVEN approach
   * NO patterns, NO hardcoded states, just present the data
   */
  private buildLocationSummary(trial: ClinicalTrial, query?: string): string {
    const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
    if (locations.length === 0) return 'No locations';
    
    // Group locations by state for US trials - pure data aggregation
    const locationsByState: Record<string, { recruiting: number; notYet: number; cities: Set<string> }> = {};
    
    locations.forEach((loc: any) => {
      if (loc.country === 'United States' && loc.state) {
        if (!locationsByState[loc.state]) {
          locationsByState[loc.state] = { recruiting: 0, notYet: 0, cities: new Set() };
        }
        
        if (loc.city) {
          locationsByState[loc.state].cities.add(loc.city);
        }
        
        const status = loc.status?.toUpperCase();
        if (status === 'RECRUITING') {
          locationsByState[loc.state].recruiting++;
        } else if (status === 'NOT_YET_RECRUITING') {
          locationsByState[loc.state].notYet++;
        }
      }
    });
    
    // Sort states by total site count - simple ordering, no patterns
    const sortedStates = Object.entries(locationsByState)
      .filter(([_, info]) => info.recruiting > 0 || info.notYet > 0)
      .sort(([stateA, infoA], [stateB, infoB]) => {
        const totalA = infoA.recruiting + infoA.notYet;
        const totalB = infoB.recruiting + infoB.notYet;
        return totalB - totalA;
      });
    
    // Build concise summary for token efficiency
    // Show top 5 states with most sites - AI can ask for more if needed
    const stateSummaries = sortedStates
      .slice(0, 5) // Balance between completeness and token usage
      .map(([state, info]) => {
        // Show first 3 cities as representative sample
        const cities = Array.from(info.cities).slice(0, 3).join(', ');
        const statusPart = [];
        if (info.recruiting > 0) statusPart.push(`${info.recruiting} recruiting`);
        if (info.notYet > 0) statusPart.push(`${info.notYet} not yet`);
        return `${state}: ${cities} (${statusPart.join(', ')})`;
      });
    
    if (stateSummaries.length === 0) {
      return `${locations.length} sites total`;
    }
    
    // Add total count if there are more states
    if (sortedStates.length > 5) {
      const totalSites = locations.filter((loc: any) => 
        loc.country === 'United States' && 
        (loc.status?.toUpperCase() === 'RECRUITING' || loc.status?.toUpperCase() === 'NOT_YET_RECRUITING')
      ).length;
      stateSummaries.push(`[${totalSites} total US sites across ${sortedStates.length} states]`);
    }
    
    return stateSummaries.join('; ');
  }
  
  /**
   * Store in conversation
   */
  private storeInConversation(chatId: string, matches: any[], query: string): void {
    try {
      conversationTrialStore.storeTrials(chatId, matches as any, query, false);
      debug.log(DebugCategory.CACHE, 'Stored', { chatId, count: matches.length });
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'Store failed', error);
    }
  }
  
  /**
   * Minimal reference for AI
   */
  private createReference(trial: ClinicalTrial): any {
    const nctId = trial.protocolSection?.identificationModule?.nctId;
    const briefTitle = trial.protocolSection?.identificationModule?.briefTitle;
    
    return {
      nctId,
      briefTitle,
      _reference: true
    };
  }
}

// Export singleton instance
export const resultComposer = new ResultComposerTool();
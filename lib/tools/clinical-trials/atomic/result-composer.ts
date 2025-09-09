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
    
    // Ensure searchResults is always an array
    const results = Array.isArray(searchResults) ? searchResults : [];
    
    debug.log(DebugCategory.TOOL, 'Simple composition', {
      sources: results.map(r => r.source),
      totalTrials: results.reduce((sum, r) => sum + (r.trials?.length || 0), 0)
    });
    
    // Step 1: Simple deduplication
    const uniqueTrials = this.deduplicate(results);
    
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
      // Handle undefined or missing trials gracefully
      if (!result.trials || !Array.isArray(result.trials)) continue;
      
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
   * Build location summary - EXTREMELY CONCISE
   * Show just 2-3 cities and total count
   */
  private buildLocationSummary(trial: ClinicalTrial, query?: string): string {
    const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
    if (locations.length === 0) return 'No locations';
    
    // Collect all unique cities from recruiting/not yet recruiting sites
    const cities: string[] = [];
    let totalCount = 0;
    
    locations.forEach((loc: any) => {
      const status = loc.status?.toUpperCase();
      if (status === 'RECRUITING' || status === 'NOT_YET_RECRUITING') {
        totalCount++;
        if (loc.city && !cities.includes(loc.city)) {
          cities.push(loc.city);
        }
      }
    });
    
    // If no recruiting sites, just return total count
    if (totalCount === 0) {
      return `${locations.length} locations`;
    }
    
    // Show first 2 cities and total count
    if (cities.length === 0) {
      return `${totalCount} locations`;
    } else if (cities.length === 1) {
      return cities[0];
    } else if (cities.length === 2) {
      return `${cities[0]} and ${cities[1]}`;
    } else {
      // Show first 2 cities and "X other locations"
      const remaining = totalCount - 2;
      return `${cities[0]}, ${cities[1]} and ${remaining} other locations`;
    }
  }
  
  /**
   * Store in conversation
   */
  private storeInConversation(chatId: string, matches: any[], query: string): void {
    try {
      debug.log(DebugCategory.CACHE, 'Storing trials in conversation', { 
        chatId, 
        count: matches.length,
        firstTrial: matches[0] ? {
          nctId: matches[0].trial?.protocolSection?.identificationModule?.nctId,
          briefTitle: matches[0].trial?.protocolSection?.identificationModule?.briefTitle
        } : null
      });
      conversationTrialStore.storeTrials(chatId, matches as any, query, true); // Mark as shown
      debug.log(DebugCategory.CACHE, 'Successfully stored trials', { chatId, count: matches.length });
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
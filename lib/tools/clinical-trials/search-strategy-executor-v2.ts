/**
 * Simplified Search Strategy Executor v2
 * 
 * Philosophy: Build smart queries based on what we know,
 * then let the API do its job. No overcomplicated filtering.
 */

import { SearchExecutor } from './search-executor';
import { ClinicalTrial, HealthProfile, TrialMatch } from './types';
import { EligibilityAnalyzer } from './eligibility-analyzer';
import { debug, DebugCategory } from './debug';

export class SimpleSearchStrategyExecutor {
  private searchExecutor = new SearchExecutor();
  private eligibilityAnalyzer = new EligibilityAnalyzer();
  
  /**
   * Execute a search based on user query and profile
   * Simple approach: Build the best query we can, then search
   */
  async executeSearch(
    query: string,
    profile: HealthProfile | null,
    options: {
      limit?: number;
      location?: { latitude: number; longitude: number };
    } = {}
  ): Promise<{
    matches: TrialMatch[];
    totalCount: number;
    success: boolean;
  }> {
    // Step 1: Build an intelligent query
    const searchQuery = this.buildSearchQuery(query, profile);
    
    debug.log(DebugCategory.SEARCH, 'Executing search', {
      originalQuery: query,
      enhancedQuery: searchQuery,
      hasProfile: !!profile
    });
    
    // Step 2: Search the API
    const result = await this.searchExecutor.executeSearch(searchQuery, {
      pageSize: options.limit || 50
    });
    
    if (result.error) {
      return {
        matches: [],
        totalCount: 0,
        success: false
      };
    }
    
    // Step 3: Score and rank trials based on profile
    let matches: TrialMatch[] = result.studies.map(trial => ({
      trial,
      matchScore: 0.5 // Default score
    }));
    
    if (profile) {
      // Assess eligibility and score trials
      matches = await this.scoreTrials(matches, profile);
      
      // Sort by score (best matches first)
      matches.sort((a, b) => b.matchScore - a.matchScore);
    }
    
    // Step 4: Apply location filtering if provided
    if (options.location) {
      matches = this.filterByLocation(matches, options.location);
    }
    
    // Step 5: Limit results if requested
    if (options.limit) {
      matches = matches.slice(0, options.limit);
    }
    
    return {
      matches,
      totalCount: result.totalCount,
      success: true
    };
  }
  
  /**
   * Build an intelligent search query
   * Combines user query with profile information
   */
  private buildSearchQuery(query: string, profile: HealthProfile | null): string {
    const parts: string[] = [];
    
    // Simple approach: just remove obvious location phrases
    // Keep the medical terms intact
    const cleanQuery = query
      .replace(/\b(in|near|at|around)\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?/g, '') // Remove "in Chicago", etc.
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    // If we have a profile with cancer type, always include it
    if (profile?.cancerType) {
      // For mutation queries, ensure we include the cancer type
      const queryLower = cleanQuery.toLowerCase();
      const isMutationQuery = /kras|egfr|alk|ros1|braf|g12c/i.test(cleanQuery);
      
      if (isMutationQuery && !queryLower.includes(profile.cancerType.toLowerCase())) {
        // Add cancer type to mutation queries
        parts.push(profile.cancerType);
      }
    }
    
    // Add the cleaned query
    parts.push(cleanQuery);
    
    // If profile has positive molecular markers not in query, add them
    if (profile?.molecularMarkers) {
      for (const [marker, status] of Object.entries(profile.molecularMarkers)) {
        if (status === 'POSITIVE') {
          const markerName = marker.replace(/_/g, ' ');
          if (!cleanQuery.toLowerCase().includes(markerName.toLowerCase())) {
            parts.push(markerName);
          }
        }
      }
    }
    
    // Remove duplicates and join
    const uniqueParts = [...new Set(parts)];
    return uniqueParts.join(' ').trim();
  }
  
  /**
   * Score trials based on profile match
   */
  private async scoreTrials(
    matches: TrialMatch[],
    profile: HealthProfile
  ): Promise<TrialMatch[]> {
    return Promise.all(matches.map(async match => {
      try {
        // Use eligibility analyzer for detailed assessment
        const assessment = await this.eligibilityAnalyzer.assessTrial(
          match.trial,
          profile
        );
        
        // Calculate match score based on assessment
        let score = 0.5; // Base score
        
        // Boost for cancer type match
        const conditions = match.trial.protocolSection?.conditionsModule?.conditions || [];
        if (profile.cancerType && conditions.some(c => 
          c.toLowerCase().includes(profile.cancerType.toLowerCase())
        )) {
          score += 0.2;
        }
        
        // Boost for molecular marker match
        if (profile.molecularMarkers) {
          const eligibilityCriteria = match.trial.protocolSection?.eligibilityModule?.eligibilityCriteria || '';
          for (const [marker, status] of Object.entries(profile.molecularMarkers)) {
            if (status === 'POSITIVE') {
              const markerName = marker.replace(/_/g, ' ');
              if (eligibilityCriteria.toLowerCase().includes(markerName.toLowerCase())) {
                score += 0.2;
              }
            }
          }
        }
        
        // Boost for recruiting status
        const status = match.trial.protocolSection?.statusModule?.overallStatus;
        if (status === 'RECRUITING') {
          score += 0.1;
        }
        
        return {
          ...match,
          matchScore: Math.min(score, 1.0),
          eligibilityAssessment: assessment
        };
      } catch (error) {
        // If assessment fails, return with default score
        return match;
      }
    }));
  }
  
  /**
   * Filter trials by location (simple distance check)
   */
  private filterByLocation(
    matches: TrialMatch[],
    userLocation: { latitude: number; longitude: number }
  ): TrialMatch[] {
    // For now, just return all matches
    // In a real implementation, we'd calculate distances
    return matches;
  }
}

// Export a singleton instance
export const simpleSearchStrategy = new SimpleSearchStrategyExecutor();
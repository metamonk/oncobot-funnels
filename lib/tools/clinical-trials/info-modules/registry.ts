/**
 * Info Module Registry
 * 
 * Central registry for managing and matching info modules
 */

import type { InfoModule, MatchResult, InfoContext } from './types';

export class InfoModuleRegistry {
  private modules: Map<string, InfoModule> = new Map();
  private modulesByPriority: InfoModule[] = [];

  /**
   * Register a new info module
   */
  register(module: InfoModule): void {
    const id = module.metadata.id;
    
    if (this.modules.has(id)) {
      // Module already registered, will be overwritten
    }
    
    this.modules.set(id, module);
    this.rebuildPriorityList();
  }

  /**
   * Unregister a module
   */
  unregister(moduleId: string): boolean {
    const result = this.modules.delete(moduleId);
    if (result) {
      this.rebuildPriorityList();
    }
    return result;
  }

  /**
   * Get a specific module by ID
   */
  getModule(moduleId: string): InfoModule | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Get all registered modules
   */
  getAllModules(): InfoModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Find matching modules for a query
   */
  findMatches(query: string, context: InfoContext): MatchResult[] {
    const matches: MatchResult[] = [];
    const preprocessedQuery = query.trim().toLowerCase();

    for (const infoModule of this.modulesByPriority) {
      // Check if module can handle this query
      if (infoModule.canHandle && infoModule.canHandle(query, context)) {
        matches.push({
          module: infoModule,
          confidence: 0.9, // High confidence for explicit canHandle
          matchType: 'pattern'
        });
        continue;
      }

      // Check patterns
      const patternMatch = this.checkPatterns(query, infoModule);
      if (patternMatch) {
        matches.push({
          module: infoModule,
          confidence: patternMatch.confidence,
          matchType: 'pattern',
          matchedPattern: patternMatch.pattern
        });
        continue;
      }

      // Check keywords
      const keywordMatch = this.checkKeywords(preprocessedQuery, infoModule);
      if (keywordMatch) {
        matches.push({
          module: infoModule,
          confidence: keywordMatch.confidence,
          matchType: 'keyword',
          matchedKeywords: keywordMatch.keywords
        });
      }
    }

    // Sort by confidence and priority
    return matches.sort((a, b) => {
      if (Math.abs(a.confidence - b.confidence) > 0.1) {
        return b.confidence - a.confidence;
      }
      return b.module.metadata.priority - a.module.metadata.priority;
    });
  }

  /**
   * Get the best matching module for a query
   */
  getBestMatch(query: string, context: InfoContext): InfoModule | null {
    const matches = this.findMatches(query, context);
    return matches.length > 0 ? matches[0].module : null;
  }

  /**
   * Check if any module can handle a query
   */
  canHandle(query: string, context: InfoContext): boolean {
    return this.findMatches(query, context).length > 0;
  }

  private checkPatterns(
    query: string, 
    module: InfoModule
  ): { pattern: RegExp; confidence: number } | null {
    for (const pattern of module.patterns) {
      if (pattern.test(query)) {
        // Calculate confidence based on match quality
        const match = query.match(pattern);
        if (match) {
          // Higher confidence for longer matches relative to query length
          const matchLength = match[0].length;
          const queryLength = query.length;
          const coverage = matchLength / queryLength;
          const confidence = Math.min(0.5 + (coverage * 0.5), 0.95);
          
          return { pattern, confidence };
        }
      }
    }
    return null;
  }

  private checkKeywords(
    queryLower: string, 
    module: InfoModule
  ): { keywords: string[]; confidence: number } | null {
    if (!module.keywords || module.keywords.length === 0) {
      return null;
    }

    const matchedKeywords: string[] = [];
    let totalScore = 0;

    for (const keyword of module.keywords) {
      const keywordLower = keyword.toLowerCase();
      if (queryLower.includes(keywordLower)) {
        matchedKeywords.push(keyword);
        // Longer keywords get higher scores
        totalScore += keywordLower.length;
      }
    }

    if (matchedKeywords.length === 0) {
      return null;
    }

    // Calculate confidence based on keyword coverage
    const queryWords = queryLower.split(/\s+/);
    const keywordCoverage = matchedKeywords.length / module.keywords.length;
    const queryCoverage = totalScore / queryLower.length;
    
    // Weighted average of coverages
    const confidence = Math.min(
      (keywordCoverage * 0.3) + (queryCoverage * 0.4) + 0.3,
      0.8 // Cap keyword matches at 0.8 confidence
    );

    return { keywords: matchedKeywords, confidence };
  }

  private rebuildPriorityList(): void {
    this.modulesByPriority = Array.from(this.modules.values())
      .sort((a, b) => b.metadata.priority - a.metadata.priority);
  }
}

// Singleton instance
export const moduleRegistry = new InfoModuleRegistry();
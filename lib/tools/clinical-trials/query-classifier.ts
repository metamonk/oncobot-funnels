/**
 * Query Classifier for Clinical Trials
 * 
 * Intent-based classification system that determines optimal search strategies
 * while leveraging existing cache, compression, and UI infrastructure
 */

import type { HealthProfile } from './types';
import { LocationService } from './location-service';

/**
 * Query intent categories based on user's primary focus
 */
export enum QueryIntent {
  LOCATION_PRIMARY = 'location_primary',     // "trials in Chicago"
  CONDITION_PRIMARY = 'condition_primary',   // "lung cancer trials"  
  BALANCED = 'balanced',                     // "lung cancer trials in Chicago"
  PROXIMITY = 'proximity',                   // "trials within 50 miles"
  NCT_LOOKUP = 'nct_lookup',                // "NCT05568550"
  ELIGIBILITY = 'eligibility',              // "trials I'm eligible for"
  CONTINUATION = 'continuation',            // "show more" or "filter by..."
  GENERAL = 'general'                       // "what trials are available"
}

/**
 * Search strategy based on intent and available data
 */
export enum SearchStrategy {
  LOCATION_THEN_CONDITION = 'location_then_condition',
  CONDITION_THEN_LOCATION = 'condition_then_location',
  PARALLEL_MERGE = 'parallel_merge',
  PROXIMITY_RANKING = 'proximity_ranking',
  NCT_DIRECT = 'nct_direct',
  PROFILE_BASED = 'profile_based',
  CACHED_FILTER = 'cached_filter',
  BROAD_SEARCH = 'broad_search'
}

/**
 * Classified query with all extracted components
 */
export interface ClassifiedQuery {
  intent: QueryIntent;
  strategy: SearchStrategy;
  components: {
    condition?: string;
    location?: string;
    radius?: number;
    nctId?: string;
    mutations?: string[];
    stage?: string;
    phase?: string;
  };
  weights: {
    location: number;  // 0-1 importance of location
    condition: number; // 0-1 importance of condition
  };
  confidence: number;
  reasoning: string;
}

/**
 * Context for classification
 */
export interface ClassificationContext {
  healthProfile?: HealthProfile | null;
  userCoordinates?: { latitude?: number; longitude?: number };
  hasCachedResults?: boolean;
  previousQuery?: string;
}

export class QueryClassifier {
  private locationService = LocationService.getInstance();

  /**
   * Intent indicators with weights
   */
  private readonly INTENT_PATTERNS = {
    location_primary: [
      { pattern: /^(trials?|studies)\s+(in|near|at|around)\s+/i, weight: 0.9 },
      { pattern: /^(what|which|find|show).*(in|near)\s+[\w\s,]+$/i, weight: 0.8 },
      { pattern: /(nearest|closest|nearby)/i, weight: 0.9 },
      { pattern: /^(in|near|around)\s+[\w\s,]+/i, weight: 0.85 },
      { pattern: /near\s+me/i, weight: 0.95 }
    ],
    condition_primary: [
      { pattern: /^(lung|breast|colon|pancreatic|prostate)\s+cancer/i, weight: 0.9 },
      { pattern: /^(KRAS|EGFR|ALK|BRAF|HER2|BRCA)/i, weight: 0.95 },
      { pattern: /for\s+(lung|breast|colon)\s+cancer/i, weight: 0.85 },
      { pattern: /stage\s+(I{1,3}V?|[1-4])/i, weight: 0.8 },
      { pattern: /^(cancer|carcinoma|melanoma|lymphoma)/i, weight: 0.8 }
    ],
    proximity: [
      { pattern: /within\s+\d+\s+(miles?|kilometers?|km)/i, weight: 1.0 },
      { pattern: /\d+\s+(miles?|km)\s+(from|of|around)/i, weight: 0.95 },
      { pattern: /(driving|travel)\s+(distance|time)/i, weight: 0.8 }
    ],
    eligibility: [
      { pattern: /\b(eligible|qualify|can\s+I\s+join)/i, weight: 0.9 },
      { pattern: /for\s+me\b/i, weight: 0.7 },
      { pattern: /\bmy\s+(cancer|condition|diagnosis)/i, weight: 0.8 },
      { pattern: /based\s+on\s+my\s+profile/i, weight: 0.95 }
    ],
    continuation: [
      { pattern: /^(show|list|get)\s+(more|next|additional)/i, weight: 0.95 },
      { pattern: /^(filter|narrow|refine)/i, weight: 0.9 },
      { pattern: /^(which|what)\s+of\s+(these|those)/i, weight: 0.85 },
      { pattern: /^(only|just)\s+the\s+ones/i, weight: 0.8 }
    ]
  };

  /**
   * Component extraction patterns
   */
  private readonly COMPONENT_PATTERNS = {
    nctId: /\bNCT\d{8}\b/gi,
    mutations: /\b(KRAS|EGFR|ALK|ROS1|BRAF|MET|RET|NTRK|HER2|PIK3CA|FGFR|IDH[12]|BRCA[12]|MSI-H|TMB-H|PD-?L1)\b/gi,
    stage: /\bstage\s*(I{1,3}V?|[1-4][ABC]?|IV)\b/gi,
    phase: /\bphase\s*([1-4]|I{1,3}V?)\b/gi,
    radius: /(\d+)\s*(miles?|kilometers?|km)/i
  };

  /**
   * Main classification method
   */
  classify(query: string, context: ClassificationContext = {}): ClassifiedQuery {
    const normalizedQuery = query.toLowerCase().trim();
    
    // 1. Check for NCT ID first (highest priority)
    const nctMatch = query.match(this.COMPONENT_PATTERNS.nctId);
    if (nctMatch) {
      return this.buildNCTLookupQuery(query, nctMatch[0]);
    }

    // 2. Check if this is a continuation query
    if (context.hasCachedResults && this.isContinuationQuery(normalizedQuery)) {
      return this.buildContinuationQuery(query, context);
    }

    // 3. Calculate intent scores
    const intentScores = this.calculateIntentScores(normalizedQuery);
    
    // 4. Extract query components
    const components = this.extractComponents(query);
    
    // 5. Calculate location and condition weights
    const weights = this.calculateWeights(query, components, context);
    
    // 6. Determine primary intent
    const intent = this.determineIntent(intentScores, weights, components);
    
    // 7. Select optimal search strategy
    const strategy = this.selectStrategy(intent, components, context);
    
    // 8. Build the classified query
    return {
      intent,
      strategy,
      components,
      weights,
      confidence: this.calculateConfidence(intentScores, intent),
      reasoning: this.generateReasoning(intent, strategy, components)
    };
  }

  /**
   * Calculate intent scores based on pattern matching
   */
  private calculateIntentScores(query: string): Map<QueryIntent, number> {
    const scores = new Map<QueryIntent, number>();
    
    // Initialize all intents with base score
    Object.values(QueryIntent).forEach(intent => {
      scores.set(intent as QueryIntent, 0);
    });

    // Calculate scores for each intent
    for (const [intentKey, patterns] of Object.entries(this.INTENT_PATTERNS)) {
      let totalScore = 0;
      let matchCount = 0;
      
      for (const { pattern, weight } of patterns) {
        if (pattern.test(query)) {
          totalScore += weight;
          matchCount++;
        }
      }
      
      // Normalize score
      const normalizedScore = matchCount > 0 ? totalScore / matchCount : 0;
      const intent = this.mapPatternKeyToIntent(intentKey);
      scores.set(intent, normalizedScore);
    }

    // Check for general queries
    if (this.isGeneralQuery(query)) {
      scores.set(QueryIntent.GENERAL, 0.8);
    }

    return scores;
  }

  /**
   * Extract components from query
   */
  private extractComponents(query: string): ClassifiedQuery['components'] {
    const components: ClassifiedQuery['components'] = {};

    // Extract NCT ID
    const nctMatch = query.match(this.COMPONENT_PATTERNS.nctId);
    if (nctMatch) {
      components.nctId = nctMatch[0].toUpperCase();
    }

    // Extract mutations
    const mutationMatches = query.match(this.COMPONENT_PATTERNS.mutations);
    if (mutationMatches) {
      components.mutations = [...new Set(mutationMatches.map(m => m.toUpperCase()))];
    }

    // Extract stage
    const stageMatch = query.match(this.COMPONENT_PATTERNS.stage);
    if (stageMatch) {
      components.stage = stageMatch[0];
    }

    // Extract phase
    const phaseMatch = query.match(this.COMPONENT_PATTERNS.phase);
    if (phaseMatch) {
      components.phase = phaseMatch[0];
    }

    // Extract radius
    const radiusMatch = query.match(this.COMPONENT_PATTERNS.radius);
    if (radiusMatch) {
      components.radius = parseInt(radiusMatch[1]);
    }

    // Extract location (more complex)
    components.location = this.extractLocation(query);

    // Extract condition (complex medical terms)
    components.condition = this.extractCondition(query);

    return components;
  }

  /**
   * Extract location from query
   */
  private extractLocation(query: string): string | undefined {
    // Use LocationService's existing extraction logic
    const location = this.locationService.extractLocationFromQuery(query);
    if (location) return location;

    // Additional patterns for locations
    const patterns = [
      /(?:in|near|at|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+([A-Z]{2})\b/,  // City, STATE
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Extract medical condition from query
   */
  private extractCondition(query: string): string | undefined {
    // Common cancer types
    const cancerMatch = query.match(
      /\b(lung|breast|colon|colorectal|pancreatic|prostate|ovarian|bladder|kidney|liver)\s*(cancer|carcinoma)?/i
    );
    if (cancerMatch) {
      return cancerMatch[0];
    }

    // Abbreviated cancer types
    const abbrevMatch = query.match(/\b(NSCLC|SCLC|CRC|HCC|RCC|AML|CLL|ALL|CML|DLBCL|TNBC)\b/i);
    if (abbrevMatch) {
      return abbrevMatch[0];
    }

    return undefined;
  }

  /**
   * Calculate weights for location vs condition
   */
  private calculateWeights(
    query: string, 
    components: ClassifiedQuery['components'],
    context: ClassificationContext
  ): ClassifiedQuery['weights'] {
    let locationWeight = 0;
    let conditionWeight = 0;

    // Base weights from components
    if (components.location) locationWeight += 0.4;
    if (components.condition) conditionWeight += 0.4;
    if (components.mutations) conditionWeight += 0.3;
    if (components.stage) conditionWeight += 0.2;
    if (components.radius) locationWeight += 0.5;

    // Adjust based on query structure
    if (/^(in|near|at)\s+/i.test(query)) locationWeight += 0.3;
    if (/near\s+me/i.test(query)) locationWeight += 0.4;
    if (/^(lung|breast|cancer)/i.test(query)) conditionWeight += 0.3;

    // Consider context
    if (context.userCoordinates) locationWeight += 0.1;
    if (context.healthProfile?.cancerType) conditionWeight += 0.1;

    // Normalize weights
    const total = locationWeight + conditionWeight;
    if (total > 0) {
      locationWeight = locationWeight / total;
      conditionWeight = conditionWeight / total;
    } else {
      // Default to balanced if no clear signals
      locationWeight = 0.5;
      conditionWeight = 0.5;
    }

    return { location: locationWeight, condition: conditionWeight };
  }

  /**
   * Determine primary intent based on scores and weights
   */
  private determineIntent(
    scores: Map<QueryIntent, number>,
    weights: ClassifiedQuery['weights'],
    components: ClassifiedQuery['components']
  ): QueryIntent {
    // Check for special cases first
    if (components.nctId) return QueryIntent.NCT_LOOKUP;
    if (components.radius) return QueryIntent.PROXIMITY;

    // Find highest scoring intent
    let maxScore = 0;
    let primaryIntent = QueryIntent.GENERAL;

    for (const [intent, score] of scores) {
      if (score > maxScore) {
        maxScore = score;
        primaryIntent = intent;
      }
    }

    // Override based on weights if no clear intent
    if (maxScore < 0.5) {
      if (weights.location > 0.7) return QueryIntent.LOCATION_PRIMARY;
      if (weights.condition > 0.7) return QueryIntent.CONDITION_PRIMARY;
      if (weights.location > 0.3 && weights.condition > 0.3) return QueryIntent.BALANCED;
    }

    return primaryIntent;
  }

  /**
   * Select optimal search strategy based on intent and context
   */
  private selectStrategy(
    intent: QueryIntent,
    components: ClassifiedQuery['components'],
    context: ClassificationContext
  ): SearchStrategy {
    switch (intent) {
      case QueryIntent.NCT_LOOKUP:
        return SearchStrategy.NCT_DIRECT;

      case QueryIntent.CONTINUATION:
        return SearchStrategy.CACHED_FILTER;

      case QueryIntent.LOCATION_PRIMARY:
        // If we have a specific location, search by location field
        if (components.location && components.location !== 'near me') {
          return SearchStrategy.LOCATION_THEN_CONDITION;
        }
        // Otherwise, broad search with location filtering
        return SearchStrategy.PROXIMITY_RANKING;

      case QueryIntent.CONDITION_PRIMARY:
        return SearchStrategy.CONDITION_THEN_LOCATION;

      case QueryIntent.BALANCED:
        // Both are important - use parallel search
        return SearchStrategy.PARALLEL_MERGE;

      case QueryIntent.PROXIMITY:
        return SearchStrategy.PROXIMITY_RANKING;

      case QueryIntent.ELIGIBILITY:
        return SearchStrategy.PROFILE_BASED;

      case QueryIntent.GENERAL:
        // Use profile if available, otherwise broad search
        return context.healthProfile 
          ? SearchStrategy.PROFILE_BASED 
          : SearchStrategy.BROAD_SEARCH;

      default:
        return SearchStrategy.BROAD_SEARCH;
    }
  }

  /**
   * Helper methods
   */
  private isContinuationQuery(query: string): boolean {
    const continuationPatterns = [
      /^(show|list|get)\s+(more|next|additional)/i,
      /^(filter|narrow|refine)/i,
      /^(which|what)\s+of\s+(these|those)/i
    ];
    
    return continuationPatterns.some(p => p.test(query));
  }

  private isGeneralQuery(query: string): boolean {
    const generalPatterns = [
      /^what\s+trials?\s+are\s+available/i,
      /^are\s+there\s+any\s+trials/i,
      /^clinical\s+trials?\??$/i
    ];
    
    return generalPatterns.some(p => p.test(query));
  }

  private mapPatternKeyToIntent(key: string): QueryIntent {
    const mapping: Record<string, QueryIntent> = {
      'location_primary': QueryIntent.LOCATION_PRIMARY,
      'condition_primary': QueryIntent.CONDITION_PRIMARY,
      'proximity': QueryIntent.PROXIMITY,
      'eligibility': QueryIntent.ELIGIBILITY,
      'continuation': QueryIntent.CONTINUATION
    };
    
    return mapping[key] || QueryIntent.GENERAL;
  }

  private calculateConfidence(scores: Map<QueryIntent, number>, intent: QueryIntent): number {
    const intentScore = scores.get(intent) || 0;
    const otherScores = Array.from(scores.values()).filter((_, i) => i !== Array.from(scores.keys()).indexOf(intent));
    const maxOtherScore = Math.max(...otherScores, 0);
    
    // Confidence is high if intent score is high and clearly better than others
    const clarity = intentScore - maxOtherScore;
    const confidence = (intentScore * 0.7 + clarity * 0.3);
    
    return Math.min(Math.max(confidence, 0), 1);
  }

  private generateReasoning(
    intent: QueryIntent, 
    strategy: SearchStrategy,
    components: ClassifiedQuery['components']
  ): string {
    const parts: string[] = [];
    
    parts.push(`Intent: ${intent}`);
    parts.push(`Strategy: ${strategy}`);
    
    if (components.location) {
      parts.push(`Location: ${components.location}`);
    }
    if (components.condition) {
      parts.push(`Condition: ${components.condition}`);
    }
    if (components.radius) {
      parts.push(`Radius: ${components.radius} miles`);
    }
    
    return parts.join(', ');
  }

  /**
   * Build specialized query objects
   */
  private buildNCTLookupQuery(query: string, nctId: string): ClassifiedQuery {
    return {
      intent: QueryIntent.NCT_LOOKUP,
      strategy: SearchStrategy.NCT_DIRECT,
      components: { nctId },
      weights: { location: 0, condition: 0 },
      confidence: 1.0,
      reasoning: `Direct NCT lookup for ${nctId}`
    };
  }

  private buildContinuationQuery(query: string, context: ClassificationContext): ClassifiedQuery {
    const components = this.extractComponents(query);
    
    return {
      intent: QueryIntent.CONTINUATION,
      strategy: SearchStrategy.CACHED_FILTER,
      components,
      weights: this.calculateWeights(query, components, context),
      confidence: 0.9,
      reasoning: 'Continuation of previous search with additional filters'
    };
  }
}
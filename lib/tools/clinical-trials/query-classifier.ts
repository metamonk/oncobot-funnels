/**
 * Query Classifier for Clinical Trials
 * 
 * Intent-based classification system that determines optimal search strategies
 * while leveraging existing cache, compression, and UI infrastructure
 * 
 * ENHANCED: Now builds comprehensive QueryContext that preserves all information
 * throughout the entire search pipeline.
 */

import type { HealthProfile } from './types';
import { LocationService } from './location-service';
import { 
  QueryContext, 
  QueryContextBuilder, 
  ExtractedEntities, 
  InferredIntent,
  ExecutionPlan,
  UserLocation 
} from './query-context';

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
    nctIds?: string[];  // Support multiple NCT IDs for batch lookups
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
   * Build comprehensive QueryContext for the entire pipeline
   * This is the new primary entry point that preserves ALL information
   */
  buildQueryContext(
    query: string, 
    context: ClassificationContext = {}
  ): QueryContext {
    const builder = new QueryContextBuilder(query);
    
    // 1. Extract all entities from the query
    const entities = this.extractAllEntities(query);
    builder.withExtractedEntities(entities);
    
    // 2. Add user context
    if (context.userCoordinates) {
      const userLocation: UserLocation = {
        coordinates: {
          latitude: context.userCoordinates.latitude!,
          longitude: context.userCoordinates.longitude!
        },
        explicitlyRequested: /\bnear\s+me\b/i.test(query)
      };
      builder.withUserLocation(userLocation);
    }
    
    if (context.healthProfile) {
      builder.withHealthProfile(context.healthProfile);
    }
    
    // 3. Perform classification (existing logic)
    const classified = this.classify(query, context);
    
    // 4. Infer intent with more detail
    const inferredIntent: InferredIntent = {
      primaryGoal: this.mapIntentToGoal(classified.intent),
      specificity: this.determineSpecificity(classified, entities),
      urgency: this.inferUrgency(query),
      knowledgeLevel: this.inferKnowledgeLevel(query),
      confidence: classified.confidence
    };
    builder.withInferredIntent(inferredIntent);
    
    // 5. Build execution plan
    const executionPlan: ExecutionPlan = {
      primaryStrategy: this.mapStrategyToExecution(classified.strategy),
      fallbackStrategies: this.determineFallbacks(classified.strategy),
      searchParams: {
        baseQuery: query,
        enrichedQuery: this.buildEnrichedQuery(query, entities, context.healthProfile),
        filters: this.buildFilters(classified.components),
        maxResults: 50
      },
      validations: {
        checkEligibility: classified.intent === QueryIntent.ELIGIBILITY,
        verifyLocations: !!classified.components.location,
        confirmRecruitmentStatus: true,
        validateMolecularMatch: !!entities.mutations.length
      }
    };
    builder.withExecutionPlan(executionPlan);
    
    // 6. Track decision making
    builder.addDecision(
      'QueryClassifier',
      `Classified as ${classified.intent} with ${classified.strategy} strategy`,
      classified.confidence,
      classified.reasoning
    );
    
    // 7. Mark enrichments that will be applied
    if (context.healthProfile) {
      builder.markEnrichment('profileEnriched');
    }
    if (context.userCoordinates || classified.components.location) {
      builder.markEnrichment('locationEnriched');
    }
    if (entities.mutations.length > 0) {
      builder.markEnrichment('mutationEnriched');
    }
    
    // 8. Determine profile influence level
    // Import ProfileInfluence directly (it's a constant enum)
    const ProfileInfluence = {
      PRIMARY: 1.0,
      ENHANCED: 0.7,
      CONTEXTUAL: 0.5,
      BACKGROUND: 0.3,
      DISABLED: 0.0
    };
    
    if (this.detectProfileDisable(query)) {
      builder.withProfileInfluence({
        level: ProfileInfluence.DISABLED,
        reason: 'User indicated non-personal search',
        disableProfile: true
      });
    } else if (classified.intent === QueryIntent.ELIGIBILITY) {
      builder.withProfileInfluence({
        level: ProfileInfluence.PRIMARY,
        reason: 'Eligibility query - full profile pipeline'
      });
    } else if (classified.intent === QueryIntent.CONDITION_PRIMARY) {
      builder.withProfileInfluence({
        level: ProfileInfluence.ENHANCED,
        reason: 'Condition search - enhanced with profile'
      });
    } else if (classified.intent === QueryIntent.LOCATION_PRIMARY || classified.intent === QueryIntent.PROXIMITY) {
      builder.withProfileInfluence({
        level: ProfileInfluence.CONTEXTUAL,
        reason: 'Location search - contextual profile indicators'
      });
    } else {
      builder.withProfileInfluence({
        level: ProfileInfluence.BACKGROUND,
        reason: 'Broad search - background profile hints'
      });
    }
    
    return builder.build();
  }

  /**
   * Extract ALL entities from the query for comprehensive context
   */
  private extractAllEntities(query: string): ExtractedEntities {
    const entities: ExtractedEntities = {
      locations: [],
      conditions: [],
      cancerTypes: [],
      mutations: [],
      biomarkers: [],
      nctIds: [],
      drugs: [],
      treatments: [],
      stages: [],
      otherMedicalTerms: []
    };
    
    // Extract NCT IDs
    const nctMatches = query.match(this.COMPONENT_PATTERNS.nctId);
    if (nctMatches) {
      entities.nctIds = nctMatches.map(id => id.toUpperCase());
    }
    
    // Extract mutations and biomarkers
    const mutationMatches = query.match(this.COMPONENT_PATTERNS.mutations);
    if (mutationMatches) {
      const mutations = [...new Set(mutationMatches.map(m => m.toUpperCase()))];
      // Separate known biomarkers from general mutations
      const biomarkerPatterns = ['PD-L1', 'HER2', 'ER', 'PR', 'MSI', 'TMB', 'BRCA'];
      mutations.forEach(m => {
        if (biomarkerPatterns.some(b => m.includes(b))) {
          entities.biomarkers.push(m);
        } else {
          entities.mutations.push(m);
        }
      });
    }
    
    // Extract stages
    const stageMatch = query.match(this.COMPONENT_PATTERNS.stage);
    if (stageMatch) {
      entities.stages.push(stageMatch[0]);
    }
    
    // Extract locations
    const location = this.extractLocation(query);
    if (location) {
      entities.locations.push(location);
    }
    
    // Extract conditions and cancer types
    const condition = this.extractCondition(query);
    if (condition) {
      if (condition.toLowerCase().includes('cancer') || 
          condition.toLowerCase().includes('carcinoma')) {
        entities.cancerTypes.push(condition);
      } else {
        entities.conditions.push(condition);
      }
    }
    
    // Extract drug names (common patterns)
    const drugPatterns = [
      /\b(pembrolizumab|nivolumab|atezolizumab|durvalumab|avelumab)\b/gi,
      /\b(keytruda|opdivo|tecentriq|imfinzi|bavencio)\b/gi,
      /\b(sotorasib|adagrasib|lorlatinib|osimertinib|afatinib)\b/gi
    ];
    drugPatterns.forEach(pattern => {
      const matches = query.match(pattern);
      if (matches) {
        entities.drugs.push(...matches);
      }
    });
    
    // Extract treatment types
    const treatmentPatterns = [
      /\b(chemotherapy|immunotherapy|radiation|surgery|targeted therapy)\b/gi,
      /\b(chemo|immuno|radio|surgical)\b/gi
    ];
    treatmentPatterns.forEach(pattern => {
      const matches = query.match(pattern);
      if (matches) {
        entities.treatments.push(...matches);
      }
    });
    
    return entities;
  }

  /**
   * Helper methods for building QueryContext
   */
  private mapIntentToGoal(intent: QueryIntent): InferredIntent['primaryGoal'] {
    switch (intent) {
      case QueryIntent.NCT_LOOKUP:
        return 'specific_trial';
      case QueryIntent.ELIGIBILITY:
        return 'check_eligibility';
      case QueryIntent.GENERAL:
        return 'explore_options';
      default:
        return 'find_trials';
    }
  }
  
  private determineSpecificity(
    classified: ClassifiedQuery, 
    entities: ExtractedEntities
  ): InferredIntent['specificity'] {
    const entityCount = 
      entities.nctIds.length +
      entities.mutations.length +
      entities.biomarkers.length +
      entities.stages.length;
    
    if (entities.nctIds.length > 0) return 'very_specific';
    if (entityCount >= 3) return 'very_specific';
    if (entityCount >= 1) return 'moderately_specific';
    if (classified.components.location || classified.components.condition) return 'broad';
    return 'exploratory';
  }
  
  private inferUrgency(query: string): InferredIntent['urgency'] {
    if (/\b(urgent|immediately|asap|now)\b/i.test(query)) return 'immediate';
    if (/\b(planning|considering|thinking)\b/i.test(query)) return 'planning';
    if (/\b(research|learn|understand)\b/i.test(query)) return 'researching';
    return 'general_interest';
  }
  
  private inferKnowledgeLevel(query: string): InferredIntent['knowledgeLevel'] {
    if (/\b(my patient|prescribe|administer)\b/i.test(query)) return 'medical_professional';
    if (/\b(research|publication|data)\b/i.test(query)) return 'researcher';
    if (/\b(my (mom|dad|parent|spouse))\b/i.test(query)) return 'caregiver';
    return 'patient';
  }
  
  private mapStrategyToExecution(strategy: SearchStrategy): ExecutionPlan['primaryStrategy'] {
    switch (strategy) {
      case SearchStrategy.NCT_DIRECT:
        return 'nct_direct';
      case SearchStrategy.PROFILE_BASED:
        return 'profile_based';
      case SearchStrategy.LOCATION_THEN_CONDITION:
      case SearchStrategy.PROXIMITY_RANKING:
        return 'location_based';
      case SearchStrategy.CONDITION_THEN_LOCATION:
        return 'condition_based';
      default:
        return 'broad';
    }
  }
  
  private determineFallbacks(primaryStrategy: SearchStrategy): string[] {
    const fallbacks: string[] = [];
    
    switch (primaryStrategy) {
      case SearchStrategy.LOCATION_THEN_CONDITION:
        fallbacks.push('condition_based', 'broad');
        break;
      case SearchStrategy.CONDITION_THEN_LOCATION:
        fallbacks.push('location_based', 'broad');
        break;
      case SearchStrategy.PROFILE_BASED:
        fallbacks.push('condition_based', 'broad');
        break;
    }
    
    return fallbacks;
  }
  
  private buildEnrichedQuery(
    query: string, 
    entities: ExtractedEntities,
    healthProfile?: HealthProfile | null
  ): string {
    const parts: string[] = [query];
    
    // Add cancer type from profile if not in query
    if (healthProfile?.cancerType && 
        !entities.cancerTypes.some(c => 
          c.toLowerCase().includes(healthProfile.cancerType!.toLowerCase()))) {
      parts.push(healthProfile.cancerType);
    }
    
    // Add positive mutations from profile if not in query
    if (healthProfile?.molecularMarkers) {
      Object.entries(healthProfile.molecularMarkers).forEach(([marker, value]) => {
        if (value === 'POSITIVE' && !entities.mutations.includes(marker)) {
          parts.push(marker.replace(/_/g, ' '));
        }
      });
    }
    
    return parts.join(' ');
  }
  
  private buildFilters(components: ClassifiedQuery['components']): Record<string, any> {
    const filters: Record<string, any> = {};
    
    if (components.stage) {
      filters.stage = components.stage;
    }
    if (components.phase) {
      filters.phase = components.phase;
    }
    if (components.radius) {
      filters.maxDistance = components.radius;
    }
    
    return filters;
  }

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
      // Mutations at start (gene-like pattern, but exclude common words)
      { pattern: /^(?!what|when|where|who|why|how|find|show|list)([A-Z]{2,5}[0-9]{0,3}(?:[-_]?[A-Z0-9]+)?)/i, weight: 0.95 },
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
      { pattern: /available\s+to\s+me/i, weight: 0.85 },
      { pattern: /\bmy\s+(cancer|condition|diagnosis|profile)/i, weight: 0.85 },
      { pattern: /for\s+my\s+(cancer|condition|diagnosis)/i, weight: 0.85 },
      { pattern: /based\s+on\s+my\s+profile/i, weight: 0.95 },
      { pattern: /trials?\s+for\s+my/i, weight: 0.8 },
      { pattern: /trials?\s+.*\s+to\s+me/i, weight: 0.75 }
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
    // Pattern for genetic mutations: gene names (2-5 letters) often followed by numbers/letters
    // This will match KRAS, EGFR, ALK, BRAF, HER2, BRCA1/2, and any other gene mutations
    mutations: /\b([A-Z]{2,5}[0-9]{0,3}(?:[-_]?[A-Z0-9]+)?)\b/g,
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
      return this.buildNCTLookupQuery(query, nctMatch);
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
    let intent = this.determineIntent(intentScores, weights, components);
    
    // 6.5 IMPORTANT: If user has a health profile and query contains personal references,
    // prioritize eligibility/profile-based search
    if (context.healthProfile && this.hasPersonalReference(normalizedQuery)) {
      // Override to eligibility intent to trigger profile-based search
      intent = QueryIntent.ELIGIBILITY;
    }
    
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

    // Extract NCT IDs (support multiple)
    const nctMatches = query.match(this.COMPONENT_PATTERNS.nctId);
    if (nctMatches) {
      if (nctMatches.length > 1) {
        components.nctIds = nctMatches.map(id => id.toUpperCase());
      } else {
        components.nctId = nctMatches[0].toUpperCase();
      }
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
    // Handle "near me" pattern explicitly
    if (/\bnear\s+me\b/i.test(query) || /\bmy\s+(location|area)\b/i.test(query)) {
      return 'NEAR_ME'; // Special marker for current location
    }
    
    // Handle "nearby" or "closest" without specific location
    if (/\b(nearby|closest|nearest)\b/i.test(query) && !/\b(to|from)\s+\w+/i.test(query)) {
      return 'NEAR_ME';
    }
    
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
      if (match && match[1] && match[1].toLowerCase() !== 'me') {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Extract medical condition from query
   * Works with ANY cancer type or medical condition dynamically
   */
  private extractCondition(query: string): string | undefined {
    // Pattern for [organ/body part] + cancer/carcinoma/tumor
    const cancerMatch = query.match(
      /\b([a-z]+(?:\s+[a-z]+)*)\s*(cancer|carcinoma|tumor|tumour|neoplasm|malignancy)\b/i
    );
    if (cancerMatch) {
      return cancerMatch[0];
    }

    // Pattern for medical abbreviations (2-6 uppercase letters, possibly with numbers)
    // This will catch NSCLC, SCLC, CRC, HCC, RCC, AML, CLL, ALL, CML, DLBCL, TNBC, and any others
    const abbrevMatch = query.match(/\b[A-Z]{2,6}[0-9]{0,2}\b/);
    if (abbrevMatch) {
      // Verify it's likely medical (not common words like 'THE', 'AND', etc.)
      const commonWords = ['THE', 'AND', 'FOR', 'WITH', 'FROM', 'THIS', 'THAT', 'WHAT', 'WHERE', 'WHEN', 'HOW', 'WHY'];
      if (!commonWords.includes(abbrevMatch[0])) {
        return abbrevMatch[0];
      }
    }

    // Pattern for conditions ending in -oma, -emia, -osis, -itis (medical suffixes)
    const medicalSuffixMatch = query.match(/\b\w+(oma|emia|osis|itis|pathy)\b/i);
    if (medicalSuffixMatch) {
      return medicalSuffixMatch[0];
    }

    // Pattern for "[adjective] [type] [organ] cancer" like "triple negative breast cancer"
    const complexCancerMatch = query.match(
      /\b(\w+\s+)?(positive|negative|stage|grade|metastatic|advanced|early|recurrent)\s+(\w+\s+)*(cancer|carcinoma)\b/i
    );
    if (complexCancerMatch) {
      return complexCancerMatch[0];
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

  private hasPersonalReference(query: string): boolean {
    const personalPatterns = [
      /\bmy\s+(cancer|condition|diagnosis|disease|tumor|profile)/i,
      /for\s+my\s+(cancer|condition|diagnosis|disease)/i,
      /\bi\s+(have|was\s+diagnosed|am\s+eligible)/i,
      /trials?\s+for\s+me\b/i,
      /\bfor\s+me\b/i,  // Simple "for me" anywhere in query
      /\bnear\s+me\b/i,  // "near me" is inherently personal
      /based\s+on\s+my/i,
      /available\s+to\s+me/i,
      /trials?\s+.*\s+to\s+me/i,
      /trials?\s+.*\s+for\s+me\b/i  // Flexible pattern for "trials...for me"
    ];
    
    return personalPatterns.some(p => p.test(query));
  }

  private detectProfileDisable(query: string): boolean {
    const disablePatterns = [
      /\bfor\s+(anyone|everyone|others?)\b/i,
      /\bgeneral\s+(research|information|overview)\b/i,
      /\bnot\s+for\s+me\b/i,
      /\bcomparing\s+options\b/i,
      /\bresearch(?:ing)?\s+for\s+(?:a\s+)?(?:friend|family|patient)\b/i,
      /\beducational\s+purposes?\b/i,
      /\blearning\s+about\b/i
    ];
    
    return disablePatterns.some(p => p.test(query));
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
  private buildNCTLookupQuery(query: string, nctMatches: RegExpMatchArray): ClassifiedQuery {
    const components: ClassifiedQuery['components'] = {};
    
    // Handle single or multiple NCT IDs
    if (nctMatches.length > 1) {
      components.nctIds = nctMatches.map(id => id.toUpperCase());
    } else {
      components.nctId = nctMatches[0].toUpperCase();
    }
    
    // ALSO extract location if mentioned (e.g., "Are these trials in Chicago?")
    // This is important for location-aware compression
    const location = this.extractLocation(query);
    if (location) {
      components.location = location;
    }
    
    return {
      intent: QueryIntent.NCT_LOOKUP,
      strategy: SearchStrategy.NCT_DIRECT,
      components,
      weights: { location: location ? 0.3 : 0, condition: 0 },
      confidence: 1.0,
      reasoning: `Direct NCT lookup for ${nctMatches.length > 1 ? nctMatches.length + ' trials' : nctMatches[0]}${location ? ` with location context: ${location}` : ''}`
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
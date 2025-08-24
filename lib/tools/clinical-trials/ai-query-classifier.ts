/**
 * AI-Driven Query Classification System
 * 
 * Pure AI-based query understanding with deterministic structured outputs.
 * No regex patterns, no fallbacks, no backward compatibility.
 * 
 * Architecture:
 * - Uses GPT-4.1-mini with structured outputs for deterministic classification
 * - Handles all query types: conditions, mutations, drugs, locations, NCT IDs
 * - Direct integration with existing search infrastructure
 * - Optimized for speed and accuracy with caching
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { oncobot } from '../../../ai/providers';
import type { HealthProfile } from './types';
import { 
  QueryContext, 
  QueryContextBuilder,
  ProfileInfluence,
  type ExtractedEntities,
  type InferredIntent,
  type ExecutionPlan,
  type UserLocation
} from './query-context';
import { debug, DebugCategory } from './debug';

/**
 * Comprehensive schema for AI-based query understanding
 * Covers all possible query types and intents
 */
const QueryClassificationSchema = z.object({
  // Primary search intent
  searchType: z.enum([
    'nct_lookup',          // Direct NCT ID search
    'location_based',      // Location-focused search
    'condition_based',     // Condition/disease-focused search
    'drug_based',         // Drug/treatment-focused search
    'mutation_based',     // Molecular marker-focused search
    'profile_based',      // Using health profile as primary filter
    'eligibility_check',  // Checking eligibility for specific trials
    'general_info',       // General information about trials
    'combined',          // Multiple intents combined
  ]),
  
  // Extracted medical entities
  medical: z.object({
    conditions: z.array(z.string()).default([]),
    cancerTypes: z.array(z.string()).default([]),
    mutations: z.array(z.string()).default([]),
    drugs: z.array(z.string()).default([]),
    biomarkers: z.array(z.string()).default([]),
    stage: z.string().nullable().default(null),
    lineOfTherapy: z.string().nullable().default(null),
  }),
  
  // Location entities
  location: z.object({
    cities: z.array(z.string()).default([]),
    states: z.array(z.string()).default([]),
    countries: z.array(z.string()).default([]),
    isNearMe: z.boolean().default(false),
    radius: z.number().nullable().default(null),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).nullable().default(null),
  }),
  
  // Trial identifiers
  identifiers: z.object({
    nctIds: z.array(z.string()).default([]),
    trialNames: z.array(z.string()).default([]),
    sponsors: z.array(z.string()).default([]),
  }),
  
  // Query modifiers
  modifiers: z.object({
    phases: z.array(z.number()).default([]),
    recruitmentStatus: z.array(z.string()).default([]),
    minAge: z.number().nullable().default(null),
    maxAge: z.number().nullable().default(null),
    sex: z.enum(['all', 'male', 'female']).nullable().default(null),
    healthy: z.boolean().default(false),
  }),
  
  // Intent analysis
  intent: z.object({
    primary: z.string().default('general'),
    confidence: z.number().min(0).max(1).default(0.5),
    reasoning: z.string().default(''),
    requiresProfile: z.boolean().default(false),
    requiresLocation: z.boolean().default(false),
    complexity: z.enum(['simple', 'moderate', 'complex']).default('moderate'),
  }),
  
  // Execution strategy
  strategy: z.object({
    primary: z.enum([
      'direct_nct',
      'location_first',
      'condition_first',
      'profile_first',
      'parallel_search',
      'broad_then_filter',
    ]).default('condition_first'),
    fallbacks: z.array(z.string()).default([]),
    optimizations: z.array(z.string()).default([]),
  }),
});

type QueryClassification = z.infer<typeof QueryClassificationSchema>;

/**
 * High-performance cache for classification results
 */
class ClassificationCache {
  private cache = new Map<string, { 
    result: QueryClassification; 
    timestamp: number;
    context: string;
  }>();
  private readonly TTL = 15 * 60 * 1000; // 15 minutes
  
  get(query: string, profile?: HealthProfile | null): QueryClassification | null {
    const key = this.buildKey(query, profile);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      debug.log(DebugCategory.QUERY, '[Cache] Classification cache hit', { query });
      return cached.result;
    }
    
    // Clean expired entries
    this.cleanup();
    return null;
  }
  
  set(query: string, result: QueryClassification, profile?: HealthProfile | null): void {
    const key = this.buildKey(query, profile);
    this.cache.set(key, { 
      result, 
      timestamp: Date.now(),
      context: profile?.id || 'no-profile'
    });
  }
  
  private buildKey(query: string, profile?: HealthProfile | null): string {
    const normalized = query.toLowerCase().trim();
    const context = profile ? `${profile.cancerType}-${profile.diseaseStage}` : 'no-profile';
    return `${normalized}:${context}`;
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * AI-powered query classifier
 */
export class AIQueryClassifier {
  private cache = new ClassificationCache();
  
  /**
   * Classify query using AI with deterministic structured output
   */
  async classify(
    query: string,
    context?: {
      healthProfile?: HealthProfile | null;
      userLocation?: { latitude: number; longitude: number } | null;
      previousResults?: number;
    }
  ): Promise<QueryClassification> {
    // Check cache
    const cached = this.cache.get(query, context?.healthProfile);
    if (cached) {
      return cached;
    }
    
    debug.log(DebugCategory.QUERY, '[AI] Starting query classification', { 
      query, 
      model: 'oncobot-4.1-mini (OpenAI GPT-4.1-mini)',
      hasProfile: !!context?.healthProfile,
      hasLocation: !!context?.userLocation 
    });
    
    const startTime = Date.now();
    
    try {
      // Build context-aware system prompt
      const systemPrompt = this.buildSystemPrompt(context);
      
      // Use deterministic AI classification with OpenAI GPT-4.1-mini
      const result = await generateObject({
        model: oncobot.languageModel('oncobot-4.1-mini'),
        schema: QueryClassificationSchema,
        prompt: query,
        system: systemPrompt,
        temperature: 0, // Fully deterministic
        maxTokens: 2000, // Increased to prevent incomplete responses
      });
      
      const classification = result.object;
      
      debug.log(DebugCategory.QUERY, '[AI] Classification complete', {
        searchType: classification.searchType,
        confidence: classification.intent.confidence,
        strategy: classification.strategy.primary,
        timeMs: Date.now() - startTime,
      });
      
      // Cache result
      this.cache.set(query, classification, context?.healthProfile);
      
      return classification;
    } catch (error) {
      debug.error(DebugCategory.ERROR, '[AI] Classification failed', error);
      throw new Error(`Query classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Build QueryContext from classification
   */
  buildQueryContext(
    query: string,
    classification: QueryClassification,
    context?: {
      healthProfile?: HealthProfile | null;
      userLocation?: { latitude: number; longitude: number } | null;
    }
  ): QueryContext {
    const builder = new QueryContextBuilder(query);
    
    // Set user context
    if (context?.healthProfile) {
      builder.withHealthProfile(context.healthProfile);
    }
    
    // Build user location
    const userLocation = this.buildUserLocation(classification, context);
    if (userLocation) {
      builder.withUserLocation(userLocation);
    }
    
    // Map extracted entities
    const entities: ExtractedEntities = {
      nctIds: classification.identifiers.nctIds,
      conditions: classification.medical.conditions,
      cancerTypes: classification.medical.cancerTypes,
      mutations: classification.medical.mutations,
      biomarkers: classification.medical.biomarkers,
      locations: [
        ...classification.location.cities,
        ...classification.location.states,
      ],
      drugs: classification.medical.drugs,
      treatments: [],
      stages: classification.medical.stage ? [classification.medical.stage] : [],
      otherMedicalTerms: []
    };
    builder.withExtractedEntities(entities);
    
    // Map inferred intent to proper structure
    let primaryGoal: InferredIntent['primaryGoal'] = 'find_trials';
    if (classification.searchType === 'nct_lookup') {
      primaryGoal = 'specific_trial';
    } else if (classification.intent.primary.includes('eligibility')) {
      primaryGoal = 'check_eligibility';
    } else if (classification.intent.primary.includes('info')) {
      primaryGoal = 'get_info';
    }
    
    let specificity: InferredIntent['specificity'] = 'broad';
    if (classification.identifiers.nctIds.length > 0) {
      specificity = 'very_specific';
    } else if (classification.medical.mutations.length > 0 || classification.medical.drugs.length > 0) {
      specificity = 'moderately_specific';
    }
    
    const inferredIntent: InferredIntent = {
      primaryGoal,
      specificity,
      urgency: 'researching',
      knowledgeLevel: 'patient',
      confidence: classification.intent.confidence,
    };
    builder.withInferredIntent(inferredIntent);
    
    // Build execution plan with correct structure
    const baseQuery = classification.identifiers.nctIds.length > 0 
      ? classification.identifiers.nctIds[0]
      : this.buildEnrichedQuery(classification, context?.healthProfile);
      
    const executionPlan: ExecutionPlan = {
      primaryStrategy: this.mapStrategyToExecutionPlan(classification.strategy.primary),
      fallbackStrategies: classification.strategy.fallbacks,
      searchParams: {
        baseQuery,
        enrichedQuery: this.buildEnrichedQuery(classification, context?.healthProfile),
        filters: {
          location: classification.location.cities[0],
          conditions: classification.medical.conditions,
          mutations: classification.medical.mutations,
          drugs: classification.medical.drugs,
          radius: classification.location.radius || 300,
        },
        maxResults: 25,
      },
      validations: {
        checkEligibility: classification.intent.requiresProfile,
        verifyLocations: classification.location.cities.length > 0,
        confirmRecruitmentStatus: true,
      },
    };
    builder.withExecutionPlan(executionPlan);
    
    // Set profile influence based on classification
    const profileInfluence = this.determineProfileInfluence(classification, context?.healthProfile);
    builder.withProfileInfluence(profileInfluence);
    
    // Add decision tracking
    builder.addDecision(
      'AIQueryClassifier',
      `Classified as ${classification.searchType} with ${classification.strategy.primary}`,
      classification.intent.confidence,
      classification.intent.reasoning
    );
    
    return builder.build();
  }
  
  /**
   * Build comprehensive system prompt
   */
  private buildSystemPrompt(context?: any): string {
    let prompt = `You are an expert clinical trials query classifier. Analyze queries to extract ALL relevant information for trial searching.

Your task:
1. Identify the primary search type and intent
2. Extract ALL medical entities (conditions, cancers, mutations, drugs, biomarkers)
3. Extract ALL location information
4. Identify any NCT IDs or trial identifiers
5. Determine the optimal search strategy
6. Assess query complexity and confidence

Important guidelines:
- Be comprehensive - extract everything that could be relevant
- Recognize medical abbreviations (NSCLC, SCLC, CRC, HCC, etc.)
- Detect molecular markers (KRAS G12C, EGFR, ALK, PD-L1, etc.)
- Identify drug names (pembrolizumab, nivolumab, sotorasib, etc.)
- Parse location formats (city names, state abbreviations, "near me")
- NCT IDs follow pattern: NCT followed by 8 digits
- Default search radius is 300 miles unless specified
- Consider health profile context when available`;

    // Add health profile context
    if (context?.healthProfile) {
      const profile = context.healthProfile;
      prompt += `

User Health Profile:
- Cancer Type: ${profile.cancerType || 'Unknown'}
- Stage: ${profile.diseaseStage || 'Unknown'}`;
      
      // Add molecular markers
      if (profile.molecularMarkers) {
        const markers = Object.entries(profile.molecularMarkers)
          .filter(([_, status]) => status === 'POSITIVE')
          .map(([marker]) => marker);
        
        if (markers.length > 0) {
          prompt += `
- Positive Markers: ${markers.join(', ')}`;
        }
      }
      
      prompt += `

When a query is general (e.g., "find trials"), use the profile to enrich the search.`;
    }
    
    // Add location context
    if (context?.userLocation) {
      prompt += `

User Location: ${context.userLocation.latitude}, ${context.userLocation.longitude}
If query mentions "near me" or similar, mark isNearMe as true.`;
    }
    
    prompt += `

Classification rules:
- 'nct_lookup': Query contains NCT ID(s)
- 'location_based': Primary focus is on location
- 'condition_based': Primary focus is on medical condition
- 'drug_based': Asking about specific drug/treatment
- 'mutation_based': Focused on molecular markers
- 'profile_based': General query relying on user profile
- 'combined': Multiple equal intents

Strategy selection:
- Use 'direct_nct' for NCT ID lookups
- Use 'location_first' when location is primary concern
- Use 'condition_first' when medical condition is primary
- Use 'profile_first' when leveraging user profile
- Use 'parallel_search' for balanced location + condition
- Use 'broad_then_filter' for complex multi-criteria queries`;
    
    return prompt;
  }
  
  /**
   * Build user location from classification
   */
  private buildUserLocation(
    classification: QueryClassification,
    context?: any
  ): UserLocation | undefined {
    const loc = classification.location;
    
    if (!loc.cities.length && !loc.isNearMe && !context?.userLocation) {
      return undefined;
    }
    
    const userLocation: UserLocation = {
      searchRadius: loc.radius || 300,
    };
    
    // Add extracted location fields directly
    if (loc.cities.length > 0) {
      userLocation.city = loc.cities[0];
      userLocation.state = loc.states[0];
      userLocation.country = loc.countries[0] || 'USA';
      userLocation.explicitlyRequested = true;
    }
    
    // Add coordinates
    if (context?.userLocation) {
      userLocation.coordinates = context.userLocation;
    } else if (loc.coordinates) {
      userLocation.coordinates = loc.coordinates;
    }
    
    // Mark as explicitly requested for "near me" queries
    if (loc.isNearMe) {
      userLocation.explicitlyRequested = true;
    }
    
    return userLocation;
  }
  
  /**
   * Map AI strategy to execution plan format
   */
  private mapStrategyToExecutionPlan(strategy: string): ExecutionPlan['primaryStrategy'] {
    const mapping: Record<string, ExecutionPlan['primaryStrategy']> = {
      'direct_nct': 'nct_direct',
      'location_first': 'location_based',
      'condition_first': 'condition_based',
      'profile_first': 'profile_based',
      'parallel_search': 'broad',
      'broad_then_filter': 'broad',
    };
    return mapping[strategy] || 'broad';
  }
  
  /**
   * Build enriched query string
   */
  private buildEnrichedQuery(
    classification: QueryClassification,
    profile?: HealthProfile | null
  ): string {
    const parts: string[] = [];
    
    // Add cancer type from profile if not in query
    if (profile?.cancerType && !classification.medical.cancerTypes.includes(profile.cancerType)) {
      parts.push(profile.cancerType);
    }
    
    // Add conditions
    parts.push(...classification.medical.conditions);
    
    // Add mutations
    parts.push(...classification.medical.mutations);
    
    // Add drugs
    parts.push(...classification.medical.drugs);
    
    return parts.join(' ').trim() || 'cancer';
  }
  
  /**
   * Determine profile influence level
   */
  private determineProfileInfluence(
    classification: QueryClassification,
    profile?: HealthProfile | null
  ): { level: ProfileInfluence; reason: string } {
    if (!profile) {
      return { 
        level: ProfileInfluence.DISABLED, 
        reason: 'No health profile available' 
      };
    }
    
    // NCT lookup doesn't need profile
    if (classification.searchType === 'nct_lookup') {
      return { 
        level: ProfileInfluence.DISABLED, 
        reason: 'Direct NCT lookup' 
      };
    }
    
    // Profile-based search uses full profile
    if (classification.searchType === 'profile_based') {
      return { 
        level: ProfileInfluence.ENHANCED, 
        reason: 'Profile-based search requested' 
      };
    }
    
    // Location search with profile gets contextual influence
    if (classification.searchType === 'location_based') {
      return { 
        level: ProfileInfluence.CONTEXTUAL, 
        reason: 'Location search with profile context' 
      };
    }
    
    // Default to enhanced for medical queries
    return { 
      level: ProfileInfluence.ENHANCED, 
      reason: 'Medical query with profile available' 
    };
  }
}

// Export singleton instance
export const aiQueryClassifier = new AIQueryClassifier();
/**
 * AI-Driven Query Classification with OpenAI Structured Outputs
 * 
 * Uses OpenAI's structured outputs mode for guaranteed schema compliance.
 * No backward compatibility - clean implementation only.
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
 * Schema for OpenAI Structured Outputs
 * No default values - all handled in post-processing
 */
const StructuredQuerySchema = z.object({
  searchType: z.enum([
    'nct_lookup',
    'location_based',
    'condition_based',
    'drug_based',
    'mutation_based',
    'profile_based',
    'eligibility_check',
    'general_info',
    'combined',
  ]).describe('Primary search intent based on query analysis'),
  
  medical: z.object({
    conditions: z.array(z.string()).describe('Medical conditions mentioned'),
    cancerTypes: z.array(z.string()).describe('Specific cancer types identified'),
    mutations: z.array(z.string()).describe('Genetic mutations or molecular markers'),
    drugs: z.array(z.string()).describe('Drug or treatment names'),
    biomarkers: z.array(z.string()).describe('Biomarkers or test results'),
    stage: z.string().nullable().describe('Disease stage if mentioned'),
    lineOfTherapy: z.string().nullable().describe('Treatment line (first, second, etc)'),
  }).describe('Medical entities extracted from query'),
  
  location: z.object({
    cities: z.array(z.string()).describe('City names mentioned'),
    states: z.array(z.string()).describe('State names or abbreviations'),
    countries: z.array(z.string()).describe('Country names'),
    isNearMe: z.boolean().describe('User wants trials near their location'),
    radius: z.number().nullable().describe('Search radius in miles if specified'),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).nullable().describe('Specific coordinates if provided'),
  }).describe('Location information from query'),
  
  identifiers: z.object({
    nctIds: z.array(z.string()).describe('NCT IDs (format: NCT followed by 8 digits)'),
    trialNames: z.array(z.string()).describe('Specific trial names mentioned'),
    sponsors: z.array(z.string()).describe('Trial sponsors or organizations'),
  }).describe('Trial identifiers and references'),
  
  modifiers: z.object({
    phases: z.array(z.number()).describe('Clinical trial phases (1, 2, 3, 4)'),
    recruitmentStatus: z.array(z.string()).describe('Recruitment status preferences'),
    minAge: z.number().nullable().describe('Minimum age requirement'),
    maxAge: z.number().nullable().describe('Maximum age requirement'),
    sex: z.enum(['all', 'male', 'female']).nullable().describe('Sex restriction'),
    healthy: z.boolean().describe('Looking for healthy volunteer trials'),
  }).describe('Search modifiers and filters'),
  
  intent: z.object({
    primary: z.string().describe('Primary user intent'),
    confidence: z.number().min(0).max(1).describe('Confidence in classification (0-1)'),
    reasoning: z.string().describe('Brief reasoning for classification'),
    requiresProfile: z.boolean().describe('Query needs health profile context'),
    requiresLocation: z.boolean().describe('Query needs location context'),
    complexity: z.enum(['simple', 'moderate', 'complex']).describe('Query complexity level'),
  }).describe('Intent analysis and confidence'),
  
  strategy: z.object({
    primary: z.enum([
      'direct_nct',
      'location_first',
      'condition_first',
      'profile_first',
      'parallel_search',
      'broad_then_filter',
    ]).describe('Recommended search strategy'),
    fallbacks: z.array(z.string()).describe('Fallback strategies if primary fails'),
    optimizations: z.array(z.string()).describe('Optimization opportunities'),
  }).describe('Execution strategy recommendation'),
});

type StructuredQueryClassification = z.infer<typeof StructuredQuerySchema>;

/**
 * Cache for structured outputs results
 */
class StructuredClassificationCache {
  private cache = new Map<string, { 
    result: StructuredQueryClassification; 
    timestamp: number;
    profileId?: string;
  }>();
  private readonly TTL = 15 * 60 * 1000; // 15 minutes
  
  get(query: string, profile?: HealthProfile | null): StructuredQueryClassification | null {
    const key = this.buildKey(query, profile);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      debug.log(DebugCategory.QUERY, '[Cache] Structured classification cache hit', { query });
      return cached.result;
    }
    
    this.cleanup();
    return null;
  }
  
  set(query: string, result: StructuredQueryClassification, profile?: HealthProfile | null): void {
    const key = this.buildKey(query, profile);
    this.cache.set(key, { 
      result, 
      timestamp: Date.now(),
      profileId: profile?.id
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
 * Structured outputs query classifier using OpenAI
 */
export class StructuredQueryClassifier {
  private cache = new StructuredClassificationCache();
  
  /**
   * Classify query using OpenAI structured outputs
   */
  async classify(
    query: string,
    context?: {
      healthProfile?: HealthProfile | null;
      userLocation?: { latitude: number; longitude: number } | null;
      previousResults?: number;
    }
  ): Promise<StructuredQueryClassification> {
    // Check cache
    const cached = this.cache.get(query, context?.healthProfile);
    if (cached) {
      return cached;
    }
    
    debug.log(DebugCategory.QUERY, '[Structured] Starting query classification', { 
      query, 
      model: 'gpt-4o-mini (structured outputs)',
      hasProfile: !!context?.healthProfile,
      hasLocation: !!context?.userLocation 
    });
    
    const startTime = Date.now();
    
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      
      // Use OpenAI structured outputs mode via oncobot provider
      const result = await generateObject({
        model: oncobot.languageModel('oncobot-4o-mini'),
        schema: StructuredQuerySchema,
        prompt: query,
        system: systemPrompt,
        temperature: 0, // Fully deterministic
        maxTokens: 2000,
      });
      
      const classification = result.object;
      
      debug.log(DebugCategory.QUERY, '[Structured] Classification complete', {
        searchType: classification.searchType,
        confidence: classification.intent.confidence,
        strategy: classification.strategy.primary,
        timeMs: Date.now() - startTime,
      });
      
      // Cache result
      this.cache.set(query, classification, context?.healthProfile);
      
      return classification;
    } catch (error) {
      debug.error(DebugCategory.ERROR, '[Structured] Classification failed', error);
      throw new Error(`Structured classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Build QueryContext from structured classification
   */
  buildQueryContext(
    query: string,
    classification: StructuredQueryClassification,
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
      locations: [
        ...classification.location.cities,
        ...classification.location.states,
      ],
      keywords: [],
      radius: classification.location.radius,
    };
    builder.withExtractedEntities(entities);
    
    // Map inferred intent
    const inferredIntent: InferredIntent = {
      searchType: classification.searchType as any,
      intent: classification.intent.primary as any,
      hasExplicitLocation: classification.location.cities.length > 0 || 
                          classification.location.isNearMe,
      hasExplicitCondition: classification.medical.conditions.length > 0,
      hasHealthProfile: !!context?.healthProfile,
      hasUserLocation: !!context?.userLocation || classification.location.isNearMe,
      confidence: classification.intent.confidence,
    };
    builder.withInferredIntent(inferredIntent);
    
    // Build execution plan
    const executionPlan: ExecutionPlan = {
      primaryStrategy: this.mapStrategyToExecutionPlan(classification.strategy.primary),
      fallbackStrategies: classification.strategy.fallbacks,
      searchParams: {
        location: classification.location.cities[0],
        conditions: classification.medical.conditions,
        mutations: classification.medical.mutations,
        drugs: classification.medical.drugs,
        radius: classification.location.radius || 300,
        enrichedQuery: this.buildEnrichedQuery(classification, context?.healthProfile),
      },
      optimization: {
        useCache: false,
        parallelSearch: classification.strategy.optimizations.includes('parallel'),
        maxResults: 25,
      },
    };
    builder.withExecutionPlan(executionPlan);
    
    // Set profile influence
    const profileInfluence = this.determineProfileInfluence(classification, context?.healthProfile);
    builder.withProfileInfluence(
      profileInfluence.level,
      profileInfluence.reason
    );
    
    // Add decision tracking
    builder.addDecision(
      'StructuredQueryClassifier',
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
    classification: StructuredQueryClassification,
    context?: any
  ): UserLocation | undefined {
    const loc = classification.location;
    
    if (!loc.cities.length && !loc.isNearMe && !context?.userLocation) {
      return undefined;
    }
    
    const userLocation: UserLocation = {
      searchRadius: loc.radius || 300,
    };
    
    // Add extracted location
    if (loc.cities.length > 0) {
      userLocation.extractedLocation = {
        city: loc.cities[0],
        state: loc.states[0],
        country: loc.countries[0] || 'USA',
      };
    }
    
    // Add coordinates
    if (context?.userLocation) {
      userLocation.coordinates = context.userLocation;
    } else if (loc.coordinates) {
      userLocation.coordinates = loc.coordinates;
    }
    
    // Mark as near me
    if (loc.isNearMe) {
      userLocation.isNearMe = true;
    }
    
    return userLocation;
  }
  
  /**
   * Map strategy to execution plan format
   */
  private mapStrategyToExecutionPlan(strategy: string): string {
    const mapping: Record<string, string> = {
      'direct_nct': 'nct_direct',
      'location_first': 'location_based',
      'condition_first': 'condition_based',
      'profile_first': 'profile_based',
      'parallel_search': 'parallel',
      'broad_then_filter': 'broad_search',
    };
    return mapping[strategy] || strategy;
  }
  
  /**
   * Build enriched query string
   */
  private buildEnrichedQuery(
    classification: StructuredQueryClassification,
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
    classification: StructuredQueryClassification,
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
export const structuredQueryClassifier = new StructuredQueryClassifier();
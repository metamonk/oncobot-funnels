/**
 * AI-Driven Query Understanding Service
 * 
 * Uses GPT-4.1-mini with structured outputs for deterministic query classification.
 * Replaces regex-based pattern matching with true natural language understanding.
 * 
 * Architecture:
 * - Leverages OpenAI's structured output capability for determinism
 * - Uses standardized AI wrappers from the existing system
 * - Maintains compatibility with existing QueryContext infrastructure
 * - Provides caching for repeated queries to minimize API calls
 */

import { oncobot } from '../../../ai/providers';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { HealthProfile } from './types';
import { LocationService } from './location-service';
import { debug, DebugCategory } from './debug';
import {
  QueryContext,
  QueryContextBuilder,
  ExtractedEntities,
  InferredIntent,
  ExecutionPlan,
  UserLocation
} from './query-context';

/**
 * Schema for structured output from AI model
 * This ensures deterministic responses with typed data
 */
const QueryUnderstandingSchema = z.object({
  // Primary intent of the query
  intent: z.enum([
    'location_based',      // User wants trials in a specific location
    'condition_based',     // User wants trials for a condition
    'location_and_condition', // User wants both location AND condition filtering
    'nct_lookup',         // User wants specific trial by NCT ID
    'eligibility_check',  // User asking about eligibility
    'general_info',       // General information request
    'near_me',           // User wants trials near their location
  ]),
  
  // Extracted entities
  entities: z.object({
    // Location information
    location: z.object({
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      isNearMe: z.boolean(),
      searchRadius: z.number().optional(), // in miles
    }),
    
    // Medical conditions
    conditions: z.array(z.object({
      name: z.string(),
      type: z.enum(['cancer', 'other', 'unspecified']).optional(),
      subtype: z.string().optional(), // e.g., "NSCLC", "SCLC"
    })),
    
    // Molecular markers and mutations
    molecularMarkers: z.array(z.object({
      gene: z.string(),
      mutation: z.string().optional(),
      status: z.enum(['positive', 'negative', 'unknown']).optional(),
    })),
    
    // NCT IDs if mentioned
    nctIds: z.array(z.string()),
    
    // Treatment modalities mentioned
    treatments: z.array(z.string()),
    
    // Stage or phase information
    diseaseStage: z.string().optional(),
    trialPhase: z.array(z.number()).optional(),
  }),
  
  // Confidence and reasoning
  confidence: z.number().min(0).max(1),
  reasoning: z.string(), // Brief explanation of classification
  
  // Suggested search strategy
  suggestedStrategy: z.enum([
    'profile_first',     // Use health profile as primary filter
    'location_first',    // Search by location then filter
    'condition_first',   // Search by condition then filter by location
    'parallel_search',   // Search both and merge results
    'nct_direct',       // Direct NCT lookup
    'broad_search',     // Cast wide net then filter
  ]),
  
  // Context requirements
  requiresProfile: z.boolean(),
  requiresLocation: z.boolean(),
});

type QueryUnderstanding = z.infer<typeof QueryUnderstandingSchema>;

/**
 * Cache for AI query understanding results
 * Reduces API calls for repeated queries
 */
class QueryUnderstandingCache {
  private cache = new Map<string, { result: QueryUnderstanding; timestamp: number }>();
  private readonly TTL = 30 * 60 * 1000; // 30 minutes
  
  get(query: string, context?: any): QueryUnderstanding | null {
    const key = this.buildKey(query, context);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      debug.log(DebugCategory.QUERY, 'Cache hit for query understanding', { query });
      return cached.result;
    }
    
    return null;
  }
  
  set(query: string, result: QueryUnderstanding, context?: any): void {
    const key = this.buildKey(query, context);
    this.cache.set(key, { result, timestamp: Date.now() });
    
    // Cleanup old entries
    if (this.cache.size > 100) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }
  }
  
  private buildKey(query: string, context?: any): string {
    const normalizedQuery = query.toLowerCase().trim();
    const contextKey = context?.healthProfile?.id || 'no-profile';
    return `${normalizedQuery}:${contextKey}`;
  }
}

/**
 * AI-powered query understanding service
 */
export class AIQueryUnderstanding {
  private locationService: LocationService;
  private cache: QueryUnderstandingCache;
  
  constructor() {
    this.locationService = LocationService.getInstance();
    this.cache = new QueryUnderstandingCache();
  }
  
  /**
   * Understand user query using AI with structured outputs
   */
  async understandQuery(
    query: string,
    context?: {
      healthProfile?: HealthProfile | null;
      userLocation?: { latitude?: number; longitude?: number };
      previousQuery?: string;
      hasCachedResults?: boolean;
    }
  ): Promise<QueryUnderstanding> {
    // Check cache first
    const cached = this.cache.get(query, context);
    if (cached) {
      return cached;
    }
    
    debug.log(DebugCategory.QUERY, 'AI query understanding started', { 
      query, 
      hasProfile: !!context?.healthProfile,
      hasLocation: !!context?.userLocation 
    });
    
    try {
      // Build system prompt with context
      const systemPrompt = this.buildSystemPrompt(context);
      
      // Use GPT-4.1-mini with structured output via standardized wrapper
      const result = await generateObject({
        model: oncobot.languageModel('oncobot-4.1-mini'),
        schema: QueryUnderstandingSchema,
        prompt: query,
        system: systemPrompt,
        temperature: 0, // Deterministic output
        maxTokens: 500,
      });
      
      debug.log(DebugCategory.QUERY, 'AI understanding complete', {
        intent: result.object.intent,
        confidence: result.object.confidence,
        strategy: result.object.suggestedStrategy,
      });
      
      // Cache the result
      this.cache.set(query, result.object, context);
      
      return result.object;
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'AI query understanding failed', error);
      
      // Fallback to basic understanding
      return this.fallbackUnderstanding(query, context);
    }
  }
  
  /**
   * Build QueryContext from AI understanding
   */
  buildQueryContext(
    query: string,
    understanding: QueryUnderstanding,
    context?: {
      healthProfile?: HealthProfile | null;
      userLocation?: { latitude?: number; longitude?: number };
      previousQuery?: string;
      hasCachedResults?: boolean;
    }
  ): QueryContext {
    const builder = new QueryContextBuilder(query);
    
    // Set user context
    if (context?.healthProfile) {
      builder.withHealthProfile(context.healthProfile);
    }
    
    // Set user location if available
    const userLocation = this.buildUserLocation(understanding, context);
    if (userLocation) {
      builder.withUserLocation(userLocation);
    }
    
    // Map AI entities to QueryContext format
    const entities = this.mapEntitiesToContext(understanding.entities);
    builder.withExtractedEntities(entities);
    
    // Map AI intent to QueryContext format
    const inferredIntent = this.mapIntentToContext(understanding);
    builder.withInferredIntent(inferredIntent);
    
    // Build execution plan based on AI suggestions
    const executionPlan = this.buildExecutionPlan(understanding);
    builder.withExecutionPlan(executionPlan);
    
    // Add decision tracking
    builder.addDecision(
      'AIQueryUnderstanding',
      `Classified as ${understanding.intent} with ${understanding.suggestedStrategy} strategy`,
      understanding.confidence,
      understanding.reasoning
    );
    
    return builder.build();
  }
  
  /**
   * Build system prompt with context information
   */
  private buildSystemPrompt(context?: any): string {
    let prompt = `You are a clinical trials search query analyzer. Analyze the user's query to understand their intent and extract relevant information.

Your task is to:
1. Determine the primary intent of the query
2. Extract all relevant medical and location entities
3. Suggest the best search strategy
4. Assess confidence in your understanding

Important context:`;
    
    if (context?.healthProfile) {
      const profile = context.healthProfile;
      prompt += `
      
User has a health profile:
- Cancer Type: ${profile.cancer_type || profile.cancerType || 'Unknown'}
- Stage: ${profile.diseaseStage || profile.disease_stage || 'Unknown'}`;
      
      if (profile.molecularMarkers || profile.molecular_markers) {
        const markers = profile.molecularMarkers || profile.molecular_markers;
        const positiveMarkers = Object.entries(markers)
          .filter(([_, status]) => status === 'POSITIVE')
          .map(([marker]) => marker.replace(/_/g, ' '));
        
        if (positiveMarkers.length > 0) {
          prompt += `
- Positive Mutations: ${positiveMarkers.join(', ')}`;
        }
      }
    }
    
    if (context?.userLocation) {
      prompt += `
      
User's current location coordinates: ${context.userLocation.latitude}, ${context.userLocation.longitude}`;
    }
    
    prompt += `

Guidelines:
- If the query mentions "near me" or similar, set isNearMe to true
- Extract specific city/state names when mentioned
- Identify cancer types and subtypes (e.g., NSCLC vs SCLC)
- Detect molecular markers like KRAS G12C, EGFR, etc.
- Recognize NCT IDs (format: NCT followed by 8 digits)
- For location + condition queries, use "location_and_condition" intent
- Default search radius is 300 miles unless specified otherwise`;
    
    return prompt;
  }
  
  /**
   * Build user location from AI understanding
   */
  private buildUserLocation(
    understanding: QueryUnderstanding,
    context?: any
  ): UserLocation | undefined {
    const location = understanding.entities.location;
    
    if (!location.city && !location.isNearMe && !context?.userLocation) {
      return undefined;
    }
    
    const userLocation: UserLocation = {
      searchRadius: location.searchRadius || 300,
    };
    
    // Add extracted location
    if (location.city || location.state) {
      userLocation.extractedLocation = {
        city: location.city,
        state: location.state,
        country: location.country || 'USA',
      };
    }
    
    // Add coordinates if available
    if (context?.userLocation) {
      userLocation.coordinates = {
        latitude: context.userLocation.latitude!,
        longitude: context.userLocation.longitude!,
      };
    }
    
    // Mark as "near me" if applicable
    if (location.isNearMe) {
      userLocation.isNearMe = true;
    }
    
    return userLocation;
  }
  
  /**
   * Map AI entities to QueryContext format
   */
  private mapEntitiesToContext(entities: QueryUnderstanding['entities']): ExtractedEntities {
    const extracted: ExtractedEntities = {
      nctIds: entities.nctIds,
    };
    
    // Map conditions
    if (entities.conditions.length > 0) {
      extracted.conditions = entities.conditions.map(c => c.name);
      
      // Extract cancer types specifically
      const cancerConditions = entities.conditions.filter(c => c.type === 'cancer');
      if (cancerConditions.length > 0) {
        extracted.cancerTypes = cancerConditions.map(c => c.subtype || c.name);
      }
    }
    
    // Map molecular markers
    if (entities.molecularMarkers.length > 0) {
      extracted.molecularMarkers = {};
      entities.molecularMarkers.forEach(marker => {
        const key = marker.mutation 
          ? `${marker.gene}_${marker.mutation}`.toUpperCase()
          : marker.gene.toUpperCase();
        extracted.molecularMarkers![key] = 
          marker.status === 'positive' ? 'POSITIVE' : 
          marker.status === 'negative' ? 'NEGATIVE' : 
          'UNKNOWN';
      });
    }
    
    // Map treatments
    if (entities.treatments.length > 0) {
      extracted.treatments = entities.treatments;
    }
    
    // Map location
    if (entities.location.city || entities.location.state) {
      extracted.locations = [{
        city: entities.location.city,
        state: entities.location.state,
        country: entities.location.country || 'USA',
      }];
    }
    
    // Map trial phases
    if (entities.trialPhase && entities.trialPhase.length > 0) {
      extracted.trialPhases = entities.trialPhase.map(p => `Phase ${p}`);
    }
    
    return extracted;
  }
  
  /**
   * Map AI intent to QueryContext format
   */
  private mapIntentToContext(understanding: QueryUnderstanding): InferredIntent {
    // Map AI intent to primary goal
    const goalMapping: Record<string, string> = {
      'location_based': 'find_trials_by_location',
      'condition_based': 'find_trials_by_condition',
      'location_and_condition': 'find_trials_by_both',
      'nct_lookup': 'lookup_specific_trial',
      'eligibility_check': 'check_eligibility',
      'general_info': 'general_information',
      'near_me': 'find_nearby_trials',
    };
    
    return {
      primaryGoal: goalMapping[understanding.intent] || 'find_trials',
      confidence: understanding.confidence,
      reasoning: understanding.reasoning,
    };
  }
  
  /**
   * Build execution plan from AI suggestions
   */
  private buildExecutionPlan(understanding: QueryUnderstanding): ExecutionPlan {
    // Map AI strategy to execution strategy
    const strategyMapping: Record<string, string> = {
      'profile_first': 'profile_based_search',
      'location_first': 'location_then_filter',
      'condition_first': 'condition_then_filter',
      'parallel_search': 'parallel_merge',
      'nct_direct': 'direct_lookup',
      'broad_search': 'broad_then_filter',
    };
    
    const plan: ExecutionPlan = {
      primaryStrategy: strategyMapping[understanding.suggestedStrategy] || 'adaptive',
      fallbackStrategies: [],
      requiredData: [],
      estimatedComplexity: understanding.confidence > 0.8 ? 'low' : 
                          understanding.confidence > 0.5 ? 'medium' : 'high',
    };
    
    // Determine required data
    if (understanding.requiresProfile) {
      plan.requiredData.push('health_profile');
    }
    if (understanding.requiresLocation) {
      plan.requiredData.push('user_location');
    }
    
    // Add fallback strategies based on intent
    if (understanding.intent === 'location_and_condition') {
      plan.fallbackStrategies = ['condition_only', 'location_only', 'broad_search'];
    } else if (understanding.intent === 'location_based') {
      plan.fallbackStrategies = ['broad_search_with_location_filter'];
    } else if (understanding.intent === 'condition_based') {
      plan.fallbackStrategies = ['profile_based_search', 'broad_search'];
    }
    
    return plan;
  }
  
  /**
   * Fallback understanding when AI fails
   */
  private fallbackUnderstanding(query: string, context?: any): QueryUnderstanding {
    debug.log(DebugCategory.QUERY, 'Using fallback query understanding');
    
    // Simple keyword-based fallback
    const lowerQuery = query.toLowerCase();
    
    // Check for NCT IDs
    const nctMatch = query.match(/NCT\d{8}/gi);
    if (nctMatch) {
      return {
        intent: 'nct_lookup',
        entities: {
          location: { isNearMe: false },
          conditions: [],
          molecularMarkers: [],
          nctIds: nctMatch,
          treatments: [],
        },
        confidence: 0.9,
        reasoning: 'NCT ID detected in query',
        suggestedStrategy: 'nct_direct',
        requiresProfile: false,
        requiresLocation: false,
      };
    }
    
    // Check for location keywords
    const hasLocation = /\b(in|near|at|around|within)\s+\w+/i.test(query) ||
                       /near me/i.test(query);
    
    // Check for condition keywords
    const hasCondition = /cancer|tumor|carcinoma|nsclc|sclc|lung|breast|colon/i.test(query);
    
    // Check for molecular markers
    const hasMarkers = /kras|egfr|alk|ros1|braf|g12c|g12d/i.test(query);
    
    // Determine intent
    let intent: QueryUnderstanding['intent'] = 'general_info';
    let strategy: QueryUnderstanding['suggestedStrategy'] = 'broad_search';
    
    if (hasLocation && hasCondition) {
      intent = 'location_and_condition';
      strategy = 'parallel_search';
    } else if (hasLocation) {
      intent = /near me/i.test(query) ? 'near_me' : 'location_based';
      strategy = 'location_first';
    } else if (hasCondition || hasMarkers) {
      intent = 'condition_based';
      strategy = context?.healthProfile ? 'profile_first' : 'condition_first';
    }
    
    return {
      intent,
      entities: {
        location: { 
          isNearMe: /near me/i.test(query),
          city: this.extractSimpleLocation(query),
        },
        conditions: this.extractSimpleConditions(query),
        molecularMarkers: this.extractSimpleMarkers(query),
        nctIds: [],
        treatments: [],
      },
      confidence: 0.5,
      reasoning: 'Fallback keyword-based understanding',
      suggestedStrategy: strategy,
      requiresProfile: hasCondition || hasMarkers,
      requiresLocation: hasLocation,
    };
  }
  
  /**
   * Simple location extraction for fallback
   */
  private extractSimpleLocation(query: string): string | undefined {
    const match = query.match(/(?:in|near|at|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    return match?.[1];
  }
  
  /**
   * Simple condition extraction for fallback
   */
  private extractSimpleConditions(query: string): Array<{ name: string; type?: string }> {
    const conditions: Array<{ name: string; type?: string }> = [];
    
    if (/nsclc|non[- ]small[- ]cell/i.test(query)) {
      conditions.push({ name: 'Non-Small Cell Lung Cancer', type: 'cancer' });
    } else if (/sclc|small[- ]cell/i.test(query)) {
      conditions.push({ name: 'Small Cell Lung Cancer', type: 'cancer' });
    } else if (/lung\s+cancer/i.test(query)) {
      conditions.push({ name: 'Lung Cancer', type: 'cancer' });
    }
    
    return conditions;
  }
  
  /**
   * Simple marker extraction for fallback
   */
  private extractSimpleMarkers(query: string): Array<{ gene: string; mutation?: string }> {
    const markers: Array<{ gene: string; mutation?: string }> = [];
    
    const markerMatch = query.match(/\b(KRAS|EGFR|ALK|ROS1|BRAF)\s*(G12C|G12D|L858R|T790M)?/gi);
    if (markerMatch) {
      markerMatch.forEach(match => {
        const parts = match.split(/\s+/);
        markers.push({
          gene: parts[0].toUpperCase(),
          mutation: parts[1]?.toUpperCase(),
        });
      });
    }
    
    return markers;
  }
}

// Export singleton instance
export const aiQueryUnderstanding = new AIQueryUnderstanding();
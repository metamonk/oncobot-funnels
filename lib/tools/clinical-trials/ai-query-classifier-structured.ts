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
      conversationContext?: {
        messages: any[];
        previousTrialIds: string[];
      };
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
      hasLocation: !!context?.userLocation,
      hasPreviousTrials: (context?.conversationContext?.previousTrialIds?.length || 0) > 0 
    });
    
    const startTime = Date.now();
    
    try {
      const systemPrompt = this.buildSystemPrompt(context, query);
      
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
      biomarkers: classification.medical.biomarkers,
      locations: [
        ...classification.location.cities,
        ...classification.location.states,
      ],
      drugs: classification.medical.drugs,
      treatments: [],  // Could be populated from interventions if available
      stages: classification.medical.stage ? [classification.medical.stage] : [],
      otherMedicalTerms: []  // Could be populated from additional terms
    };
    builder.withExtractedEntities(entities);
    
    // Map inferred intent to proper structure
    // Map search type to primary goal
    let primaryGoal: InferredIntent['primaryGoal'] = 'find_trials';
    if (classification.searchType === 'nct_lookup') {
      primaryGoal = 'specific_trial';
    } else if (classification.intent.primary.includes('eligibility')) {
      primaryGoal = 'check_eligibility';
    } else if (classification.intent.primary.includes('info')) {
      primaryGoal = 'get_info';
    }
    
    // Determine specificity based on entities
    let specificity: InferredIntent['specificity'] = 'broad';
    if (classification.identifiers.nctIds.length > 0) {
      specificity = 'very_specific';
    } else if (classification.medical.mutations.length > 0 || classification.medical.drugs.length > 0) {
      specificity = 'moderately_specific';
    }
    
    const inferredIntent: InferredIntent = {
      primaryGoal,
      specificity,
      urgency: 'researching',  // Default to researching
      knowledgeLevel: 'patient',  // Default to patient
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
    
    // Set profile influence
    const profileInfluence = this.determineProfileInfluence(classification, context?.healthProfile);
    builder.withProfileInfluence(profileInfluence);
    
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
  private buildSystemPrompt(context?: any, query?: string): string {
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
    
    // Add conversation context for continuation queries
    if (context?.conversationContext) {
      const { previousTrialIds, messages } = context.conversationContext;
      
      // Check if this is a continuation query
      const continuationPatterns = [
        'more', 'else', 'other', 'different', 'additional',
        'what about', 'any', 'show me', 'continue'
      ];
      
      const lowerQuery = (query || '').toLowerCase();
      const isContinuation = continuationPatterns.some(pattern => lowerQuery.includes(pattern));
      
      if (isContinuation && previousTrialIds.length > 0) {
        prompt += `

IMPORTANT: This appears to be a continuation query in an ongoing conversation.
The user has already seen ${previousTrialIds.length} trials.

For continuation queries like "show me more" or "any other trials":
- The search intent should remain similar to the previous search
- Consider this as looking for ADDITIONAL trials, not repeating the same ones
- If the query mentions a specific location (e.g., "what about Boston?"), that's a location refinement
- If the query mentions specific criteria (e.g., "any phase 1?"), that's a criteria refinement`;
        
        // Add recent context if available
        const recentMessages = messages.slice(-2);
        if (recentMessages.length > 0) {
          const previousQuery = recentMessages.find(m => m.role === 'user')?.content;
          if (previousQuery) {
            prompt += `

Previous query: "${previousQuery}"
This helps understand the context of the current query.`;
          }
        }
      }
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
   * Map strategy to execution plan format
   */
  private mapStrategyToExecutionPlan(strategy: string): ExecutionPlan['primaryStrategy'] {
    const mapping: Record<string, ExecutionPlan['primaryStrategy']> = {
      'direct_nct': 'nct_direct',
      'location_first': 'location_based',
      'condition_first': 'condition_based',
      'profile_first': 'profile_based',
      'parallel_search': 'broad',  // Map parallel to broad
      'broad_then_filter': 'broad',  // Map to broad
    };
    // Default to 'broad' if no mapping found
    return mapping[strategy] || 'broad';
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
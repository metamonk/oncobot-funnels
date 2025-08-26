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
    // AI-driven geographic expansion strategy
    searchStrategy: z.object({
      primaryLocation: z.string().nullable().describe('Main city/location from query'),
      suggestedAdditionalCities: z.array(z.string()).describe('AI-reasoned cities to include based on medical geography and context'),
      estimatedReasonableRadius: z.number().describe('AI-reasoned search radius based on full context (miles)'),
      rationale: z.string().describe('AI explanation of geographic search strategy'),
      expansionConfidence: z.number().min(0).max(1).describe('Confidence in the expansion strategy (0-1)'),
    }).nullable().describe('AI-reasoned geographic search strategy based on disease context and user intent'),
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
    // NEW: Intelligent query context understanding
    queryScope: z.enum(['personal', 'research', 'other_person', 'general'])
      .describe('Is this about user\'s own condition, research, someone else, or general info?'),
    useProfileData: z.boolean()
      .describe('Should user profile data be included in search based on query intent?'),
    profileRelevance: z.number().min(0).max(1)
      .describe('How relevant is the user profile to this query (0=not relevant, 1=highly relevant)?'),
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
      // Include the full location object with AI-driven search strategy
      location: {
        cities: classification.location.cities,
        states: classification.location.states,
        countries: classification.location.countries,
        isNearMe: classification.location.isNearMe,
        radius: classification.location.radius,
        coordinates: classification.location.coordinates,
        searchStrategy: classification.location.searchStrategy
      },
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
7. CRITICAL: Determine query scope and profile relevance

Important guidelines:
- Be comprehensive - extract everything that could be relevant
- Recognize medical abbreviations (NSCLC, SCLC, CRC, HCC, etc.)
- Detect molecular markers (KRAS G12C, EGFR, ALK, PD-L1, etc.)
- Identify drug names (pembrolizumab, nivolumab, sotorasib, etc.)

CRITICAL LOCATION EXTRACTION:
- ALWAYS extract city names (e.g., Chicago, Boston, New York, Los Angeles)
- ALWAYS extract state names or abbreviations (IL, CA, NY, TX, etc.)
- Common location patterns: "in [city]", "near [city]", "[city] area", "around [city]"
- "near me" should set isNearMe to true
- Examples:
  * "trials in Chicago" → cities: ["Chicago"], states: ["Illinois"]
  * "KRAS G12C trials chicago" → cities: ["Chicago"], states: ["Illinois"]
  * "Boston MA trials" → cities: ["Boston"], states: ["Massachusetts"]
  * "trials near me" → isNearMe: true

- NCT IDs follow pattern: NCT followed by 8 digits
- Default search radius is 300 miles unless specified

INTELLIGENT GEOGRAPHIC SEARCH STRATEGY:
When location is mentioned, reason about appropriate geographic expansion:

Consider ALL of these factors together (not rigid rules):
- Disease rarity and specialized treatment requirements
- Query language indicating geographic flexibility ("near", "around", "area", "anywhere")
- Stage/severity implications for travel willingness
- Mutation rarity requiring specialized centers
- Major medical center distributions and specializations

Generate searchStrategy with:
- primaryLocation: The main city mentioned or inferred
- suggestedAdditionalCities: Additional locations to include (MIX of states AND cities)
  * CRITICAL: Include BOTH state names AND specific cities in this array:
    - Add the HOME STATE (e.g., for Chicago, add "Illinois" to the array)
    - Add SURROUNDING STATES (e.g., "Wisconsin", "Indiana", "Iowa")
    - Add specific MAJOR MEDICAL CENTERS by city (e.g., "Rochester" for Mayo)
  * The array should contain strings like: ["Illinois", "Wisconsin", "Indiana", "Rochester"]
  * THINK INTELLIGENTLY about geographic expansion:
    - For a city query, include the state (e.g., Chicago → add "Illinois")
    - For rare/complex conditions, add surrounding states (e.g., "Wisconsin", "Indiana", "Iowa")
    - For specialized mutations, include specific cancer centers (e.g., "Rochester" for Mayo)
  * State-level searching advantages:
    - Automatically includes ALL suburbs and cities in the state
    - Captures community cancer centers and satellite facilities
    - No need to enumerate individual suburbs
    - More comprehensive and elegant solution
  * DO NOT use fixed lists - reason dynamically based on:
    - Disease rarity and complexity
    - Treatment specialization requirements  
    - Regional medical infrastructure
    - Patient travel considerations
- estimatedReasonableRadius: Your reasoning about appropriate search distance
  * State-level search effectively covers 200-400 mile radius
  * Surrounding states extend coverage for rare conditions
  * Balance comprehensive coverage with relevance
- rationale: Explain your geographic reasoning including state-level strategy
- expansionConfidence: How confident you are in the expansion strategy

Examples of INTELLIGENT STATE-LEVEL reasoning (adapt based on context):
- "KRAS G12C trials Chicago" with Stage IV NSCLC → 
  suggestedAdditionalCities: ["Illinois", "Wisconsin", "Indiana", "Rochester"]
  Rationale: "Illinois captures all Chicago metro trials, Wisconsin and Indiana for regional coverage, Rochester for Mayo's KRAS expertise"
  
- "trials near Boston" with common cancer → 
  suggestedAdditionalCities: ["Massachusetts", "Rhode Island", "New Hampshire", "Connecticut"]
  Rationale: "Massachusetts covers entire Boston metro area, nearby New England states for regional options"
  
- "rare sarcoma trials anywhere" → 
  suggestedAdditionalCities: ["Texas", "Minnesota", "New York", "Massachusetts", "Houston", "Rochester", "Boston"]
  Rationale: "Major states with cancer centers plus specific cities for NCI-designated comprehensive cancer centers"

INTELLIGENT QUERY SCOPE DETECTION:
Determine the queryScope based on these patterns:

'personal' - Query is about the user's own condition:
- Uses personal pronouns: "my", "I have", "I was diagnosed", "for me"
- Asks about eligibility: "am I eligible", "can I participate"
- References personal health: "my cancer", "my diagnosis", "my treatment"
- General queries when user has a health profile (e.g., "find trials")

'research' - Query is for research/educational purposes:
- Academic language: "what is", "how does", "explain", "mechanism of"
- General information: "types of trials", "phases of trials"
- Comparative: "difference between", "compare"
- No personal context or pronouns

'other_person' - Query is about someone else:
- References others: "my mother", "my friend", "a patient with"
- Third person pronouns: "he has", "she was diagnosed", "they have"
- Asking on behalf of someone else

'general' - General clinical trial information:
- Broad queries without personal context
- No specific medical conditions mentioned
- General exploration: "what trials exist", "latest trials"

PROFILE RELEVANCE SCORING (0.0 to 1.0):
- 1.0: Query directly relates to user's condition (personal queries with matching conditions)
- 0.7-0.9: Query likely benefits from profile (general trial searches, location queries)
- 0.3-0.6: Query partially relates (some overlap with profile)
- 0.1-0.2: Query minimally relates (different condition but same category)
- 0.0: Query unrelated to profile (research, other person, different condition)

USE PROFILE DATA DECISION:
- Set useProfileData to TRUE when:
  * queryScope is 'personal'
  * Query is general but user has relevant profile
  * Query mentions "trials for me" or similar
  * profileRelevance > 0.5

- Set useProfileData to FALSE when:
  * queryScope is 'research' or 'other_person'
  * Query explicitly mentions different condition than profile
  * Query is about trial methodology/process
  * profileRelevance < 0.3`;

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

CRITICAL CONTINUATION QUERY HANDLING:
This is a continuation query in an ongoing conversation.
The user has already seen ${previousTrialIds.length} trials and expects consistency.

PRESERVATION RULES for continuation queries:
1. For "show me more", "show me the others", "continue", "next batch":
   - PRESERVE EXACT SEARCH PARAMETERS from the previous query
   - DO NOT add new terms like "lung cancer" if they weren't in the original
   - DO NOT change the query text at all - keep it IDENTICAL
   - MAINTAIN the same geographic expansion (same cities, same suburbs)
   - This is PAGINATION, not a new search
   - CRITICAL: Keep medical.conditions EXACTLY as they were
   - If original had medical.conditions = [], keep it EMPTY
   - If original had medical.mutations = ["KRAS_G12C"], keep ONLY that
   
2. For location refinements ("what about suburbs?", "any in Aurora?"):
   - ADD the new locations to existing search, don't replace
   - Keep all original cities and ADD suburban areas
   - This EXPANDS the search area, doesn't change it
   
3. For criteria refinements ("any phase 1?", "closer to home?"):
   - Add new criteria AS FILTERS, not query modifications
   - Preserve the base query exactly as it was
   
4. Geographic consistency is CRITICAL:
   - If you suggested Chicago suburbs before, include them again
   - Don't change from "Chicago, Aurora, Naperville" to just "Chicago, Milwaukee"
   - Users expect the SAME total trial count for continuation
   - PRESERVE THE EXACT SAME location.searchStrategy.suggestedAdditionalCities
   - If you had 9 cities before (Chicago + 8 others), keep ALL 9 cities
   - Example: If original had [Aurora, Naperville, Joliet, Evanston, Elgin, Milwaukee, Madison, Indianapolis, Rochester]
     Then continuation MUST have the SAME list, not a subset`;
        
        // Add recent context if available
        const recentMessages = messages.slice(-2);
        if (recentMessages.length > 0) {
          const previousQuery = recentMessages.find((m: any) => m.role === 'user')?.content;
          if (previousQuery) {
            prompt += `

Previous query: "${previousQuery}"

CRITICAL: For continuation queries, you should:
1. Use THE EXACT SAME medical terms from the previous query
2. Use THE EXACT SAME geographic expansion (all the same cities/suburbs)
3. Preserve any specific markers or conditions mentioned
4. The ONLY thing that changes is pagination/offset, NOT the search itself
5. DO NOT add "lung cancer" if it wasn't in the original query
6. For "show me the others" after "KRAS G12C trials Chicago":
   - medical.conditions should be EMPTY [] (don't add "lung cancer") 
   - medical.cancerTypes should be EMPTY [] (cancer type comes from profile)
   - medical.mutations should be ["KRAS_G12C"] (preserved from original)
   - location.searchStrategy.suggestedAdditionalCities should be IDENTICAL to previous
   - If previous included states like ["Illinois", "Wisconsin", "Indiana"], keep ALL the same states
   - If previous had specific cities like ["Chicago", "Rochester"], keep those too
   - The enriched query will add NSCLC from profile automatically

Remember: Users seeing "12 trials found" expect to see all 12 across pages, not 11 or 13!`;
          }
        }
      }
    }
    
    prompt += `

Classification rules:
- 'nct_lookup': Query contains NCT ID(s)
- 'location_based': Primary focus is on location OR location is explicitly mentioned
- 'condition_based': Primary focus is on medical condition without location
- 'drug_based': Asking about specific drug/treatment
- 'mutation_based': Focused on molecular markers
- 'profile_based': General query relying on user profile
- 'combined': BOTH location AND medical terms present (e.g., "KRAS G12C trials Chicago")

IMPORTANT: If query has BOTH medical terms AND location, classify as 'combined'!
Examples:
- "KRAS G12C trials chicago" → 'combined' (has mutation + location)
- "lung cancer trials in Boston" → 'combined' (has condition + location)
- "trials in Chicago" → 'location_based' (only location)
- "KRAS G12C trials" → 'mutation_based' (only mutation)

Strategy selection:
- Use 'direct_nct' for NCT ID lookups
- Use 'location_first' when location is explicitly mentioned (including combined queries)
- Use 'condition_first' when medical condition is primary WITHOUT location
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
    
    // NEW: Respect AI's decision about using profile data
    const shouldUseProfile = classification.intent.useProfileData;
    
    if (shouldUseProfile && profile?.cancerType) {
      // Only include profile data when AI determines it's relevant
      const hasMutations = classification.medical.mutations.length > 0;
      const hasConditions = classification.medical.conditions.length > 0 || 
                           classification.medical.cancerTypes.length > 0;
      
      // Add cancer type when:
      // 1. Query has mutations (e.g., "KRAS G12C") - needs context
      // 2. Query has no conditions/cancer types specified - general query
      if (hasMutations || !hasConditions) {
        if (!classification.medical.cancerTypes.includes(profile.cancerType)) {
          parts.push(profile.cancerType);
        }
      }
    }
    
    // Add cancer types from query
    parts.push(...classification.medical.cancerTypes);
    
    // Add conditions
    parts.push(...classification.medical.conditions);
    
    // Add mutations (convert underscores to spaces)
    const formattedMutations = classification.medical.mutations.map(m => 
      m.replace(/_/g, ' ')
    );
    parts.push(...formattedMutations);
    
    // Add drugs
    parts.push(...classification.medical.drugs);
    
    // Remove duplicates while preserving order
    const uniqueParts = [...new Set(parts)];
    
    return uniqueParts.join(' ').trim() || 'cancer';
  }
  
  /**
   * Determine profile influence level
   */
  private determineProfileInfluence(
    classification: StructuredQueryClassification,
    profile?: HealthProfile | null
  ): { level: ProfileInfluence; reason: string; disableProfile?: boolean } {
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
    
    // NEW: Use intelligent query scope detection
    const { queryScope, useProfileData, profileRelevance } = classification.intent;
    
    // If AI determined not to use profile data
    if (!useProfileData) {
      return {
        level: ProfileInfluence.DISABLED,
        reason: `Query scope is '${queryScope}' - profile not relevant`,
        disableProfile: true
      };
    }
    
    // Map profile relevance score to influence level
    if (profileRelevance >= 0.9) {
      return {
        level: ProfileInfluence.PRIMARY,
        reason: `Personal query highly relevant to profile (relevance: ${profileRelevance})`
      };
    } else if (profileRelevance >= 0.7) {
      return {
        level: ProfileInfluence.ENHANCED,
        reason: `Query benefits from profile context (relevance: ${profileRelevance})`
      };
    } else if (profileRelevance >= 0.5) {
      return {
        level: ProfileInfluence.CONTEXTUAL,
        reason: `Query partially relates to profile (relevance: ${profileRelevance})`
      };
    } else if (profileRelevance >= 0.3) {
      return {
        level: ProfileInfluence.BACKGROUND,
        reason: `Query has minimal profile relevance (relevance: ${profileRelevance})`
      };
    }
    
    // Default to disabled if relevance is very low
    return {
      level: ProfileInfluence.DISABLED,
      reason: `Query unrelated to profile (relevance: ${profileRelevance})`,
      disableProfile: true
    };
  }
}

// Export singleton instance
export const structuredQueryClassifier = new StructuredQueryClassifier();
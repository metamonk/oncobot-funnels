/**
 * Conversational Intelligence System
 * 
 * Unified query processing that treats every query equally with full conversation context.
 * No distinction between initial and continuation queries - all get the same intelligent analysis.
 * 
 * Core Principle: Every query is just a query in the context of a conversation.
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { oncobot } from '../../../ai/providers';
import type { ClinicalTrial, HealthProfile } from './types';
import { debug, DebugCategory } from './debug';
import { QueryContext, QueryContextBuilder } from './query-context';

/**
 * Conversation memory extracted from previous interactions
 */
export interface ConversationMemory {
  shownTrialIds: Set<string>;
  discussedLocations: string[];
  mentionedConditions: string[];
  exploredMutations: string[];
  userPreferences: {
    preferredDistance?: number;
    preferredPhases?: number[];
    avoidedCriteria?: string[];
  };
  queryProgression: string[];
  lastSearchStrategy?: string;
  totalTrialsShown: number;
}

/**
 * Enhanced schema that includes conversation awareness
 */
const ConversationAwareSchema = z.object({
  // Current query understanding
  currentIntent: z.object({
    searchType: z.enum([
      'nct_lookup',
      'location_based',
      'condition_based',
      'profile_based',
      'continuation',
      'refinement',
      'exploration',
      'clarification',
    ]).describe('Type of search intent, aware of conversation context'),
    
    continuationType: z.enum([
      'more_similar',      // User wants more of the same type
      'geographic_expand', // User wants to explore other locations
      'criteria_modify',   // User wants to change search criteria
      'phase_explore',     // User wants different trial phases
      'novelty_seek',      // User wants different/new results
      'specific_inquiry',  // User asking about specific aspect
      'not_continuation',  // This is a new search, not continuation
    ]).nullable().describe('If continuation, what type of continuation'),
    
    implicitPreferences: z.array(z.string()).describe('Preferences inferred from conversation'),
    explicitRequests: z.array(z.string()).describe('Explicit requests in current query'),
  }),

  // Medical and location entities (same as before but context-aware)
  entities: z.object({
    conditions: z.array(z.string()),
    cancerTypes: z.array(z.string()),
    mutations: z.array(z.string()),
    drugs: z.array(z.string()),
    biomarkers: z.array(z.string()),
    locations: z.array(z.string()),
    nctIds: z.array(z.string()),
  }),

  // Strategy composition (not selection)
  strategyComposition: z.object({
    strategies: z.array(z.enum([
      'profile_search',
      'location_search',
      'condition_search',
      'mutation_search',
      'nct_lookup',
      'broad_search',
      'novelty_filter',
      'geographic_expansion',
      'phase_variation',
      'eligibility_relaxation',
    ])).describe('Multiple strategies to compose together'),
    
    weights: z.record(z.string(), z.number()).describe('Weight for each strategy (0-1)'),
    
    filters: z.object({
      excludeShownTrials: z.boolean(),
      preferNewLocations: z.boolean(),
      diversifyResults: z.boolean(),
      maintainRelevance: z.boolean(),
    }),
    
    optimizations: z.array(z.string()).describe('Optimization opportunities based on conversation'),
  }),

  // Conversation understanding
  conversationAnalysis: z.object({
    topicEvolution: z.string().describe('How the conversation topic has evolved'),
    userLearning: z.string().describe('What the user has learned so far'),
    nextLikelyQuestion: z.string().describe('Predicted next question based on pattern'),
    frustrationIndicators: z.array(z.string()).describe('Signs of user frustration if any'),
    satisfactionIndicators: z.array(z.string()).describe('Signs of satisfaction if any'),
  }),

  // Execution plan
  executionPlan: z.object({
    enrichedQuery: z.string().describe('Query enriched with all context'),
    searchRadius: z.number().describe('Search radius based on conversation'),
    maxResults: z.number().describe('How many results to fetch'),
    rankingStrategy: z.enum([
      'relevance_first',
      'novelty_first',
      'diversity_balanced',
      'location_proximity',
      'phase_specific',
    ]),
    shouldExplain: z.boolean().describe('Whether to explain the search strategy to user'),
  }),

  // Confidence and reasoning
  meta: z.object({
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    conversationDepth: z.number().describe('How deep into conversation we are'),
    contextUtilization: z.number().min(0).max(1).describe('How much context was used'),
  }),
});

type ConversationAwareClassification = z.infer<typeof ConversationAwareSchema>;

/**
 * Extract conversation memory from message history
 */
function extractConversationMemory(messages: any[]): ConversationMemory {
  const memory: ConversationMemory = {
    shownTrialIds: new Set<string>(),
    discussedLocations: [],
    mentionedConditions: [],
    exploredMutations: [],
    userPreferences: {},
    queryProgression: [],
    totalTrialsShown: 0,
  };

  // Extract information from tool calls and responses
  messages.forEach(msg => {
    // Extract queries
    if (msg.role === 'user') {
      memory.queryProgression.push(msg.content);
    }

    // Extract shown trials from assistant responses
    if (msg.role === 'assistant' && msg.toolInvocations) {
      msg.toolInvocations.forEach((invocation: any) => {
        if (invocation.toolName === 'clinical_trials' && invocation.result?.matches) {
          invocation.result.matches.forEach((match: any) => {
            if (match.trial?.nctId) {
              memory.shownTrialIds.add(match.trial.nctId);
              memory.totalTrialsShown++;
            }
            // Extract locations from results
            if (match.trial?.locations) {
              match.trial.locations.forEach((loc: any) => {
                if (loc.city && !memory.discussedLocations.includes(loc.city)) {
                  memory.discussedLocations.push(loc.city);
                }
              });
            }
          });
          
          // Track search strategy used
          if (invocation.result?.metadata?.strategy) {
            memory.lastSearchStrategy = invocation.result.metadata.strategy;
          }
        }
      });
    }
  });

  return memory;
}

/**
 * Conversational Intelligence Engine
 */
export class ConversationalIntelligence {
  /**
   * Process query with full conversation awareness
   */
  async processWithContext(
    query: string,
    messages: any[],
    healthProfile?: HealthProfile | null,
    userLocation?: { latitude: number; longitude: number } | null
  ): Promise<QueryContext> {
    const startTime = Date.now();
    
    // Extract conversation memory
    const memory = extractConversationMemory(messages);
    
    debug.log(DebugCategory.QUERY, '[ConversationalIntelligence] Processing with context', {
      query,
      conversationDepth: memory.queryProgression.length,
      trialsShown: memory.totalTrialsShown,
      hasProfile: !!healthProfile,
      hasLocation: !!userLocation,
    });

    try {
      // Build comprehensive system prompt
      const systemPrompt = this.buildSystemPrompt(healthProfile, memory);
      
      // Generate classification with conversation awareness
      const result = await generateObject({
        model: oncobot.languageModel('oncobot-4o-mini'),
        schema: ConversationAwareSchema,
        prompt: this.buildUserPrompt(query, memory),
        system: systemPrompt,
        temperature: 0.1, // Slight variation for natural conversation
        maxTokens: 3000,
      });

      const classification = result.object;
      
      debug.log(DebugCategory.QUERY, '[ConversationalIntelligence] Classification complete', {
        currentIntent: classification.currentIntent.searchType,
        continuationType: classification.currentIntent.continuationType,
        strategies: classification.strategyComposition.strategies,
        confidence: classification.meta.confidence,
        timeMs: Date.now() - startTime,
      });

      // Build QueryContext from classification
      return this.buildQueryContext(query, classification, healthProfile, userLocation, memory);
      
    } catch (error) {
      debug.error(DebugCategory.ERROR, '[ConversationalIntelligence] Processing failed', error);
      // Fallback to simple processing
      return this.buildFallbackContext(query, healthProfile, userLocation, memory);
    }
  }

  /**
   * Build system prompt with conversation awareness
   */
  private buildSystemPrompt(
    healthProfile: HealthProfile | null,
    memory: ConversationMemory
  ): string {
    let prompt = `You are an intelligent clinical trials search assistant with full conversation awareness.

CRITICAL: Treat every query equally - there's no difference between "first" and "continuation" queries.
Every query exists in the context of a conversation and should be understood holistically.

Your task:
1. Understand the current query in the context of the entire conversation
2. Identify if this is exploring new areas or continuing previous exploration
3. Compose multiple search strategies rather than selecting one
4. Consider what trials have already been shown to avoid repetition
5. Infer preferences from the conversation pattern
6. Predict user needs based on conversation trajectory

Conversation Context:
- Queries so far: ${memory.queryProgression.length}
- Trials already shown: ${memory.totalTrialsShown}
- Locations discussed: ${memory.discussedLocations.join(', ') || 'none'}
- Previous strategy: ${memory.lastSearchStrategy || 'none'}
`;

    if (healthProfile) {
      prompt += `
Patient Profile:
- Cancer Type: ${healthProfile.cancerType}
- Stage: ${healthProfile.diseaseStage}
- Mutations: ${JSON.stringify(healthProfile.molecularMarkers || {})}
- Age: ${healthProfile.age || 'unknown'}

IMPORTANT: The profile should influence ALL searches, not dominate them.
`;
    }

    if (memory.shownTrialIds.size > 0) {
      prompt += `
Already Shown Trials (DO NOT repeat unless specifically requested):
${Array.from(memory.shownTrialIds).slice(0, 10).join(', ')}${memory.shownTrialIds.size > 10 ? '...' : ''}
`;
    }

    prompt += `
Strategy Composition Guidelines:
- Don't just pick one strategy - COMPOSE multiple strategies with weights
- If user says "more", consider: are they wanting more similar? different? broader?
- If user mentions a location, ADD location search to existing strategies
- If user asks about eligibility, ADD eligibility checking to other strategies
- Strategies should complement each other, not replace each other

Understanding Continuation:
- "Show me more" could mean: more similar, different options, wider search, or specific refinement
- "What about X?" usually means: add X as a filter/criteria to existing search
- "Any others?" often means: show different trials, not just next batch
- Frustrated language suggests current approach isn't working - try different strategies

Output Guidelines:
- Be specific about WHY you're composing strategies this way
- Explain the conversation evolution clearly
- Set appropriate weights based on inferred importance
- Always consider novelty (not showing same trials again)
`;

    return prompt;
  }

  /**
   * Build user prompt with conversation context
   */
  private buildUserPrompt(query: string, memory: ConversationMemory): string {
    let prompt = `Current query: "${query}"`;
    
    if (memory.queryProgression.length > 0) {
      prompt += `\n\nPrevious queries in this conversation:`;
      memory.queryProgression.slice(-3).forEach((q, i) => {
        prompt += `\n${i + 1}. "${q}"`;
      });
    }
    
    if (memory.totalTrialsShown > 0) {
      prompt += `\n\nContext: User has already seen ${memory.totalTrialsShown} trials in this conversation.`;
    }
    
    return prompt;
  }

  /**
   * Build QueryContext from conversation-aware classification
   */
  private buildQueryContext(
    query: string,
    classification: ConversationAwareClassification,
    healthProfile: HealthProfile | null,
    userLocation: { latitude: number; longitude: number } | null,
    memory: ConversationMemory
  ): QueryContext {
    const builder = new QueryContextBuilder(query);
    
    // Set user context
    if (healthProfile) {
      builder.withHealthProfile(healthProfile);
    }
    
    if (userLocation) {
      builder.withUserLocation({
        coordinates: userLocation,
        city: null,
        state: null,
        country: 'US',
        radius: classification.executionPlan.searchRadius,
      });
    }
    
    // Add extracted entities
    builder.withExtractedEntities({
      nctIds: classification.entities.nctIds,
      conditions: classification.entities.conditions,
      cancerTypes: classification.entities.cancerTypes,
      mutations: classification.entities.mutations,
      biomarkers: classification.entities.biomarkers,
      locations: classification.entities.locations,
      drugs: classification.entities.drugs,
      treatments: [],
      stages: [],
      otherMedicalTerms: [],
    });
    
    // Set inferred intent with conversation awareness
    builder.withInferredIntent({
      primaryGoal: this.mapIntentToGoal(classification.currentIntent.searchType),
      specificity: this.determineSpecificity(classification),
      urgency: 'researching',
      knowledgeLevel: memory.queryProgression.length > 3 ? 'informed' : 'patient',
      confidence: classification.meta.confidence,
    });
    
    // Build execution plan with strategy composition
    const executionPlan = {
      primaryStrategy: this.getPrimaryStrategy(classification.strategyComposition.strategies),
      fallbackStrategies: this.getFallbackStrategies(classification.strategyComposition.strategies),
      searchParams: {
        baseQuery: query,
        enrichedQuery: classification.executionPlan.enrichedQuery,
        filters: {
          location: classification.entities.locations[0],
          conditions: classification.entities.conditions,
          mutations: classification.entities.mutations,
          drugs: classification.entities.drugs,
          radius: classification.executionPlan.searchRadius,
          excludeNctIds: Array.from(memory.shownTrialIds),
        },
        maxResults: classification.executionPlan.maxResults,
      },
      validations: {
        checkEligibility: healthProfile !== null,
        verifyLocations: classification.entities.locations.length > 0,
        confirmRecruitmentStatus: true,
      },
      composition: {
        strategies: classification.strategyComposition.strategies,
        weights: classification.strategyComposition.weights,
        filters: classification.strategyComposition.filters,
      },
    };
    
    builder.withExecutionPlan(executionPlan as any);
    
    // Add conversation tracking
    builder.addDecision(
      'ConversationalIntelligence',
      `Composed ${classification.strategyComposition.strategies.length} strategies based on conversation context`,
      classification.meta.confidence,
      classification.meta.reasoning
    );
    
    // Add metadata about conversation
    const contextWithMeta = builder.build();
    contextWithMeta.metadata.conversationDepth = memory.queryProgression.length;
    contextWithMeta.metadata.trialsAlreadyShown = memory.totalTrialsShown;
    contextWithMeta.metadata.continuationType = classification.currentIntent.continuationType;
    contextWithMeta.metadata.conversationAnalysis = classification.conversationAnalysis;
    
    return contextWithMeta;
  }

  /**
   * Map intent type to primary goal
   */
  private mapIntentToGoal(searchType: string): 'find_trials' | 'specific_trial' | 'check_eligibility' | 'get_info' {
    switch (searchType) {
      case 'nct_lookup':
        return 'specific_trial';
      case 'clarification':
        return 'get_info';
      default:
        return 'find_trials';
    }
  }

  /**
   * Determine specificity based on classification
   */
  private determineSpecificity(classification: ConversationAwareClassification): 'broad' | 'moderately_specific' | 'very_specific' {
    if (classification.entities.nctIds.length > 0) {
      return 'very_specific';
    }
    if (classification.entities.mutations.length > 0 || classification.entities.drugs.length > 0) {
      return 'moderately_specific';
    }
    return 'broad';
  }

  /**
   * Get primary strategy from composition
   */
  private getPrimaryStrategy(strategies: string[]): string {
    // The first strategy is typically the most important
    const strategyMap: Record<string, string> = {
      'profile_search': 'profile_first',
      'location_search': 'location_first',
      'condition_search': 'condition_first',
      'nct_lookup': 'direct_nct',
      'broad_search': 'broad_then_filter',
    };
    
    return strategyMap[strategies[0]] || 'parallel_search';
  }

  /**
   * Get fallback strategies
   */
  private getFallbackStrategies(strategies: string[]): string[] {
    return strategies.slice(1).map(s => {
      const strategyMap: Record<string, string> = {
        'profile_search': 'profile_based',
        'location_search': 'location_based',
        'condition_search': 'condition_based',
        'geographic_expansion': 'expand_geography',
        'phase_variation': 'vary_phases',
      };
      return strategyMap[s] || s;
    });
  }

  /**
   * Build fallback context when AI fails
   */
  private buildFallbackContext(
    query: string,
    healthProfile: HealthProfile | null,
    userLocation: { latitude: number; longitude: number } | null,
    memory: ConversationMemory
  ): QueryContext {
    const builder = new QueryContextBuilder(query);
    
    if (healthProfile) {
      builder.withHealthProfile(healthProfile);
    }
    
    if (userLocation) {
      builder.withUserLocation({
        coordinates: userLocation,
        city: null,
        state: null,
        country: 'US',
        radius: 300,
      });
    }
    
    // Simple intent for fallback
    builder.withInferredIntent({
      primaryGoal: 'find_trials',
      specificity: 'broad',
      urgency: 'researching',
      knowledgeLevel: 'patient',
      confidence: 0.5,
    });
    
    // Simple execution plan
    builder.withExecutionPlan({
      primaryStrategy: healthProfile ? 'profile_first' : 'broad_then_filter',
      fallbackStrategies: ['parallel_search'],
      searchParams: {
        baseQuery: query,
        enrichedQuery: query,
        filters: {
          excludeNctIds: Array.from(memory.shownTrialIds),
        },
        maxResults: 25,
      },
      validations: {
        checkEligibility: false,
        verifyLocations: false,
        confirmRecruitmentStatus: true,
      },
    } as any);
    
    return builder.build();
  }
}

// Export singleton instance
export const conversationalIntelligence = new ConversationalIntelligence();
/**
 * Query Context System - Preserves all information throughout the search pipeline
 * 
 * This is the core architectural improvement that ensures no information is lost
 * as we process queries through classification, routing, execution, and compression.
 */

import { HealthProfile, StudyLocation } from './types';

/**
 * Profile influence levels for graduated personalization
 */
export enum ProfileInfluence {
  PRIMARY = 1.0,     // Full adaptive pipeline (eligibility queries)
  ENHANCED = 0.7,    // Filter + assess + rank (condition queries)  
  CONTEXTUAL = 0.5,  // Assess + indicators (location queries)
  BACKGROUND = 0.3,  // Just indicators (broad queries)
  DISABLED = 0.0     // Explicit opt-out
}

/**
 * User's geographic context
 */
export interface UserLocation {
  city?: string;
  state?: string;
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  searchRadius?: number; // in miles
  explicitlyRequested?: boolean; // Did user explicitly mention location?
}

/**
 * Extracted entities from the query
 */
export interface ExtractedEntities {
  // Locations mentioned in query
  locations: string[];
  
  // Medical conditions
  conditions: string[];
  cancerTypes: string[];
  
  // Molecular/genetic information
  mutations: string[];
  biomarkers: string[];
  
  // Specific trial IDs
  nctIds: string[];
  
  // Drugs/treatments
  drugs: string[];
  treatments: string[];
  
  // Disease stages
  stages: string[];
  
  // Other medical terms
  otherMedicalTerms: string[];
}

/**
 * Inferred information about the query
 */
export interface InferredIntent {
  // User's primary goal
  primaryGoal: 'find_trials' | 'check_eligibility' | 'get_info' | 'explore_options' | 'specific_trial';
  
  // How specific is the query?
  specificity: 'very_specific' | 'moderately_specific' | 'broad' | 'exploratory';
  
  // Urgency level
  urgency: 'immediate' | 'researching' | 'planning' | 'general_interest';
  
  // User's likely knowledge level
  knowledgeLevel: 'patient' | 'caregiver' | 'medical_professional' | 'researcher';
  
  // Confidence in our inference (0-1)
  confidence: number;
}

/**
 * Search execution plan
 */
export interface ExecutionPlan {
  // Primary search strategy
  primaryStrategy: 'profile_based' | 'location_based' | 'nct_direct' | 'condition_based' | 'broad';
  
  // Fallback strategies if primary doesn't yield enough results
  fallbackStrategies: string[];
  
  // Specific search parameters
  searchParams: {
    baseQuery: string;
    enrichedQuery?: string;
    filters: Record<string, any>;
    sortBy?: string;
    maxResults?: number;
  };
  
  // Validations to perform
  validations: {
    checkEligibility?: boolean;
    verifyLocations?: boolean;
    confirmRecruitmentStatus?: boolean;
    validateMolecularMatch?: boolean;
  };
}

/**
 * Session context for learning
 */
export interface SessionContext {
  // Previous queries in this session
  previousQueries: string[];
  
  // Trials user has viewed
  viewedTrials: string[];
  
  // User's interaction patterns
  interactionPatterns: {
    prefersNearby?: boolean;
    focusedOnSpecificMutation?: boolean;
    exploringMultipleOptions?: boolean;
  };
  
  // Session ID for tracking
  sessionId: string;
  
  // Timestamp
  timestamp: Date;
}

/**
 * Complete Query Context that flows through the entire pipeline
 */
export interface QueryContext {
  // Original user input - NEVER modified
  originalQuery: string;
  
  // Normalized query for processing
  normalizedQuery: string;
  
  // What we extracted from the query
  extracted: ExtractedEntities;
  
  // What we inferred about intent
  inferred: InferredIntent;
  
  // User's context
  user: {
    id?: string;
    location?: UserLocation;
    healthProfile?: HealthProfile;
    preferences?: {
      maxDistance?: number;
      preferredLanguage?: string;
      trialPhases?: string[];
    };
  };
  
  // Profile influence configuration
  profileInfluence: {
    level: ProfileInfluence;
    reason: string;
    disableProfile?: boolean;
  };
  
  // Session information
  session?: SessionContext;
  
  // Execution plan
  executionPlan: ExecutionPlan;
  
  // Enrichments applied
  enrichments: {
    profileEnriched: boolean;
    locationEnriched: boolean;
    mutationEnriched: boolean;
    cancerTypeExpanded: boolean;
    synonymsAdded: boolean;
  };
  
  // Metadata for tracking
  metadata: {
    createdAt: Date;
    processingTime?: number;
    pipelineVersion: string;
    classifierConfidence: number;
    routerDecision?: string;
    searchStrategiesUsed: string[];
  };
  
  // Validation results
  validation?: {
    hasValidProfile: boolean;
    hasValidLocation: boolean;
    hasSpecificIntent: boolean;
    requiresAI: boolean;
  };
  
  // For learning and improvement
  tracking: {
    contextId: string;
    experimentGroup?: string; // For A/B testing
    featuresUsed: string[];
    decisionsMade: Array<{
      component: string;
      decision: string;
      confidence: number;
      reasoning?: string;
    }>;
  };
}

/**
 * Builder class for creating QueryContext with fluent API
 */
export class QueryContextBuilder {
  private context: Partial<QueryContext> = {};
  
  constructor(query: string) {
    this.context = {
      originalQuery: query,
      normalizedQuery: query.toLowerCase().trim(),
      extracted: {
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
      },
      inferred: {
        primaryGoal: 'find_trials',
        specificity: 'broad',
        urgency: 'researching',
        knowledgeLevel: 'patient',
        confidence: 0.5
      },
      executionPlan: {
        primaryStrategy: 'broad',
        fallbackStrategies: [],
        searchParams: {
          baseQuery: query,
          filters: {}
        },
        validations: {}
      },
      enrichments: {
        profileEnriched: false,
        locationEnriched: false,
        mutationEnriched: false,
        cancerTypeExpanded: false,
        synonymsAdded: false
      },
      profileInfluence: {
        level: ProfileInfluence.DISABLED,
        reason: 'Not yet determined',
        disableProfile: false
      },
      metadata: {
        createdAt: new Date(),
        pipelineVersion: '2.0.0',
        classifierConfidence: 0,
        searchStrategiesUsed: []
      },
      tracking: {
        contextId: this.generateContextId(),
        featuresUsed: [],
        decisionsMade: []
      },
      user: {}
    };
  }
  
  private generateContextId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  withExtractedEntities(entities: Partial<ExtractedEntities>): this {
    this.context.extracted = {
      ...this.context.extracted!,
      ...entities
    };
    return this;
  }
  
  withInferredIntent(intent: Partial<InferredIntent>): this {
    this.context.inferred = {
      ...this.context.inferred!,
      ...intent
    };
    return this;
  }
  
  withUserLocation(location: UserLocation): this {
    this.context.user = {
      ...this.context.user,
      location
    };
    return this;
  }
  
  withHealthProfile(profile: HealthProfile): this {
    this.context.user = {
      ...this.context.user,
      healthProfile: profile
    };
    return this;
  }
  
  withProfileInfluence(influence: { level: ProfileInfluence; reason: string; disableProfile?: boolean }): this {
    this.context.profileInfluence = influence;
    return this;
  }
  
  withExecutionPlan(plan: Partial<ExecutionPlan>): this {
    this.context.executionPlan = {
      ...this.context.executionPlan!,
      ...plan
    };
    return this;
  }
  
  withSession(session: SessionContext): this {
    this.context.session = session;
    return this;
  }
  
  markEnrichment(type: keyof QueryContext['enrichments']): this {
    this.context.enrichments![type] = true;
    return this;
  }
  
  addDecision(component: string, decision: string, confidence: number, reasoning?: string): this {
    this.context.tracking!.decisionsMade.push({
      component,
      decision,
      confidence,
      reasoning
    });
    return this;
  }
  
  build(): QueryContext {
    // Validate required fields
    if (!this.context.originalQuery) {
      throw new Error('QueryContext requires originalQuery');
    }
    
    return this.context as QueryContext;
  }
}

/**
 * Helper to preserve context through transformations
 */
export function preserveContext<T>(
  context: QueryContext,
  transformer: (ctx: QueryContext) => T
): { result: T; context: QueryContext } {
  const startTime = Date.now();
  const result = transformer(context);
  
  // Update processing time
  context.metadata.processingTime = 
    (context.metadata.processingTime || 0) + (Date.now() - startTime);
  
  return { result, context };
}

/**
 * Merge multiple contexts (for parallel searches)
 */
export function mergeContexts(contexts: QueryContext[]): QueryContext {
  if (contexts.length === 0) {
    throw new Error('Cannot merge empty contexts');
  }
  
  if (contexts.length === 1) {
    return contexts[0];
  }
  
  const base = contexts[0];
  
  // Merge search strategies used
  const allStrategies = new Set<string>();
  contexts.forEach(ctx => {
    ctx.metadata.searchStrategiesUsed.forEach(s => allStrategies.add(s));
  });
  
  // Merge decisions made
  const allDecisions = contexts.flatMap(ctx => ctx.tracking.decisionsMade);
  
  // Merge features used
  const allFeatures = new Set<string>();
  contexts.forEach(ctx => {
    ctx.tracking.featuresUsed.forEach(f => allFeatures.add(f));
  });
  
  return {
    ...base,
    metadata: {
      ...base.metadata,
      searchStrategiesUsed: Array.from(allStrategies),
      processingTime: contexts.reduce((sum, ctx) => 
        sum + (ctx.metadata.processingTime || 0), 0)
    },
    tracking: {
      ...base.tracking,
      decisionsMade: allDecisions,
      featuresUsed: Array.from(allFeatures)
    }
  };
}

/**
 * Context validation helper
 */
export function validateContext(context: QueryContext): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (!context.originalQuery) {
    issues.push('Missing original query');
  }
  
  if (!context.metadata?.createdAt) {
    issues.push('Missing creation timestamp');
  }
  
  if (!context.tracking?.contextId) {
    issues.push('Missing context ID');
  }
  
  // Check for information loss
  if (context.normalizedQuery && 
      context.normalizedQuery.length < context.originalQuery.length * 0.5) {
    issues.push('Possible information loss in normalization');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}
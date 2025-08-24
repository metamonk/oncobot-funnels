/**
 * Simple Fallback Classifier
 * 
 * Provides basic query classification when AI services are unavailable.
 * Uses simple pattern matching to determine query intent.
 */

import type { HealthProfile } from './types';
import { QueryContext, QueryContextBuilder, ProfileInfluence, type ExecutionPlan } from './query-context';
import { debug, DebugCategory } from './debug';

export class SimpleClassifier {
  /**
   * Simple pattern-based classification
   * Used as fallback when AI classification fails
   */
  classify(query: string, context?: {
    healthProfile?: HealthProfile | null;
    userLocation?: { latitude: number; longitude: number } | null;
  }): QueryContext {
    const builder = new QueryContextBuilder(query);
    const queryLower = query.toLowerCase();
    
    // Add user context
    if (context?.healthProfile) {
      builder.withHealthProfile(context.healthProfile);
    }
    
    if (context?.userLocation) {
      builder.withUserLocation({
        coordinates: context.userLocation,
        searchRadius: 300
      });
    }
    
    // Simple NCT ID detection
    const nctMatch = query.match(/NCT\d{8}/gi);
    if (nctMatch) {
      builder.withExtractedEntities({
        nctIds: nctMatch.map(id => id.toUpperCase()),
        conditions: [],
        cancerTypes: [],
        mutations: [],
        biomarkers: [],
        locations: [],
        drugs: [],
        treatments: [],
        stages: [],
        otherMedicalTerms: []
      });
      
      builder.withInferredIntent({
        primaryGoal: 'specific_trial',
        specificity: 'very_specific',
        urgency: 'researching',
        knowledgeLevel: 'patient',
        confidence: 1.0
      });
      
      builder.withExecutionPlan({
        primaryStrategy: 'nct_direct',
        fallbackStrategies: [],
        searchParams: {
          baseQuery: nctMatch[0].toUpperCase(),
          filters: {
            nctIds: nctMatch.map(id => id.toUpperCase())
          },
          maxResults: 10
        },
        validations: {
          confirmRecruitmentStatus: true
        }
      });
      
      debug.log(DebugCategory.QUERY, '[SimpleClassifier] NCT lookup detected', { nctIds: nctMatch });
      return builder.build();
    }
    
    // Location detection
    const hasLocation = queryLower.includes('near') || 
                       queryLower.includes('in ') ||
                       queryLower.includes('at ') ||
                       /\b(chicago|new york|los angeles|houston|boston)\b/i.test(queryLower);
    
    // Condition detection
    const hasCondition = /\b(nsclc|sclc|lung cancer|breast cancer|melanoma|leukemia)\b/i.test(queryLower) ||
                        /\b(cancer|tumor|carcinoma|lymphoma)\b/i.test(queryLower);
    
    // Mutation detection
    const hasMutation = /\b(kras|egfr|alk|braf|pd-l1|her2|brca)\b/i.test(queryLower);
    
    // Extract basic entities
    const entities = {
      nctIds: [],
      conditions: hasCondition ? [query.match(/\b(nsclc|sclc|lung cancer|breast cancer|melanoma|leukemia|cancer)\b/i)?.[0] || 'cancer'] : [],
      cancerTypes: [],
      mutations: hasMutation ? [query.match(/\b(kras|egfr|alk|braf|pd-l1|her2|brca)\b/i)?.[0] || ''] : [],
      locations: hasLocation ? ['user location'] : [],
      keywords: [],
      radius: 300
    };
    
    // Complete entities structure
    const completeEntities = {
      ...entities,
      biomarkers: [],
      drugs: [],
      treatments: [],
      stages: [],
      otherMedicalTerms: []
    };
    builder.withExtractedEntities(completeEntities);
    
    // Determine search type and strategy
    let searchType: string;
    let strategy: string;
    let confidence = 0.6; // Lower confidence for simple classification
    
    if (hasLocation && hasCondition) {
      searchType = 'combined';
      strategy = 'location_based';
    } else if (hasLocation) {
      searchType = 'location_based';
      strategy = 'location_based';
    } else if (hasMutation) {
      searchType = 'mutation_based';
      strategy = 'profile_based';
    } else if (hasCondition) {
      searchType = 'condition_based';
      strategy = 'condition_based';
    } else if (context?.healthProfile) {
      searchType = 'profile_based';
      strategy = 'profile_based';
      confidence = 0.8;
    } else {
      searchType = 'general_info';
      strategy = 'broad_search';
      confidence = 0.5;
    }
    
    // Map to proper InferredIntent structure
    let primaryGoal: 'find_trials' | 'check_eligibility' | 'get_info' | 'explore_options' | 'specific_trial' = 'find_trials';
    let specificity: 'very_specific' | 'moderately_specific' | 'broad' | 'exploratory' = 'broad';
    
    if (hasLocation && hasCondition) {
      specificity = 'moderately_specific';
    } else if (hasMutation) {
      specificity = 'moderately_specific';
    } else if (hasCondition || hasLocation) {
      specificity = 'moderately_specific';
    } else if (!context?.healthProfile) {
      specificity = 'exploratory';
      primaryGoal = 'explore_options';
    }
    
    builder.withInferredIntent({
      primaryGoal,
      specificity,
      urgency: 'researching',
      knowledgeLevel: 'patient',
      confidence
    });
    
    // Build search parameters
    const searchParams: any = {
      conditions: entities.conditions,
      mutations: entities.mutations,
      radius: 300
    };
    
    // Add profile data if available
    if (context?.healthProfile) {
      const profile = context.healthProfile;
      const cancerType = profile.cancerType || (profile as any).cancer_type;
      if (cancerType && !hasCondition) {
        searchParams.conditions = [cancerType];
      }
      searchParams.enrichedQuery = cancerType || 'cancer';
    } else {
      searchParams.enrichedQuery = entities.conditions[0] || 'cancer';
    }
    
    builder.withExecutionPlan({
      primaryStrategy: strategy as ExecutionPlan['primaryStrategy'],
      fallbackStrategies: strategy === 'profile_based' ? ['broad_search'] : [],
      searchParams: {
        baseQuery: searchParams.enrichedQuery || searchParams.conditions?.[0] || 'cancer',
        enrichedQuery: searchParams.enrichedQuery,
        filters: {
          conditions: searchParams.conditions,
          mutations: searchParams.mutations,
          radius: searchParams.radius
        },
        maxResults: 25
      },
      validations: {
        checkEligibility: !!context?.healthProfile,
        verifyLocations: hasLocation,
        confirmRecruitmentStatus: true
      }
    });
    
    // Set profile influence
    if (context?.healthProfile) {
      builder.withProfileInfluence({
        level: ProfileInfluence.CONTEXTUAL,
        reason: 'Simple classification with profile context'
      });
    } else {
      builder.withProfileInfluence({
        level: ProfileInfluence.DISABLED,
        reason: 'No health profile available'
      });
    }
    
    // Add decision tracking
    builder.addDecision(
      'SimpleClassifier',
      `Fallback classification as ${searchType} with ${strategy}`,
      confidence,
      'AI classification unavailable, using pattern matching'
    );
    
    debug.log(DebugCategory.QUERY, '[SimpleClassifier] Fallback classification complete', {
      searchType,
      strategy,
      confidence,
      hasProfile: !!context?.healthProfile,
      hasLocation
    });
    
    return builder.build();
  }
}

export const simpleClassifier = new SimpleClassifier();
/**
 * New eligibility assessment system
 * Properly separates search relevance, trial criteria, and user assessment
 */

import { 
  HealthProfile, 
  ClinicalTrial,
  TrialEligibilityAssessment, 
  MatchedCriteria
} from './types';
import { EligibilityCriteriaParser } from './eligibility-criteria-parser';
import { formatMarkerName, isPositiveMarker } from '@/lib/utils';

/**
 * Search context for understanding why a trial was returned
 */
interface SearchContext {
  userQuery: string;
  searchStrategy: 'profile' | 'entity' | 'literal' | 'nct';
  matchedTerms: string[];
  relevanceScore: number;
}

/**
 * Main assessment function that creates the three-layer assessment
 */
export function assessEligibility(
  trial: ClinicalTrial,
  healthProfile: HealthProfile | null,
  searchContext: SearchContext
): TrialEligibilityAssessment {
  // Layer 1: Search Relevance (always calculated)
  const searchRelevance = {
    matchedTerms: searchContext.matchedTerms || [],
    relevanceScore: searchContext.relevanceScore || 0.5,
    searchStrategy: searchContext.searchStrategy,
    reasoning: generateSearchReasoning(trial, searchContext),
  };

  // Layer 2: Trial Criteria (parse if available)
  const criteriaText = trial.protocolSection.eligibilityModule?.eligibilityCriteria;
  const parsedCriteria = EligibilityCriteriaParser.parse(criteriaText);
  
  const trialCriteria = {
    parsed: parsedCriteria.parseConfidence > 0.3,
    inclusion: parsedCriteria.inclusion,
    exclusion: parsedCriteria.exclusion,
    demographics: parsedCriteria.demographics,
    rawText: criteriaText, // Always include for progressive disclosure
    parseConfidence: parsedCriteria.parseConfidence,
  };

  // Layer 3: User Assessment (only with profile)
  const userAssessment = healthProfile 
    ? assessUserEligibility(healthProfile, parsedCriteria, trial)
    : undefined;

  return {
    searchRelevance,
    trialCriteria,
    userAssessment,
  };
}

/**
 * Generate reasoning for why this trial appeared in search results
 */
function generateSearchReasoning(trial: ClinicalTrial, context: SearchContext): string {
  const reasons: string[] = [];
  
  if (context.searchStrategy === 'nct') {
    return `Direct NCT ID lookup: ${trial.protocolSection.identificationModule.nctId}`;
  }
  
  if (context.searchStrategy === 'profile') {
    reasons.push('Matched based on your health profile');
  }
  
  if (context.matchedTerms.length > 0) {
    reasons.push(`Matched terms: ${context.matchedTerms.join(', ')}`);
  }
  
  if (context.searchStrategy === 'entity') {
    reasons.push('Matched specific medical entities in your query');
  }
  
  if (context.searchStrategy === 'literal') {
    reasons.push('Matched your search terms');
  }
  
  return reasons.join('. ') || 'General search result';
}

/**
 * Assess user eligibility against trial criteria
 */
function assessUserEligibility(
  profile: HealthProfile,
  parsedCriteria: ReturnType<typeof EligibilityCriteriaParser.parse>,
  trial: ClinicalTrial
): TrialEligibilityAssessment['userAssessment'] {
  const matches = {
    inclusion: [] as MatchedCriteria[],
    exclusion: [] as MatchedCriteria[],
  };
  
  const missingData: string[] = [];
  let totalScore = 0;
  let maxScore = 0;
  
  // Check inclusion criteria
  for (const criterion of parsedCriteria.inclusion) {
    const match = matchCriterionToProfile(criterion, profile);
    matches.inclusion.push(match);
    
    if (match.matchType === 'missing') {
      missingData.push(`Need information about: ${criterion.category}`);
    } else if (match.matchType === 'exact') {
      totalScore += 1;
    } else if (match.matchType === 'partial') {
      totalScore += 0.5;
    }
    maxScore += 1;
  }
  
  // Check exclusion criteria
  for (const criterion of parsedCriteria.exclusion) {
    const match = matchCriterionToProfile(criterion, profile);
    matches.exclusion.push(match);
    
    if (match.matchType === 'exact') {
      // Matching an exclusion criterion is bad
      totalScore -= 1;
    } else if (match.matchType === 'missing') {
      missingData.push(`Need to confirm absence of: ${criterion.category}`);
    }
  }
  
  // Check demographics
  if (parsedCriteria.demographics.ageRange) {
    // We don't typically have age in profile, so mark as missing
    missingData.push('Age information needed for eligibility assessment');
  }
  
  if (parsedCriteria.demographics.sex) {
    // We don't typically have sex in profile
    missingData.push('Biological sex information needed');
  }
  
  // Calculate confidence and recommendation
  const eligibilityScore = maxScore > 0 ? Math.max(0, totalScore / maxScore) : undefined;
  const hasAllData = missingData.length === 0;
  
  let confidence: 'high' | 'medium' | 'low' | 'insufficient-data';
  let recommendation: 'likely' | 'possible' | 'unlikely' | 'insufficient-data';
  
  if (!hasAllData && missingData.length > 3) {
    confidence = 'insufficient-data';
    recommendation = 'insufficient-data';
  } else if (eligibilityScore !== undefined) {
    if (eligibilityScore >= 0.7) {
      confidence = hasAllData ? 'high' : 'medium';
      recommendation = 'likely';
    } else if (eligibilityScore >= 0.4) {
      confidence = hasAllData ? 'medium' : 'low';
      recommendation = 'possible';
    } else {
      confidence = hasAllData ? 'high' : 'medium';
      recommendation = 'unlikely';
    }
  } else {
    confidence = 'insufficient-data';
    recommendation = 'insufficient-data';
  }
  
  // Add missing profile completeness info
  if (!profile.diseaseStage && !profile.stage) {
    missingData.push('Disease stage information would improve matching');
  }
  
  if (!profile.molecularMarkers || Object.keys(profile.molecularMarkers).length === 0) {
    missingData.push('Molecular marker information would improve matching');
  }
  
  return {
    hasProfile: true,
    assessmentDate: new Date().toISOString(),
    eligibilityScore,
    matches,
    missingData: [...new Set(missingData)], // Remove duplicates
    confidence,
    recommendation,
  };
}

/**
 * Match a specific criterion to the user's profile
 */
function matchCriterionToProfile(
  criterion: ReturnType<typeof EligibilityCriteriaParser.parse>['inclusion'][0],
  profile: HealthProfile
): MatchedCriteria {
  let matchType: 'exact' | 'partial' | 'inferred' | 'missing' = 'missing';
  let profileData: string | undefined;
  let confidence = 0;
  let reasoning = '';
  
  // Check based on category
  switch (criterion.category) {
    case 'disease':
      if (criterion.parsedEntities?.cancerTypes) {
        const profileCancer = profile.cancerType || profile.cancer_type;
        if (profileCancer) {
          const cancerLower = profileCancer.toLowerCase();
          const matchedCancer = criterion.parsedEntities.cancerTypes.find(
            ct => ct.toLowerCase().includes(cancerLower) || cancerLower.includes(ct.toLowerCase())
          );
          if (matchedCancer) {
            matchType = 'exact';
            profileData = profileCancer;
            confidence = 0.9;
            reasoning = `Your ${profileCancer} matches the trial's ${matchedCancer} requirement`;
          }
        }
      }
      
      if (criterion.parsedEntities?.stages) {
        const profileStage = profile.diseaseStage || profile.stage;
        if (profileStage) {
          const stageLower = profileStage.toLowerCase();
          const matchedStage = criterion.parsedEntities.stages.find(
            st => st.toLowerCase().includes(stageLower) || stageLower.includes(st.toLowerCase())
          );
          if (matchedStage) {
            matchType = matchType === 'exact' ? 'exact' : 'partial';
            profileData = (profileData ? profileData + ', ' : '') + profileStage;
            confidence = Math.max(confidence, 0.8);
            reasoning += (reasoning ? '. ' : '') + `Your stage ${profileStage} matches requirement`;
          }
        }
      }
      break;
      
    case 'biomarker':
      if (profile.molecularMarkers && criterion.parsedEntities?.genes) {
        for (const gene of criterion.parsedEntities.genes) {
          const markerValue = profile.molecularMarkers[gene];
          if (markerValue && isPositiveMarker(markerValue)) {
            matchType = 'exact';
            profileData = `${gene}: ${markerValue}`;
            confidence = 0.95;
            reasoning = `Your ${gene} positive status matches the trial requirement`;
            break;
          }
        }
      }
      
      if (profile.mutations && criterion.parsedEntities?.mutations) {
        for (const mutation of criterion.parsedEntities.mutations) {
          if (profile.mutations.some(m => m.toLowerCase().includes(mutation.toLowerCase()))) {
            matchType = 'exact';
            profileData = mutation;
            confidence = 0.9;
            reasoning = `Your ${mutation} mutation matches the trial requirement`;
            break;
          }
        }
      }
      break;
      
    case 'treatment':
      if (profile.treatments && criterion.parsedEntities?.treatments) {
        for (const treatment of criterion.parsedEntities.treatments) {
          if (profile.treatments.some(t => t.toLowerCase().includes(treatment.toLowerCase()))) {
            matchType = 'partial';
            profileData = treatment;
            confidence = 0.7;
            reasoning = `Your treatment history includes ${treatment}`;
            break;
          }
        }
      }
      break;
      
    default:
      // For other categories, we likely don't have matching data
      matchType = 'missing';
      confidence = 0;
      reasoning = 'Unable to assess this criterion with available profile data';
  }
  
  if (matchType === 'missing' && !reasoning) {
    reasoning = `No ${criterion.category} information in your profile to match against this criterion`;
  }
  
  return {
    ...criterion,
    matchType,
    profileData,
    confidence,
    reasoning,
  };
}

// Legacy function removed - no backward compatibility needed

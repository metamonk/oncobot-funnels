/**
 * Enhanced Eligibility Scoring System
 * 
 * Provides sophisticated matching between health profiles and clinical trials
 * with detailed scoring algorithms and explanations.
 */

import type { ClinicalTrial, HealthProfile } from './types';
import { debug, DebugCategory } from './debug';

/**
 * Detailed eligibility score with breakdown
 */
export interface EligibilityScore {
  totalScore: number; // 0-100
  confidence: 'high' | 'medium' | 'low';
  breakdown: {
    conditionMatch: number;
    stageMatch: number;
    molecularMatch: number;
    treatmentHistoryMatch: number;
    demographicMatch: number;
    performanceStatusMatch: number;
  };
  matchedCriteria: string[];
  unmatchedCriteria: string[];
  recommendations: string[];
}

/**
 * Molecular marker with detailed status
 */
interface MolecularMarkerDetail {
  name: string;
  status: 'POSITIVE' | 'NEGATIVE' | 'HIGH' | 'LOW' | 'UNKNOWN';
  relevance?: 'required' | 'preferred' | 'exclusion';
}

/**
 * Treatment history detail
 */
interface TreatmentDetail {
  name: string;
  type: 'chemotherapy' | 'radiation' | 'surgery' | 'immunotherapy' | 'targeted' | 'other';
  timing?: 'current' | 'previous' | 'planned';
}

/**
 * Enhanced eligibility criteria parser result
 */
interface ParsedCriteria {
  requiredConditions: string[];
  excludedConditions: string[];
  requiredMarkers: MolecularMarkerDetail[];
  excludedMarkers: MolecularMarkerDetail[];
  requiredTreatments: string[];
  excludedTreatments: string[];
  ageRange: { min?: number; max?: number };
  performanceRequirements: string[];
  otherRequirements: string[];
}

/**
 * Enhanced Eligibility Scorer
 */
export class EligibilityScorer {
  private readonly weights = {
    condition: 0.3,
    stage: 0.2,
    molecular: 0.2,
    treatment: 0.15,
    demographic: 0.1,
    performance: 0.05
  };

  /**
   * Calculate comprehensive eligibility score
   */
  calculateScore(
    trial: ClinicalTrial,
    profile: HealthProfile
  ): EligibilityScore {
    const breakdown = {
      conditionMatch: this.scoreConditionMatch(trial, profile),
      stageMatch: this.scoreStageMatch(trial, profile),
      molecularMatch: this.scoreMolecularMatch(trial, profile),
      treatmentHistoryMatch: this.scoreTreatmentMatch(trial, profile),
      demographicMatch: this.scoreDemographicMatch(trial, profile),
      performanceStatusMatch: this.scorePerformanceMatch(trial, profile)
    };

    // Calculate weighted total
    const totalScore = Math.round(
      breakdown.conditionMatch * this.weights.condition +
      breakdown.stageMatch * this.weights.stage +
      breakdown.molecularMatch * this.weights.molecular +
      breakdown.treatmentHistoryMatch * this.weights.treatment +
      breakdown.demographicMatch * this.weights.demographic +
      breakdown.performanceStatusMatch * this.weights.performance
    );

    // Determine confidence level
    const confidence = this.determineConfidence(breakdown, profile);

    // Parse eligibility criteria
    const criteria = this.parseEligibilityCriteria(
      trial.protocolSection?.eligibilityModule?.eligibilityCriteria || ''
    );

    // Determine matched/unmatched criteria
    const { matchedCriteria, unmatchedCriteria } = this.evaluateCriteria(
      criteria,
      profile
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      breakdown,
      criteria,
      profile
    );

    debug.log(DebugCategory.SCORING, 'Eligibility score calculated', {
      nctId: trial.protocolSection?.identificationModule?.nctId,
      totalScore,
      confidence,
      breakdown
    });

    return {
      totalScore,
      confidence,
      breakdown,
      matchedCriteria,
      unmatchedCriteria,
      recommendations
    };
  }

  /**
   * Score condition/cancer type match
   */
  private scoreConditionMatch(
    trial: ClinicalTrial,
    profile: HealthProfile
  ): number {
    if (!profile.cancerType) return 50; // No profile data

    const profileCancer = (profile.cancerType || '').toLowerCase();
    const conditions = trial.protocolSection?.conditionsModule?.conditions || [];
    
    // Exact match
    if (conditions.some(c => c.toLowerCase() === profileCancer)) {
      return 100;
    }

    // Partial match (e.g., "lung cancer" matches "non-small cell lung cancer")
    if (conditions.some(c => 
      c.toLowerCase().includes(profileCancer) || 
      profileCancer.includes(c.toLowerCase())
    )) {
      return 80;
    }

    // Related conditions (e.g., both are lung cancers)
    const profileTerms = profileCancer.split(/\s+/);
    if (conditions.some(c => {
      const conditionTerms = c.toLowerCase().split(/\s+/);
      return profileTerms.some(term => 
        conditionTerms.includes(term) && term !== 'cancer'
      );
    })) {
      return 60;
    }

    return 20; // No match
  }

  /**
   * Score disease stage match
   */
  private scoreStageMatch(
    trial: ClinicalTrial,
    profile: HealthProfile
  ): number {
    if (!profile.diseaseStage && !profile.stage) return 50; // No profile data

    const profileStage = (profile.diseaseStage || profile.stage || '').toLowerCase();
    const criteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria?.toLowerCase() || '';

    // Check if trial accepts all stages
    if (criteria.includes('any stage') || criteria.includes('all stages')) {
      return 100;
    }

    // Extract stage requirements from criteria
    const stagePatterns = [
      /stage\s+(i{1,3}|iv|[1-4])[abc]?/gi,
      /advanced/gi,
      /metastatic/gi,
      /early[\s-]?stage/gi,
      /locally advanced/gi
    ];

    let hasStageRequirement = false;
    let matchesStage = false;

    for (const pattern of stagePatterns) {
      const matches = criteria.match(pattern);
      if (matches) {
        hasStageRequirement = true;
        if (matches.some(m => profileStage.includes(m.toLowerCase()))) {
          matchesStage = true;
          break;
        }
      }
    }

    if (!hasStageRequirement) return 75; // No specific stage requirement
    if (matchesStage) return 100;

    // Check for stage group matches
    if (profileStage.includes('iv') || profileStage.includes('4')) {
      if (criteria.includes('advanced') || criteria.includes('metastatic')) {
        return 80;
      }
    }

    if (profileStage.includes('i') || profileStage.includes('1') || 
        profileStage.includes('ii') || profileStage.includes('2')) {
      if (criteria.includes('early')) {
        return 80;
      }
    }

    return 20; // Stage mismatch
  }

  /**
   * Score molecular marker match
   */
  private scoreMolecularMatch(
    trial: ClinicalTrial,
    profile: HealthProfile
  ): number {
    if (!profile.molecularMarkers && !profile.mutations) return 50; // No profile data

    const criteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria?.toLowerCase() || '';
    
    // Extract molecular markers from criteria
    const markerPatterns = [
      /egfr/gi,
      /alk/gi,
      /kras/gi,
      /braf/gi,
      /her2/gi,
      /pd-?l1/gi,
      /brca[12]?/gi,
      /ros1/gi,
      /met/gi,
      /ret/gi,
      /ntrk/gi,
      /tmb/gi,
      /msi/gi
    ];

    const requiredMarkers: MolecularMarkerDetail[] = [];
    const excludedMarkers: MolecularMarkerDetail[] = [];

    for (const pattern of markerPatterns) {
      const matches = criteria.match(pattern);
      if (matches) {
        const markerName = matches[0].toUpperCase();
        const context = criteria.slice(
          Math.max(0, criteria.indexOf(matches[0].toLowerCase()) - 50),
          criteria.indexOf(matches[0].toLowerCase()) + 50
        );

        if (context.includes('positive') || context.includes('mutation') || 
            context.includes('amplif') || context.includes('express')) {
          requiredMarkers.push({
            name: markerName,
            status: 'POSITIVE',
            relevance: 'required'
          });
        } else if (context.includes('negative') || context.includes('wild') || 
                   context.includes('no mutation')) {
          excludedMarkers.push({
            name: markerName,
            status: 'POSITIVE',
            relevance: 'exclusion'
          });
        }
      }
    }

    if (requiredMarkers.length === 0 && excludedMarkers.length === 0) {
      return 75; // No molecular requirements
    }

    // Check profile markers
    const profileMarkers = profile.molecularMarkers || {};
    const mutations = profile.mutations || [];
    
    let matchedRequired = 0;
    let totalRequired = requiredMarkers.length;
    let matchedExclusions = 0;
    let totalExclusions = excludedMarkers.length;

    // Check required markers
    for (const required of requiredMarkers) {
      if (profileMarkers[required.name] === required.status ||
          mutations.some(m => m.toUpperCase().includes(required.name))) {
        matchedRequired++;
      }
    }

    // Check excluded markers
    for (const excluded of excludedMarkers) {
      if (profileMarkers[excluded.name] !== excluded.status &&
          !mutations.some(m => m.toUpperCase().includes(excluded.name))) {
        matchedExclusions++;
      }
    }

    if (totalRequired > 0 && matchedRequired === 0) {
      return 0; // Missing required markers
    }

    const requiredScore = totalRequired > 0 ? (matchedRequired / totalRequired) * 100 : 100;
    const exclusionScore = totalExclusions > 0 ? (matchedExclusions / totalExclusions) * 100 : 100;

    return Math.round((requiredScore + exclusionScore) / 2);
  }

  /**
   * Score treatment history match
   */
  private scoreTreatmentMatch(
    trial: ClinicalTrial,
    profile: HealthProfile
  ): number {
    if (!profile.treatmentHistory && !profile.treatments) return 50; // No profile data

    const criteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria?.toLowerCase() || '';
    
    // Parse treatment requirements
    const treatmentPatterns = [
      /prior\s+chemotherapy/gi,
      /previous\s+radiation/gi,
      /prior\s+surgery/gi,
      /immunotherapy/gi,
      /targeted\s+therapy/gi,
      /treatment[- ]?naive/gi,
      /no\s+prior\s+treatment/gi
    ];

    const treatments = this.parseTreatmentHistory(profile.treatmentHistory || profile.treatments);
    
    let score = 75; // Default if no specific requirements

    for (const pattern of treatmentPatterns) {
      if (pattern.test(criteria)) {
        const requirement = pattern.source.toLowerCase();
        
        if (requirement.includes('naive') || requirement.includes('no prior')) {
          score = treatments.length === 0 ? 100 : 0;
        } else if (requirement.includes('chemotherapy')) {
          score = treatments.some(t => t.type === 'chemotherapy') ? 100 : 50;
        } else if (requirement.includes('radiation')) {
          score = treatments.some(t => t.type === 'radiation') ? 100 : 50;
        } else if (requirement.includes('immunotherapy')) {
          score = treatments.some(t => t.type === 'immunotherapy') ? 100 : 50;
        }
      }
    }

    return score;
  }

  /**
   * Score demographic match (age, sex)
   */
  private scoreDemographicMatch(
    trial: ClinicalTrial,
    profile: HealthProfile
  ): number {
    const eligibility = trial.protocolSection?.eligibilityModule;
    if (!eligibility) return 75;

    // For now, we don't have age/sex in the health profile
    // This would need to be added to the profile
    
    // Check sex requirements
    const sex = eligibility.sex?.toUpperCase();
    if (sex && sex !== 'ALL') {
      // Would need profile.sex to properly score
      return 50; // Unknown match
    }

    return 75; // No specific requirements or all accepted
  }

  /**
   * Score performance status match
   */
  private scorePerformanceMatch(
    trial: ClinicalTrial,
    profile: HealthProfile
  ): number {
    if (!profile.performanceStatus) return 50; // No profile data

    const criteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria?.toLowerCase() || '';
    const profilePS = profile.performanceStatus.toLowerCase();

    // Check for ECOG requirements
    const ecogPattern = /ecog\s*[≤<=]?\s*([0-4])/gi;
    const ecogMatches = criteria.match(ecogPattern);

    if (ecogMatches) {
      const maxECOG = parseInt(ecogMatches[0].match(/[0-4]/)?.[0] || '2');
      const profileECOG = parseInt(profilePS.match(/[0-4]/)?.[0] || '0');
      
      if (profileECOG <= maxECOG) {
        return 100;
      } else {
        return 0; // Doesn't meet performance requirement
      }
    }

    // Check for Karnofsky requirements
    const karnofskyPattern = /karnofsky\s*[≥>=]?\s*(\d+)/gi;
    const karnofskyMatches = criteria.match(karnofskyPattern);

    if (karnofskyMatches) {
      // Would need Karnofsky score in profile
      return 50; // Unknown match
    }

    return 75; // No specific performance requirements
  }

  /**
   * Determine confidence level based on available data
   */
  private determineConfidence(
    breakdown: EligibilityScore['breakdown'],
    profile: HealthProfile
  ): 'high' | 'medium' | 'low' {
    // Count how many profile fields are populated
    let filledFields = 0;
    let totalFields = 6;

    if (profile.cancerType) filledFields++;
    if (profile.diseaseStage) filledFields++;
    if (profile.molecularMarkers) filledFields++;
    if (profile.treatmentHistory) filledFields++;
    if (profile.performanceStatus) filledFields++;
    // Demographics would be the 6th

    const dataCompleteness = filledFields / totalFields;
    const avgScore = Object.values(breakdown).reduce((a, b) => a + b, 0) / 6;

    if (dataCompleteness >= 0.8 && avgScore >= 70) return 'high';
    if (dataCompleteness >= 0.5 && avgScore >= 50) return 'medium';
    return 'low';
  }

  /**
   * Parse eligibility criteria into structured format
   */
  private parseEligibilityCriteria(criteria: string): ParsedCriteria {
    const parsed: ParsedCriteria = {
      requiredConditions: [],
      excludedConditions: [],
      requiredMarkers: [],
      excludedMarkers: [],
      requiredTreatments: [],
      excludedTreatments: [],
      ageRange: {},
      performanceRequirements: [],
      otherRequirements: []
    };

    // This is a simplified parser - in production, would use NLP
    const lines = criteria.split(/[.\n]/);
    
    for (const line of lines) {
      const lower = line.toLowerCase();
      
      // Age parsing
      if (lower.includes('age')) {
        const ageMatch = lower.match(/(\d+)\s*(?:years?|yrs?)/);
        if (ageMatch) {
          const age = parseInt(ageMatch[1]);
          if (lower.includes('minimum') || lower.includes('≥') || lower.includes('>=')) {
            parsed.ageRange.min = age;
          } else if (lower.includes('maximum') || lower.includes('≤') || lower.includes('<=')) {
            parsed.ageRange.max = age;
          }
        }
      }

      // Performance status
      if (lower.includes('ecog') || lower.includes('karnofsky')) {
        parsed.performanceRequirements.push(line.trim());
      }

      // Other requirements
      if (lower.includes('must') || lower.includes('required')) {
        parsed.otherRequirements.push(line.trim());
      }
    }

    return parsed;
  }

  /**
   * Evaluate which criteria are matched/unmatched
   */
  private evaluateCriteria(
    criteria: ParsedCriteria,
    profile: HealthProfile
  ): { matchedCriteria: string[]; unmatchedCriteria: string[] } {
    const matchedCriteria: string[] = [];
    const unmatchedCriteria: string[] = [];

    // Check conditions
    if (profile.cancerType) {
      matchedCriteria.push(`Cancer type: ${profile.cancerType}`);
    }

    // Check stage
    if (profile.diseaseStage) {
      matchedCriteria.push(`Disease stage: ${profile.diseaseStage || profile.stage}`);
    }

    // Check markers
    if (profile.molecularMarkers) {
      for (const [marker, status] of Object.entries(profile.molecularMarkers)) {
        if (status) {
          matchedCriteria.push(`${marker}: ${status}`);
        }
      }
    }

    // Check treatments
    if (profile.treatmentHistory || profile.treatments) {
      const treatments = this.parseTreatmentHistory(profile.treatmentHistory || profile.treatments);
      for (const treatment of treatments) {
        matchedCriteria.push(`Prior ${treatment.type}: ${treatment.name}`);
      }
    }

    // Check performance status
    if (profile.performanceStatus) {
      matchedCriteria.push(`Performance status: ${profile.performanceStatus}`);
    }

    // Add unmatched required criteria
    for (const req of criteria.otherRequirements) {
      if (!matchedCriteria.some(m => m.toLowerCase().includes(req.toLowerCase()))) {
        unmatchedCriteria.push(req);
      }
    }

    return { matchedCriteria, unmatchedCriteria };
  }

  /**
   * Generate recommendations based on scoring
   */
  private generateRecommendations(
    breakdown: EligibilityScore['breakdown'],
    criteria: ParsedCriteria,
    profile: HealthProfile
  ): string[] {
    const recommendations: string[] = [];

    // Condition recommendations
    if (breakdown.conditionMatch < 50) {
      recommendations.push('Consider discussing with your oncologist if this trial is appropriate for your cancer type');
    }

    // Stage recommendations
    if (breakdown.stageMatch < 50) {
      recommendations.push('Verify that your disease stage meets the trial requirements');
    }

    // Molecular marker recommendations
    if (breakdown.molecularMatch < 50) {
      if (!profile.molecularMarkers && !profile.mutations) {
        recommendations.push('Consider molecular testing to determine eligibility for targeted therapy trials');
      } else {
        recommendations.push('Your molecular profile may not match the trial requirements');
      }
    }

    // Treatment history recommendations
    if (breakdown.treatmentHistoryMatch < 50) {
      recommendations.push('Review your treatment history with the trial coordinator');
    }

    // Performance status recommendations
    if (breakdown.performanceStatusMatch < 50) {
      recommendations.push('Discuss your current performance status with your healthcare team');
    }

    // High match recommendations
    if (breakdown.conditionMatch >= 80 && breakdown.stageMatch >= 80) {
      recommendations.push('This trial appears to be a good match for your condition');
      recommendations.push('Contact the trial coordinator to discuss enrollment');
    }

    return recommendations;
  }

  /**
   * Parse treatment history into structured format
   */
  private parseTreatmentHistory(
    history: unknown
  ): TreatmentDetail[] {
    const treatments: TreatmentDetail[] = [];

    if (Array.isArray(history)) {
      for (const item of history) {
        if (typeof item === 'string') {
          treatments.push(this.parseTreatmentString(item));
        } else if (typeof item === 'object' && item !== null) {
          treatments.push(this.parseTreatmentObject(item as Record<string, unknown>));
        }
      }
    } else if (typeof history === 'string') {
      // Split by common delimiters
      const items = history.split(/[,;]/);
      for (const item of items) {
        treatments.push(this.parseTreatmentString(item.trim()));
      }
    }

    return treatments;
  }

  /**
   * Parse treatment string
   */
  private parseTreatmentString(treatment: string): TreatmentDetail {
    const lower = treatment.toLowerCase();
    let type: TreatmentDetail['type'] = 'other';

    if (lower.includes('chemo')) type = 'chemotherapy';
    else if (lower.includes('radiation') || lower.includes('radio')) type = 'radiation';
    else if (lower.includes('surgery') || lower.includes('resection')) type = 'surgery';
    else if (lower.includes('immuno')) type = 'immunotherapy';
    else if (lower.includes('targeted')) type = 'targeted';

    return {
      name: treatment,
      type,
      timing: 'previous'
    };
  }

  /**
   * Parse treatment object
   */
  private parseTreatmentObject(treatment: Record<string, unknown>): TreatmentDetail {
    return {
      name: String(treatment.name || treatment.treatment || 'Unknown'),
      type: (treatment.type as TreatmentDetail['type']) || 'other',
      timing: (treatment.timing as TreatmentDetail['timing']) || 'previous'
    };
  }
}
/**
 * Relevance Scorer for Clinical Trials
 * 
 * Scores trials based on relevance to the user's query and health profile.
 * Prioritizes mutation-specific trials over generic ones.
 */

import type { HealthProfile, ClinicalTrial, ScoredTrial } from './types';
import { formatMarkerName, isPositiveMarker } from '@/lib/utils';

interface ScoringContext {
  userQuery: string;
  healthProfile?: HealthProfile | null;
  searchStrategy?: string;
}

export class RelevanceScorer {
  /**
   * Score a trial based on relevance to the search context
   */
  static scoreTrials(trials: ClinicalTrial[], context: ScoringContext): ScoredTrial[] {
    const scoredTrials = trials.map(trial => ({
      ...trial,
      relevanceScore: this.calculateScore(trial, context)
    }));

    // Sort by relevance score (highest first)
    return scoredTrials.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Calculate relevance score for a single trial
   */
  private static calculateScore(trial: ClinicalTrial, context: ScoringContext): number {
    let score = 0;
    
    const title = trial.protocolSection?.identificationModule?.briefTitle?.toLowerCase() || '';
    const officialTitle = trial.protocolSection?.identificationModule?.officialTitle?.toLowerCase() || '';
    const summary = trial.protocolSection?.descriptionModule?.briefSummary?.toLowerCase() || '';
    const conditions = trial.protocolSection?.conditionsModule?.conditions?.join(' ').toLowerCase() || '';
    const keywords = trial.protocolSection?.conditionsModule?.keywords?.join(' ').toLowerCase() || '';
    const interventions = trial.protocolSection?.armsInterventionsModule?.interventions?.map((i: { name?: string; description?: string }) => 
      `${i.name || ''} ${i.description || ''}`.toLowerCase()
    ).join(' ') || '';
    
    const fullText = `${title} ${officialTitle} ${summary} ${conditions} ${keywords} ${interventions}`;
    
    // Extract mutation information from health profile
    const mutations: string[] = [];
    if (context.healthProfile?.molecularMarkers) {
      Object.entries(context.healthProfile.molecularMarkers).forEach(([key, value]) => {
        if (isPositiveMarker(value)) {
          const mutationName = formatMarkerName(key);
          mutations.push(mutationName.toLowerCase());
        }
      });
    }
    if (context.healthProfile?.mutations) {
      mutations.push(...context.healthProfile.mutations.map((m: string) => m.toLowerCase()));
    }
    
    // Score based on mutation matches (highest priority)
    mutations.forEach(mutation => {
      // Exact mutation match in title (strongest signal)
      if (title.includes(mutation)) {
        score += 50;
      }
      // Mutation in official title
      if (officialTitle.includes(mutation)) {
        score += 40;
      }
      // Mutation in conditions or keywords
      if (conditions.includes(mutation) || keywords.includes(mutation)) {
        score += 30;
      }
      // Mutation in interventions
      if (interventions.includes(mutation)) {
        score += 25;
      }
      // Mutation in summary
      if (summary.includes(mutation)) {
        score += 20;
      }
      
      // Bonus for drugs targeting the specific mutation
      // Detect drug names generically (ends with common drug suffixes)
      const drugPattern = /\b\w+(?:mab|nib|ib|ab|stat|pril|olol|azole|cillin|mycin|cycline|floxacin|sartan|dipine|gliptin|tide|vir)\b/gi;
      const drugsInTrial = fullText.match(drugPattern) || [];
      
      // If the trial mentions specific drugs AND the mutation, give bonus
      if (drugsInTrial.length > 0 && fullText.includes(mutation)) {
        score += 35; // Bonus for targeted therapy drugs
      }
    });
    
    // Score based on cancer type match
    const cancerType = context.healthProfile?.cancer_type || context.healthProfile?.cancerType;
    if (cancerType) {
      const normalizedCancerType = cancerType.toLowerCase();
      if (fullText.includes(normalizedCancerType)) {
        score += 15;
      }
      // Check for related terms or abbreviations (generic approach)
      // Look for exact match or partial matches with the cancer type
      const cancerWords = normalizedCancerType.split(/\s+/);
      cancerWords.forEach((word: string) => {
        if (word.length > 3 && fullText.includes(word)) {
          score += 5; // Partial match bonus
        }
      });
    }
    
    // Score based on stage match
    if (context.healthProfile?.stage) {
      const stage = context.healthProfile.stage.toLowerCase();
      if (fullText.includes(stage) || fullText.includes('advanced') || fullText.includes('metastatic')) {
        score += 10;
      }
    }
    
    // Score based on trial phase (prefer later phases for treatment)
    const phase = trial.protocolSection?.designModule?.phases?.[0];
    if (phase) {
      if (phase.includes('PHASE3')) score += 5;
      else if (phase.includes('PHASE2')) score += 4;
      else if (phase.includes('PHASE1_PHASE2')) score += 3;
      else if (phase.includes('PHASE1')) score += 2;
    }
    
    // Score based on recruitment status (prefer actively recruiting)
    const status = trial.protocolSection?.statusModule?.overallStatus;
    if (status === 'RECRUITING') {
      score += 8;
    } else if (status === 'ENROLLING_BY_INVITATION') {
      score += 5;
    } else if (status === 'NOT_YET_RECRUITING') {
      score += 3;
    }
    
    // Penalty for trials that are too generic (no specific mutations mentioned)
    const hasMutationSpecificity = mutations.some(m => fullText.includes(m));
    if (!hasMutationSpecificity && mutations.length > 0) {
      score -= 20; // Penalize generic trials when user has specific mutations
    }
    
    // Bonus for combination therapies if relevant
    if (fullText.includes('combination') || fullText.includes('plus') || fullText.includes(' + ')) {
      score += 5;
    }
    
    // Bonus for targeted therapies and immunotherapies (generic)
    // Detect by common patterns in drug names and mechanisms
    const targetedTherapyPattern = /\b(inhibitor|antibody|blocker|antagonist|agonist|modulator)\b/gi;
    const targetedTherapyMatches = fullText.match(targetedTherapyPattern) || [];
    if (targetedTherapyMatches.length > 0) {
      score += Math.min(targetedTherapyMatches.length * 3, 15); // Cap at 15 points
    }
    
    return score;
  }
  
  /**
   * Get top N trials by relevance
   */
  static getTopTrials(trials: ClinicalTrial[], context: ScoringContext, limit: number = 10): ScoredTrial[] {
    const scored = this.scoreTrials(trials, context);
    return scored.slice(0, limit);
  }
  
  /**
   * Debug scoring for a specific trial
   */
  static debugScore(trial: ClinicalTrial, context: ScoringContext): {
    score: number;
    breakdown: Record<string, number>;
  } {
    const breakdown: Record<string, number> = {};
    let totalScore = 0;
    
    const title = trial.protocolSection?.identificationModule?.briefTitle?.toLowerCase() || '';
    const mutations: string[] = [];
    
    if (context.healthProfile?.molecularMarkers) {
      Object.entries(context.healthProfile.molecularMarkers).forEach(([key, value]) => {
        if (isPositiveMarker(value)) {
          mutations.push(formatMarkerName(key).toLowerCase());
        }
      });
    }
    
    mutations.forEach(mutation => {
      if (title.includes(mutation)) {
        breakdown[`mutation_in_title_${mutation}`] = 50;
        totalScore += 50;
      }
    });
    
    const status = trial.protocolSection?.statusModule?.overallStatus;
    if (status === 'RECRUITING') {
      breakdown['recruiting_status'] = 8;
      totalScore += 8;
    }
    
    return {
      score: totalScore,
      breakdown
    };
  }
}
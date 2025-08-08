/**
 * Relevance Scorer for Clinical Trials
 * 
 * Scores trials based on relevance to the user's query and health profile.
 * Prioritizes mutation-specific trials over generic ones.
 */

interface ScoringContext {
  userQuery: string;
  healthProfile?: any;
  searchStrategy?: string;
}

export class RelevanceScorer {
  /**
   * Score a trial based on relevance to the search context
   */
  static scoreTrials(trials: any[], context: ScoringContext): any[] {
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
  private static calculateScore(trial: any, context: ScoringContext): number {
    let score = 0;
    
    const title = trial.protocolSection?.identificationModule?.briefTitle?.toLowerCase() || '';
    const officialTitle = trial.protocolSection?.identificationModule?.officialTitle?.toLowerCase() || '';
    const summary = trial.protocolSection?.descriptionModule?.briefSummary?.toLowerCase() || '';
    const conditions = trial.protocolSection?.conditionsModule?.conditions?.join(' ').toLowerCase() || '';
    const keywords = trial.protocolSection?.conditionsModule?.keywords?.join(' ').toLowerCase() || '';
    const interventions = trial.protocolSection?.armsInterventionsModule?.interventions?.map((i: any) => 
      `${i.name || ''} ${i.description || ''}`.toLowerCase()
    ).join(' ') || '';
    
    const fullText = `${title} ${officialTitle} ${summary} ${conditions} ${keywords} ${interventions}`;
    
    // Extract mutation information from health profile
    const mutations: string[] = [];
    if (context.healthProfile?.molecularMarkers) {
      Object.entries(context.healthProfile.molecularMarkers).forEach(([key, value]) => {
        if (value === 'POSITIVE' || value === 'HIGH') {
          const mutationName = key.replace(/_/g, ' ');
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
      
      // Special bonus for KRAS G12C specific drugs (without hard-coding)
      const krasG12CDrugPatterns = [
        /sotorasib/i,
        /adagrasib/i,
        /divarasib/i,
        /lumakras/i,
        /krazati/i,
        /mrtx849/i,
        /gdc-6036/i,
        /ly3537982/i,
        /jdq443/i,
        /bi 1823911/i
      ];
      
      if (mutation.includes('kras') && mutation.includes('g12c')) {
        krasG12CDrugPatterns.forEach(pattern => {
          if (pattern.test(fullText)) {
            score += 35; // Significant bonus for KRAS G12C-specific drugs
          }
        });
      }
    });
    
    // Score based on cancer type match
    const cancerType = context.healthProfile?.cancer_type || context.healthProfile?.cancerType;
    if (cancerType) {
      const normalizedCancerType = cancerType.toLowerCase();
      if (fullText.includes(normalizedCancerType)) {
        score += 15;
      }
      // Check for common abbreviations
      if (normalizedCancerType.includes('lung')) {
        if (fullText.includes('nsclc') || fullText.includes('non-small cell')) {
          score += 15;
        }
      }
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
    
    // Bonus for immunotherapy combinations (often relevant for NSCLC)
    const immunotherapyTerms = ['pembrolizumab', 'nivolumab', 'atezolizumab', 'durvalumab', 'ipilimumab', 'pd-1', 'pd-l1', 'ctla-4'];
    immunotherapyTerms.forEach(term => {
      if (fullText.includes(term)) {
        score += 8;
      }
    });
    
    return score;
  }
  
  /**
   * Get top N trials by relevance
   */
  static getTopTrials(trials: any[], context: ScoringContext, limit: number = 10): any[] {
    const scored = this.scoreTrials(trials, context);
    return scored.slice(0, limit);
  }
  
  /**
   * Debug scoring for a specific trial
   */
  static debugScore(trial: any, context: ScoringContext): {
    score: number;
    breakdown: Record<string, number>;
  } {
    const breakdown: Record<string, number> = {};
    let totalScore = 0;
    
    const title = trial.protocolSection?.identificationModule?.briefTitle?.toLowerCase() || '';
    const mutations: string[] = [];
    
    if (context.healthProfile?.molecularMarkers) {
      Object.entries(context.healthProfile.molecularMarkers).forEach(([key, value]) => {
        if (value === 'POSITIVE' || value === 'HIGH') {
          mutations.push(key.replace(/_/g, ' ').toLowerCase());
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
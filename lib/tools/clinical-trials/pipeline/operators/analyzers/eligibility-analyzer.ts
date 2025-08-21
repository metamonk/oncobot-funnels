/**
 * Eligibility Analyzer Operator - Analyzes eligibility for trials
 */

import { BaseOperator } from '../../base-operator';
import type { ClinicalTrial, HealthProfile } from '../../../types';
import type { OperatorContext } from '../../types';

export interface EligibilityAnalyzerConfig {
  /**
   * Whether to perform detailed analysis
   */
  detailed?: boolean;
  
  /**
   * Whether to include structured criteria extraction
   */
  extractCriteria?: boolean;
  
  /**
   * Maximum number of trials to analyze in detail
   */
  maxDetailedAnalysis?: number;
  
  /**
   * Whether to stream full eligibility criteria
   */
  streamFullCriteria?: boolean;
}

interface EligibilityAnalysis {
  likelyEligible: boolean;
  eligibilityScore: number;
  inclusionMatches: string[];
  exclusionConcerns: string[];
  uncertainFactors: string[];
  missingInformation: string[];
  structuredCriteria?: {
    mutations: string[];
    mainRequirements: string[];
    keyExclusions: string[];
  };
}

export class EligibilityAnalyzer extends BaseOperator<ClinicalTrial, ClinicalTrial> {
  name = 'eligibility-analyzer';
  canStream = true;
  
  private config: EligibilityAnalyzerConfig;
  
  constructor(config: EligibilityAnalyzerConfig = {}) {
    super();
    this.config = {
      detailed: true,
      extractCriteria: true,
      maxDetailedAnalysis: 10,
      streamFullCriteria: true,
      ...config
    };
  }
  
  async execute(
    trials: ClinicalTrial[], 
    context: OperatorContext
  ): Promise<ClinicalTrial[]> {
    this.startExecution(trials.length);
    
    const healthProfile = context.healthProfile;
    
    if (!healthProfile) {
      this.logWarning('No health profile available for eligibility analysis');
    }
    
    // Stream analysis start
    await this.streamData(
      { 
        trialCount: trials.length,
        hasProfile: !!healthProfile,
        detailed: this.config.detailed,
        maxDetailed: this.config.maxDetailedAnalysis
      },
      'analysis_start',
      context
    );
    
    // Analyze each trial
    const analyzedTrials = await Promise.all(
      trials.map(async (trial, index) => {
        const isDetailed = this.config.detailed && 
                          index < (this.config.maxDetailedAnalysis || 10);
        
        const analysis = await this.analyzeEligibility(
          trial,
          healthProfile || null,
          isDetailed || false
        );
        
        // Stream full criteria for top trials if enabled
        if (isDetailed && this.config.streamFullCriteria) {
          await this.streamFullCriteria(trial, analysis, context);
        }
        
        return {
          ...trial,
          _eligibilityAnalysis: analysis
        };
      })
    );
    
    // Calculate statistics
    const stats = this.calculateEligibilityStats(analyzedTrials);
    
    // Stream analysis complete
    await this.streamData(
      { 
        analyzed: analyzedTrials.length,
        likelyEligible: stats.likelyEligible,
        averageScore: stats.averageScore,
        withDetailedAnalysis: stats.withDetailed
      },
      'analysis_complete',
      context
    );
    
    // Add metadata
    this.addMetadata('eligibilityStats', stats);
    this.addMetadata('profileUsed', !!healthProfile);
    
    this.endExecution(analyzedTrials.length);
    return analyzedTrials;
  }
  
  private async analyzeEligibility(
    trial: ClinicalTrial,
    healthProfile: HealthProfile | null,
    detailed: boolean
  ): Promise<EligibilityAnalysis> {
    const analysis: EligibilityAnalysis = {
      likelyEligible: true,
      eligibilityScore: 0,
      inclusionMatches: [],
      exclusionConcerns: [],
      uncertainFactors: [],
      missingInformation: []
    };
    
    const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
    
    if (!eligibilityCriteria) {
      analysis.uncertainFactors.push('Eligibility criteria not available');
      analysis.eligibilityScore = 0.5;
      return analysis;
    }
    
    // Extract structured criteria if enabled
    if (detailed && this.config.extractCriteria) {
      analysis.structuredCriteria = this.extractStructuredCriteria(eligibilityCriteria);
    }
    
    if (!healthProfile) {
      analysis.missingInformation.push('Health profile needed for personalized assessment');
      analysis.eligibilityScore = 0.5;
      return analysis;
    }
    
    // Analyze age eligibility
    this.analyzeAge(trial, healthProfile, analysis);
    
    // Analyze cancer type match
    this.analyzeCancerType(trial, healthProfile, analysis);
    
    // Analyze molecular markers
    this.analyzeMolecularMarkers(trial, healthProfile, analysis);
    
    // Analyze stage
    this.analyzeStage(trial, healthProfile, analysis);
    
    // Analyze prior treatments
    this.analyzePriorTreatments(trial, healthProfile, analysis);
    
    // Calculate final score
    analysis.eligibilityScore = this.calculateScore(analysis);
    analysis.likelyEligible = analysis.eligibilityScore > 0.6 && 
                              analysis.exclusionConcerns.length === 0;
    
    return analysis;
  }
  
  private extractStructuredCriteria(criteria: string) {
    const structured = {
      mutations: [] as string[],
      mainRequirements: [] as string[],
      keyExclusions: [] as string[]
    };
    
    // Extract mutation mentions
    const mutationPattern = /\b[A-Z]+[0-9]+[A-Z]?\b|\b[A-Z]{2,}[-\s]?[A-Z0-9]+\b/g;
    const mutations = criteria.match(mutationPattern) || [];
    structured.mutations = [...new Set(mutations)];
    
    // Extract inclusion criteria
    const inclusionMatch = criteria.match(/inclusion criteria:?(.*?)(?:exclusion|$)/is);
    if (inclusionMatch) {
      const inclusions = inclusionMatch[1].split(/[;\n]/).filter(s => s.trim());
      structured.mainRequirements = inclusions.slice(0, 5).map(s => s.trim());
    }
    
    // Extract exclusion criteria
    const exclusionMatch = criteria.match(/exclusion criteria:?(.*?)(?:$)/is);
    if (exclusionMatch) {
      const exclusions = exclusionMatch[1].split(/[;\n]/).filter(s => s.trim());
      structured.keyExclusions = exclusions.slice(0, 5).map(s => s.trim());
    }
    
    return structured;
  }
  
  private analyzeAge(
    trial: ClinicalTrial,
    profile: HealthProfile,
    analysis: EligibilityAnalysis
  ): void {
    const minAge = trial.protocolSection?.eligibilityModule?.minimumAge;
    const maxAge = trial.protocolSection?.eligibilityModule?.maximumAge;
    const patientAge = profile.age;
    
    // Convert age strings to numbers for comparison
    const parseAge = (ageStr: string | undefined): number | null => {
      if (!ageStr || ageStr === 'N/A') return null;
      const match = ageStr.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : null;
    };
    
    const minAgeNum = parseAge(minAge);
    const maxAgeNum = parseAge(maxAge);
    
    if (patientAge) {
      // Check if patient meets age requirements
      if (minAgeNum && patientAge >= minAgeNum) {
        analysis.inclusionMatches.push(`Age ${patientAge} meets minimum requirement (${minAge})`);
      } else if (minAgeNum && patientAge < minAgeNum) {
        analysis.exclusionConcerns.push(`Age ${patientAge} below minimum requirement (${minAge})`);
      }
      
      if (maxAgeNum && maxAgeNum < 999 && patientAge <= maxAgeNum) {
        analysis.inclusionMatches.push(`Age ${patientAge} within maximum limit (${maxAge})`);
      } else if (maxAgeNum && maxAgeNum < 999 && patientAge > maxAgeNum) {
        analysis.exclusionConcerns.push(`Age ${patientAge} exceeds maximum limit (${maxAge})`);
      }
    } else {
      // No age in profile, just show requirements
      if (minAge && minAge !== 'N/A') {
        analysis.inclusionMatches.push(`Age requirement: ${minAge}+`);
      }
      
      if (maxAge && maxAge !== 'N/A' && maxAge !== '999 Years') {
        analysis.inclusionMatches.push(`Age limit: up to ${maxAge}`);
      }
    }
  }
  
  private analyzeCancerType(
    trial: ClinicalTrial,
    profile: HealthProfile,
    analysis: EligibilityAnalysis
  ): void {
    const cancerType = profile.cancerType || profile.cancer_type;
    if (!cancerType) {
      analysis.missingInformation.push('Cancer type not specified in profile');
      return;
    }
    
    const conditions = trial.protocolSection?.conditionsModule?.conditions || [];
    const summary = trial.protocolSection?.descriptionModule?.briefSummary || '';
    
    const normalizedCancerType = cancerType.toLowerCase();
    const matchesCondition = conditions.some(c => 
      c.toLowerCase().includes(normalizedCancerType)
    );
    
    if (matchesCondition) {
      analysis.inclusionMatches.push(`${cancerType} diagnosis matches trial`);
    } else if (summary.toLowerCase().includes(normalizedCancerType)) {
      analysis.inclusionMatches.push(`${cancerType} mentioned in trial description`);
    }
  }
  
  private analyzeMolecularMarkers(
    trial: ClinicalTrial,
    profile: HealthProfile,
    analysis: EligibilityAnalysis
  ): void {
    if (!profile.molecularMarkers && !profile.mutations) {
      analysis.missingInformation.push('Molecular markers not specified in profile');
      return;
    }
    
    const trialText = [
      trial.protocolSection?.identificationModule?.briefTitle,
      trial.protocolSection?.descriptionModule?.briefSummary,
      trial.protocolSection?.eligibilityModule?.eligibilityCriteria
    ].join(' ').toLowerCase();
    
    // Check molecular markers
    if (profile.molecularMarkers) {
      Object.entries(profile.molecularMarkers).forEach(([marker, status]) => {
        if (status === 'POSITIVE' || status === 'HIGH') {
          const markerName = marker.replace(/_/g, ' ').toUpperCase();
          if (trialText.includes(marker.toLowerCase()) || 
              trialText.includes(markerName.toLowerCase())) {
            analysis.inclusionMatches.push(`${markerName} ${status} matches trial criteria`);
          }
        }
      });
    }
    
    // Check mutations
    if (profile.mutations) {
      profile.mutations.forEach(mutation => {
        if (trialText.includes(mutation.toLowerCase())) {
          analysis.inclusionMatches.push(`${mutation} mutation matches trial`);
        }
      });
    }
  }
  
  private analyzeStage(
    trial: ClinicalTrial,
    profile: HealthProfile,
    analysis: EligibilityAnalysis
  ): void {
    const stage = profile.diseaseStage || profile.stage;
    
    if (!stage) {
      analysis.missingInformation.push('Disease stage not specified in profile');
      return;
    }
    
    // Normalize stage format (convert STAGE_III to Stage III, etc.)
    const normalizedStageDisplay = stage.replace(/STAGE_/i, 'Stage ').replace(/_/g, ' ');
    
    const eligibility = trial.protocolSection?.eligibilityModule?.eligibilityCriteria || '';
    const summary = trial.protocolSection?.descriptionModule?.briefSummary || '';
    
    const normalizedStage = stage.toLowerCase();
    
    if (eligibility.toLowerCase().includes(normalizedStage) || 
        summary.toLowerCase().includes(normalizedStage)) {
      analysis.inclusionMatches.push(`${normalizedStageDisplay} matches trial stage requirements`);
    }
    
    // Check for advanced/metastatic mentions
    if ((normalizedStage.includes('iv') || normalizedStage.includes('4')) &&
        (eligibility.toLowerCase().includes('advanced') || 
         eligibility.toLowerCase().includes('metastatic'))) {
      analysis.inclusionMatches.push('Advanced/metastatic disease matches trial');
    }
    
    // Add the stage to the inclusion matches for display
    if (!analysis.inclusionMatches.some(match => match.includes('Stage'))) {
      analysis.inclusionMatches.push(`Patient stage: ${normalizedStageDisplay}`);
    }
  }
  
  private analyzePriorTreatments(
    trial: ClinicalTrial,
    profile: HealthProfile,
    analysis: EligibilityAnalysis
  ): void {
    const treatments = profile.treatments || profile.treatmentHistory;
    if (!treatments) {
      analysis.missingInformation.push('Treatment history not specified in profile');
      return;
    }
    
    const eligibility = trial.protocolSection?.eligibilityModule?.eligibilityCriteria || '';
    
    // Check for treatment requirements
    if (eligibility.toLowerCase().includes('prior') || 
        eligibility.toLowerCase().includes('previous')) {
      analysis.uncertainFactors.push('Prior treatment requirements need review');
    }
  }
  
  private calculateScore(analysis: EligibilityAnalysis): number {
    let score = 0.5; // Start neutral
    
    // Positive factors
    score += analysis.inclusionMatches.length * 0.1;
    
    // Negative factors
    score -= analysis.exclusionConcerns.length * 0.2;
    score -= analysis.uncertainFactors.length * 0.05;
    score -= analysis.missingInformation.length * 0.05;
    
    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, score));
  }
  
  private async streamFullCriteria(
    trial: ClinicalTrial,
    analysis: EligibilityAnalysis,
    context: OperatorContext
  ): Promise<void> {
    if (!context.dataStream) return;
    
    const criteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
    if (!criteria) return;
    
    context.dataStream.writeMessageAnnotation({
      type: 'full_eligibility_criteria',
      data: {
        trialId: trial.protocolSection?.identificationModule?.nctId,
        title: trial.protocolSection?.identificationModule?.briefTitle,
        fullCriteria: criteria,
        structuredCriteria: analysis.structuredCriteria,
        eligibilityScore: analysis.eligibilityScore,
        likelyEligible: analysis.likelyEligible,
        analysisHints: {
          checkAgainst: ['mutations', 'priorTreatments', 'performanceStatus', 'organFunction'],
          profileMatches: context.healthProfile ? {
            hasCancerType: !!context.healthProfile.cancerType,
            hasMutations: !!(context.healthProfile.molecularMarkers || context.healthProfile.mutations),
            hasStage: !!(context.healthProfile.diseaseStage || context.healthProfile.stage),
            hasPriorTreatments: !!(context.healthProfile.treatments || context.healthProfile.treatmentHistory)
          } : null
        }
      }
    });
  }
  
  private calculateEligibilityStats(trials: any[]) {
    const withAnalysis = trials.filter(t => t._eligibilityAnalysis);
    const likelyEligible = withAnalysis.filter(t => 
      t._eligibilityAnalysis.likelyEligible
    ).length;
    
    const totalScore = withAnalysis.reduce((sum, t) => 
      sum + (t._eligibilityAnalysis.eligibilityScore || 0), 0
    );
    
    return {
      total: trials.length,
      analyzed: withAnalysis.length,
      likelyEligible,
      averageScore: withAnalysis.length > 0 ? totalScore / withAnalysis.length : 0,
      withDetailed: withAnalysis.filter(t => 
        t._eligibilityAnalysis.structuredCriteria
      ).length
    };
  }
}
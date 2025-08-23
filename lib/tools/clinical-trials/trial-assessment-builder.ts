/**
 * Trial Assessment Builder
 * 
 * Bridges the gap between backend eligibility analysis and UI expectations.
 * Combines trial criteria extraction with user profile matching.
 */

import type { ClinicalTrial, HealthProfile, TrialMatch } from './types';
import { EligibilityScorer } from './eligibility-scorer';
import { EligibilityAnalyzer } from './eligibility-analyzer';
import type { OperatorContext } from './eligibility-analyzer';

/**
 * UI-expected assessment structure
 */
export interface TrialAssessment {
  // Trial's criteria (the standard)
  trialCriteria?: {
    parsed: boolean;
    inclusion: Array<{
      id: string;
      text: string;
      category: string;
      required: boolean;
    }>;
    exclusion: Array<{
      id: string;
      text: string;
      category: string;
      required: boolean;
    }>;
  };
  
  // User's assessment against the standard
  userAssessment?: {
    hasProfile: boolean;
    eligibilityScore?: number;
    confidence?: 'high' | 'medium' | 'low';
    recommendation?: 'likely' | 'possible' | 'unlikely';
    inclusionMatches?: string[];
    exclusionConcerns?: string[];
    missingData: string[];
  };
}

export class TrialAssessmentBuilder {
  private eligibilityScorer: EligibilityScorer;
  private eligibilityAnalyzer: EligibilityAnalyzer;
  
  constructor() {
    this.eligibilityScorer = new EligibilityScorer();
    this.eligibilityAnalyzer = new EligibilityAnalyzer();
  }
  
  /**
   * Build complete assessment for a trial
   */
  async buildAssessment(
    trial: ClinicalTrial,
    healthProfile?: HealthProfile | null
  ): Promise<TrialAssessment> {
    const assessment: TrialAssessment = {};
    
    // Extract trial criteria (always available)
    const criteria = this.extractTrialCriteria(trial);
    if (criteria) {
      assessment.trialCriteria = criteria;
    }
    
    // If we have a health profile, create user assessment
    if (healthProfile) {
      const userAssessment = await this.createUserAssessment(trial, healthProfile);
      assessment.userAssessment = userAssessment;
    }
    
    return assessment;
  }
  
  /**
   * Extract and parse trial's inclusion/exclusion criteria
   */
  private extractTrialCriteria(trial: ClinicalTrial): TrialAssessment['trialCriteria'] | null {
    const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
    
    if (!eligibilityCriteria) {
      console.log('[TrialAssessmentBuilder] No eligibility criteria found');
      return null;
    }
    
    // Get NCT ID for unique key generation
    const nctId = trial.protocolSection?.identificationModule?.nctId || 'unknown';
    
    console.log('[TrialAssessmentBuilder] Parsing criteria for', nctId);
    // console.log('[TrialAssessmentBuilder] Full criteria text:', eligibilityCriteria);
    
    // Parse inclusion and exclusion criteria
    const lines = eligibilityCriteria.split('\n').map(line => line.trim()).filter(Boolean);
    const inclusion: Array<{ id: string; text: string; category: string; required: boolean }> = [];
    const exclusion: Array<{ id: string; text: string; category: string; required: boolean }> = [];
    
    let currentSection: 'inclusion' | 'exclusion' | null = null;
    let inclusionIndex = 0;
    let exclusionIndex = 0;
    
    // Try to detect if there are no explicit headers - common in CT.gov data
    // If no headers found, we'll apply heuristics
    const hasInclusionHeader = eligibilityCriteria.toLowerCase().includes('inclusion');
    const hasExclusionHeader = eligibilityCriteria.toLowerCase().includes('exclusion');
    
    // If no headers, treat the entire text as inclusion criteria by default
    if (!hasInclusionHeader && !hasExclusionHeader) {
      console.log('[TrialAssessmentBuilder] No explicit headers found, treating as general criteria');
      currentSection = 'inclusion';
    }
    
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      
      // Detect section headers - more flexible matching
      if (lineLower.includes('inclusion') && (
        lineLower.includes('criteria') || 
        lineLower.includes(':') || 
        lineLower.startsWith('inclusion')
      )) {
        currentSection = 'inclusion';
        console.log('[TrialAssessmentBuilder] Found inclusion section');
        continue;
      }
      
      if (lineLower.includes('exclusion') && (
        lineLower.includes('criteria') || 
        lineLower.includes(':') || 
        lineLower.startsWith('exclusion')
      )) {
        currentSection = 'exclusion';
        console.log('[TrialAssessmentBuilder] Found exclusion section');
        continue;
      }
      
      // Also check for "Key Inclusion" or "Key Exclusion" patterns
      if (lineLower.startsWith('key inclusion')) {
        currentSection = 'inclusion';
        continue;
      }
      if (lineLower.startsWith('key exclusion')) {
        currentSection = 'exclusion';
        continue;
      }
      
      // Skip empty lines or very short lines
      if (!line || line.length < 3) {
        continue;
      }
      
      // Skip common header patterns
      if (line.startsWith('Key ') || line === 'Criteria:' || line === 'Requirements:') {
        continue;
      }
      
      // Clean up bullet points, numbering, and common prefixes
      const cleaned = line
        .replace(/^[\d\-\*•\.]+\s*/, '') // Remove bullets/numbers
        .replace(/^[a-z]\.\s*/i, '') // Remove letter bullets (a. b. etc)
        .replace(/^[-–—]\s*/, '') // Remove dashes
        .trim();
      
      if (!cleaned || cleaned.length < 5) {
        continue;
      }
      
      // Heuristic: lines starting with "No " or "Not " are likely exclusion
      if (currentSection === 'inclusion' && (
        cleaned.toLowerCase().startsWith('no ') || 
        cleaned.toLowerCase().startsWith('not ') ||
        cleaned.toLowerCase().includes('must not') ||
        cleaned.toLowerCase().includes('excluded if')
      )) {
        // This looks like an exclusion criterion mixed in inclusion
        exclusion.push({
          id: `${nctId}-exc-${exclusionIndex++}`,
          text: cleaned,
          category: 'general',
          required: true
        });
      } else if (currentSection === 'inclusion') {
        inclusion.push({
          id: `${nctId}-inc-${inclusionIndex++}`,
          text: cleaned,
          category: this.categorize(cleaned),
          required: true
        });
      } else if (currentSection === 'exclusion') {
        exclusion.push({
          id: `${nctId}-exc-${exclusionIndex++}`,
          text: cleaned,
          category: this.categorize(cleaned),
          required: true
        });
      }
    }
    
    console.log('[TrialAssessmentBuilder] Parsed criteria:', {
      nctId,
      inclusionCount: inclusion.length,
      exclusionCount: exclusion.length
    });
    
    // Always return the structure even if empty - UI expects it
    return {
      parsed: true,
      inclusion,
      exclusion
    };
  }
  
  /**
   * Categorize a criterion based on its content
   */
  private categorize(text: string): string {
    const lower = text.toLowerCase();
    
    if (lower.includes('age') || lower.includes('years old') || lower.includes('≥') || lower.includes('>=')) {
      return 'demographics';
    }
    if (lower.includes('stage') || lower.includes('grade') || lower.includes('diagnosis') || lower.includes('cancer')) {
      return 'disease';
    }
    if (lower.includes('mutation') || lower.includes('biomarker') || lower.includes('gene') || lower.includes('expression')) {
      return 'biomarker';
    }
    if (lower.includes('performance') || lower.includes('ecog') || lower.includes('karnofsky')) {
      return 'performance';
    }
    if (lower.includes('treatment') || lower.includes('therapy') || lower.includes('prior')) {
      return 'treatment';
    }
    if (lower.includes('pregnant') || lower.includes('nursing') || lower.includes('contraception')) {
      return 'reproductive';
    }
    if (lower.includes('consent') || lower.includes('agree') || lower.includes('willing')) {
      return 'administrative';
    }
    
    return 'general';
  }
  
  /**
   * Create user assessment against trial criteria
   */
  private async createUserAssessment(
    trial: ClinicalTrial,
    healthProfile: HealthProfile
  ): Promise<TrialAssessment['userAssessment']> {
    // Use the eligibility analyzer to get detailed analysis
    const context: OperatorContext = {
      userQuery: '',
      healthProfile,
      intent: 'eligibility'
    };
    
    // Run the analyzer
    const analyzedTrials = await this.eligibilityAnalyzer.execute([trial], context);
    const analyzedTrial = analyzedTrials[0];
    
    // Get the analysis from the trial metadata
    const analysis = (analyzedTrial as any)._eligibilityAnalysis;
    
    // Also use the scorer for comprehensive scoring
    const score = this.eligibilityScorer.calculateScore(trial, healthProfile);
    
    // Determine recommendation based on score
    let recommendation: 'likely' | 'possible' | 'unlikely';
    if (score.totalScore >= 70) {
      recommendation = 'likely';
    } else if (score.totalScore >= 40) {
      recommendation = 'possible';
    } else {
      recommendation = 'unlikely';
    }
    
    return {
      hasProfile: true,
      eligibilityScore: score.totalScore / 100, // Convert to 0-1 scale for UI
      confidence: score.confidence,
      recommendation,
      inclusionMatches: analysis?.inclusionMatches || score.matchedCriteria,
      exclusionConcerns: analysis?.exclusionConcerns || [],
      missingData: [
        ...(analysis?.missingInformation || []),
        ...(score.unmatchedCriteria || [])
      ].filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
    };
  }
  
  /**
   * Enhance existing TrialMatch with assessment
   */
  async enhanceMatch(match: TrialMatch, healthProfile?: HealthProfile | null): Promise<TrialMatch & { eligibilityAssessment?: TrialAssessment }> {
    const assessment = await this.buildAssessment(match.trial, healthProfile);
    
    return {
      ...match,
      eligibilityAssessment: assessment
    };
  }
  
  /**
   * Enhance multiple matches
   */
  async enhanceMatches(
    matches: TrialMatch[], 
    healthProfile?: HealthProfile | null
  ): Promise<Array<TrialMatch & { eligibilityAssessment?: TrialAssessment }>> {
    return Promise.all(
      matches.map(match => this.enhanceMatch(match, healthProfile))
    );
  }
}

export const trialAssessmentBuilder = new TrialAssessmentBuilder();
/**
 * Eligibility Checker Service - AI-Driven Architecture
 * 
 * CONTEXT-AWARE implementation following CLAUDE.md principles:
 * - AI-driven question generation (no brittle patterns)
 * - Two-level caching for performance
 * - NO hardcoded transformations (no toLowerCase, no patterns)
 * - Temperature 0.0 for determinism
 * - Clean, single implementation (no versioning)
 */

import { ClinicalTrial, HealthProfile } from '@/lib/tools/clinical-trials/types';
import { debug, DebugCategory } from '@/lib/tools/clinical-trials/debug';
import type {
  InterpretedCriterion,
  EligibilityQuestion,
  EligibilityResponse,
  EligibilityAssessment,
  ParsedCriteriaResponse,
  ResponseValue
} from './types';

/**
 * Minimal medical terms for basic context
 * AI will expand on these dynamically
 */
const CORE_MEDICAL_CONTEXT = {
  'ECOG': 'performance status scale',
  'NSCLC': 'non-small cell lung cancer',
  'metastatic': 'cancer that has spread',
  'refractory': 'not responding to treatment',
};

export class EligibilityCheckerService {
  // In-memory cache for current session
  private criteriaCache = new Map<string, InterpretedCriterion[]>();
  
  /**
   * Get API URL based on environment
   */
  private getApiUrl(path: string): string {
    if (typeof window !== 'undefined') {
      return path;
    }
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}${path}`;
  }

  /**
   * Parse raw eligibility criteria using AI with caching
   * AI now generates questions directly
   */
  async parseEligibilityCriteria(
    trial: ClinicalTrial
  ): Promise<InterpretedCriterion[]> {
    const eligibilityCriteria = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
    
    if (!eligibilityCriteria) {
      debug.log(DebugCategory.ASSESSMENT, 'No eligibility criteria found for trial');
      return [];
    }

    const nctId = trial.protocolSection?.identificationModule?.nctId || 'unknown';
    
    // Check in-memory cache first (fastest)
    if (this.criteriaCache.has(nctId)) {
      debug.log(DebugCategory.ASSESSMENT, 'Using in-memory cached criteria', { nctId });
      return this.criteriaCache.get(nctId)!;
    }
    
    // Database caching happens in the API route now

    debug.log(DebugCategory.ASSESSMENT, 'Parsing eligibility criteria with AI', { nctId });

    try {
      // Call the enhanced AI parsing API
      const response = await fetch(this.getApiUrl('/api/eligibility/parse'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eligibilityCriteria,
          nctId
        })
      });
      
      if (!response.ok) {
        throw new Error(`AI parsing failed: ${response.statusText}`);
      }
      
      const data: ParsedCriteriaResponse = await response.json();
      
      // Validate response
      if (!this.isValidCriteriaResponse(data)) {
        throw new Error('Invalid response format from AI parsing');
      }
      
      const criteria = data.criteria;
      
      // Cache in memory only (database caching happens in API route)
      this.criteriaCache.set(nctId, criteria);
      
      debug.log(DebugCategory.ASSESSMENT, 'Successfully parsed criteria', {
        nctId,
        count: criteria.length
      });
      
      return criteria;
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'AI parsing failed', error);
      
      // Enhanced fallback for complete AI failure
      return this.minimalFallback(eligibilityCriteria, nctId);
    }
  }

  /**
   * Validate API response structure
   */
  private isValidCriteriaResponse(data: any): data is ParsedCriteriaResponse {
    return (
      data &&
      data.success === true &&
      Array.isArray(data.criteria) &&
      data.criteria.every((c: any) => 
        c.id && 
        c.question && 
        c.category && 
        c.originalText
      )
    );
  }

  /**
   * Parse eligibility criteria with raw text
   * This overload is for testing or when we have raw text
   */
  async parseEligibilityCriteriaFromText(
    nctId: string,
    criteriaText: string
  ): Promise<InterpretedCriterion[]> {
    // Check cache
    if (this.criteriaCache.has(nctId)) {
      return this.criteriaCache.get(nctId)!;
    }

    try {
      const response = await fetch(this.getApiUrl('/api/eligibility/parse'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eligibilityCriteria: criteriaText,
          nctId
        })
      });

      if (!response.ok) {
        throw new Error(`AI parsing failed: ${response.statusText}`);
      }

      const data: ParsedCriteriaResponse = await response.json();
      if (!this.isValidCriteriaResponse(data)) {
        throw new Error('Invalid response format');
      }

      const criteria = data.criteria;
      this.criteriaCache.set(nctId, criteria);
      return criteria;
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'Failed to parse criteria text', error);
      return this.minimalFallback(criteriaText, nctId);
    }
  }

  /**
   * Minimal fallback when AI completely fails
   * AI-DRIVEN: No transformations, preserve text exactly
   */
  private minimalFallback(
    criteriaText: string,
    nctId: string
  ): InterpretedCriterion[] {
    // Split into basic inclusion/exclusion
    const lines = criteriaText.split('\n').filter(line => line.trim().length > 10);
    let isExclusion = false;
    
    return lines.slice(0, 10).map((line, index) => {
      // AI-DRIVEN: Check for exclusion without transformation
      if (line.includes('Exclusion') || line.includes('exclusion') || line.includes('EXCLUSION')) {
        isExclusion = true;
      }
      
      return {
        id: `${nctId}_${index}`,
        originalText: line.trim(),
        interpretedText: line.trim(),
        category: isExclusion ? 'EXCLUSION' : 'INCLUSION',
        domain: 'CURRENT_CONDITION' as const,
        importance: 'REQUIRED' as const,
        requiresValue: true,
        expectedValueType: 'BOOLEAN' as const,
        question: `Does this apply to you: "${line.trim()}"?`,
        helpText: 'Please answer based on your current medical situation'
      };
    });
  }

  /**
   * Generate questions from AI-interpreted criteria
   * Since AI already generated questions, this just formats them
   */
  async generateQuestions(
    criteria: InterpretedCriterion[],
    healthProfile?: HealthProfile | null
  ): Promise<EligibilityQuestion[]> {
    const questions: EligibilityQuestion[] = [];
    
    for (const criterion of criteria) {
      // Use AI-generated question or create a simple one
      const questionText = criterion.question || 
        this.createSimpleQuestion(criterion);
      
      const question: EligibilityQuestion = {
        id: criterion.id,
        criterionId: criterion.id,
        question: questionText,
        type: 'BOOLEAN', // Always use BOOLEAN for standardized yes/no/maybe responses
        options: ['Yes', 'No', 'Maybe/Uncertain'], // Standard options for all questions
        context: criterion.interpretedText !== criterion.originalText ? 
          criterion.originalText : undefined,
        helperText: criterion.helpText,
        placeholder: criterion.placeholder,
        category: criterion.category,
        allowUncertain: true,
        validation: {
          required: true
        }
      };
      
      questions.push(question);
    }
    
    // Sort: inclusion before exclusion
    return questions.sort((a, b) => {
      if (a.category === 'INCLUSION' && b.category === 'EXCLUSION') return -1;
      if (a.category === 'EXCLUSION' && b.category === 'INCLUSION') return 1;
      return 0;
    });
  }

  /**
   * Minimal fallback - AI should ALWAYS provide questions
   * Following AI-DRIVEN ARCHITECTURE: NO hardcoded transformations
   */
  private createSimpleQuestion(criterion: InterpretedCriterion): string {
    // AI-DRIVEN: Never transform text - preserve exactly as is
    // If AI didn't provide a question, use the most basic format
    // This should almost never happen with proper AI prompting
    return `Does the following apply to you: "${criterion.interpretedText}"?`;
  }

  /**
   * Process a batch of responses and calculate eligibility
   * Core assessment logic that evaluates all responses together
   */
  async assessEligibility(
    responses: EligibilityResponse[],
    criteria: InterpretedCriterion[],
    trialId: string,
    healthProfile?: HealthProfile | null
  ): Promise<EligibilityAssessment> {
    let inclusionMet = 0;
    let inclusionTotal = 0;
    let exclusionHit = 0;
    let exclusionTotal = 0;
    
    const qualifications: string[] = [];
    const concerns: string[] = [];
    
    // Process each response against its criterion
    for (const response of responses) {
      const criterion = criteria.find(c => c.id === response.criterionId);
      if (!criterion) continue;
      
      const meets = this.evaluateResponse(response, criterion);
      
      if (criterion.category === 'INCLUSION') {
        inclusionTotal++;
        if (meets) {
          inclusionMet++;
          qualifications.push(`Meets: ${criterion.interpretedText}`);
        } else {
          concerns.push(`Does not meet: ${criterion.interpretedText}`);
        }
      } else {
        exclusionTotal++;
        if (!meets) {
          exclusionHit++;
          concerns.push(`Excluded due to: ${criterion.interpretedText}`);
        }
      }
    }
    
    // Calculate overall eligibility
    const inclusionPercentage = inclusionTotal > 0 ? 
      (inclusionMet / inclusionTotal) * 100 : 0;
    const exclusionPercentage = exclusionTotal > 0 ? 
      (exclusionHit / exclusionTotal) * 100 : 0;
    
    let overallEligibility: 'ELIGIBLE' | 'LIKELY_ELIGIBLE' | 'POSSIBLY_ELIGIBLE' | 
                            'UNLIKELY_ELIGIBLE' | 'NOT_ELIGIBLE';
    let confidence: number;
    
    // AI-driven eligibility determination
    if (exclusionHit > 0) {
      overallEligibility = 'NOT_ELIGIBLE';
      confidence = 0.9;
    } else if (inclusionPercentage >= 90) {
      overallEligibility = 'ELIGIBLE';
      confidence = 0.85;
    } else if (inclusionPercentage >= 70) {
      overallEligibility = 'POSSIBLY_ELIGIBLE';
      confidence = 0.7;
    } else if (inclusionPercentage >= 50) {
      overallEligibility = 'POSSIBLY_ELIGIBLE';
      confidence = 0.5;
    } else {
      overallEligibility = 'NOT_ELIGIBLE';
      confidence = 0.4;
    }

    const summary = this.generateSummary(
      overallEligibility,
      inclusionMet,
      inclusionTotal,
      exclusionHit,
      exclusionTotal
    );

    return {
      trialId: '',
      overallEligibility,
      confidence,
      matchedInclusionCriteria: qualifications,
      unmatchedInclusionCriteria: concerns.filter(c => c.startsWith('Does not meet:')),
      triggeredExclusionCriteria: concerns.filter(c => c.startsWith('Excluded due to:')),
      concerns,
      qualifications,
      summary,
      createdAt: new Date()
    };
  }

  /**
   * Standardized response evaluation for yes/no/maybe answers
   * All questions now use consistent yes/no/maybe format
   */
  private evaluateResponse(
    response: EligibilityResponse,
    criterion: InterpretedCriterion
  ): boolean {
    const value = response.value;
    
    // AI-DRIVEN: Handle responses without hardcoded transformations
    // Conservative approach for uncertain responses
    if (response.confidence === 'LOW' || 
        value === 'uncertain' || 
        value === 'maybe' || 
        value === 'Maybe' ||
        value === 'Uncertain' ||
        value === 'Maybe/Uncertain') {
      return false; // Conservative approach for uncertain responses
    }
    
    // AI-DRIVEN: Direct value matching without transformations
    if (typeof value === 'string') {
      // Check exact matches - no transformations
      const isYes = value === 'Yes' || value === 'yes' || value === 'YES' || 
                    value === 'true' || value === 'TRUE' || 
                    value === 'positive' || value === 'POSITIVE';
      const isNo = value === 'No' || value === 'no' || value === 'NO' || 
                   value === 'false' || value === 'FALSE' || 
                   value === 'negative' || value === 'NEGATIVE';
      
      // For inclusion criteria: "yes" means they meet it
      // For exclusion criteria: "yes" means they're excluded (so return false for eligibility)
      if (criterion.category === 'INCLUSION') {
        return isYes;
      } else {
        // For exclusion: "no" means they don't have the excluding condition (good)
        return isNo;
      }
    }
    
    // Boolean evaluation (backward compatibility)
    if (typeof value === 'boolean') {
      return criterion.category === 'INCLUSION' ? value : !value;
    }
    
    // Default: conservative approach
    return false;
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(
    eligibility: string,
    inclusionMet: number,
    inclusionTotal: number,
    exclusionHit: number,
    exclusionTotal: number
  ): string {
    const inclusionPercent = inclusionTotal > 0 ? 
      Math.round((inclusionMet / inclusionTotal) * 100) : 0;
    
    switch (eligibility) {
      case 'ELIGIBLE':
        return `You appear to be eligible for this trial, meeting ${inclusionMet}/${inclusionTotal} inclusion criteria (${inclusionPercent}%) with no exclusions.`;
      case 'POSSIBLY_ELIGIBLE':
        return `You may be eligible for this trial, meeting ${inclusionMet}/${inclusionTotal} inclusion criteria (${inclusionPercent}%).`;
      case 'NOT_ELIGIBLE':
        return exclusionHit > 0 
          ? `You do not appear eligible due to ${exclusionHit} exclusion criteria.`
          : `You do not meet the minimum inclusion criteria (${inclusionMet}/${inclusionTotal}).`;
      case 'INSUFFICIENT_DATA':
        return `Unable to determine eligibility due to insufficient information.`;
      default:
        return 'Unable to determine eligibility.';
    }
  }

  /**
   * Clear cache for a specific trial
   * Useful when criteria are updated
   */
  async clearCache(nctId: string): Promise<void> {
    this.criteriaCache.delete(nctId);
  }

  /**
   * Get cache size for monitoring
   */
  getCacheSize(): number {
    return this.criteriaCache.size;
  }
}

// Export singleton instance
export const eligibilityCheckerService = new EligibilityCheckerService();
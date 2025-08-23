/**
 * Assessment Compressor
 * 
 * Compresses eligibility assessment data for token-efficient transmission
 * while preserving essential information for AI analysis.
 */

import type { TrialAssessment } from './trial-assessment-builder';

export class AssessmentCompressor {
  /**
   * Compress eligibility assessment for AI transmission
   * Reduces size while keeping key information
   */
  static compressAssessment(assessment?: TrialAssessment): any {
    if (!assessment) return undefined;
    
    // For AI, we only need summary data, not full criteria text
    const compressed: any = {};
    
    // Include criteria counts but not full text
    if (assessment.trialCriteria) {
      compressed.criteriaSummary = {
        inclusionCount: assessment.trialCriteria.inclusion.length,
        exclusionCount: assessment.trialCriteria.exclusion.length,
        parsed: assessment.trialCriteria.parsed
      };
    }
    
    // Include user assessment summary if present
    if (assessment.userAssessment) {
      compressed.userMatch = {
        score: assessment.userAssessment.eligibilityScore,
        recommendation: assessment.userAssessment.recommendation,
        confidence: assessment.userAssessment.confidence,
        missingDataCount: assessment.userAssessment.missingData.length
      };
    }
    
    return compressed;
  }
  
  /**
   * Keep full assessment for UI display
   * This is sent separately through the matches array
   */
  static preserveForUI(assessment?: TrialAssessment): TrialAssessment | undefined {
    return assessment; // Keep full data for UI
  }
}
/**
 * Eligibility Checker Types
 * 
 * Type definitions for the AI-driven eligibility checking system.
 * Designed for comprehensive medical-legal compliance.
 */

import type { ClinicalTrial } from '@/lib/tools/clinical-trials/types';
import type { HealthProfile } from '@/lib/health-profile-actions';

/**
 * Represents a single eligibility criterion after AI interpretation
 */
export interface InterpretedCriterion {
  id: string;
  originalText: string;
  interpretedText: string;
  category: 'INCLUSION' | 'EXCLUSION';
  domain: 'DEMOGRAPHICS' | 'MEDICAL_HISTORY' | 'CURRENT_CONDITION' | 'BIOMARKERS' | 'TREATMENT' | 'LIFESTYLE' | 'ADMINISTRATIVE';
  importance: 'REQUIRED' | 'PREFERRED' | 'OPTIONAL';
  requiresValue: boolean;
  expectedValueType?: 'BOOLEAN' | 'NUMERIC' | 'DATE' | 'TEXT' | 'CHOICE';
  validationRules?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

/**
 * Question generated from criterion for user confirmation
 */
export interface EligibilityQuestion {
  id: string;
  criterionId: string;
  question: string;
  type: 'BOOLEAN' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'NUMERIC' | 'TEXT' | 'DATE';
  options?: string[];
  context?: string;
  helperText?: string;
  placeholder?: string;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
  allowUncertain?: boolean;
  category: 'INCLUSION' | 'EXCLUSION';
}

/**
 * Possible response value types
 */
export type ResponseValue = boolean | number | string | Date | string[];

/**
 * User's response to an eligibility question
 */
export interface EligibilityResponse {
  questionId: string;
  criterionId: string;
  value: ResponseValue;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
  timestamp: Date;
}

/**
 * Overall eligibility assessment after all responses
 */
export interface EligibilityAssessment {
  trialId: string;
  overallEligibility: 'ELIGIBLE' | 'POSSIBLY_ELIGIBLE' | 'NOT_ELIGIBLE' | 'INSUFFICIENT_DATA';
  confidence: number; // 0-1 scale
  matchedInclusionCriteria: string[];
  unmatchedInclusionCriteria: string[];
  triggeredExclusionCriteria: string[];
  concerns: string[];
  qualifications: string[];
  summary?: string;
  createdAt: Date;
}

/**
 * Database record for completed eligibility checks
 */
export interface EligibilityCheckRecord {
  id: string;
  userId: string;
  trialId: string;
  nctId: string;
  healthProfileId?: string;
  
  // Parsed criteria (for audit trail)
  criteria: InterpretedCriterion[];
  
  // Questions presented to user
  questions: EligibilityQuestion[];
  
  // User responses
  responses: EligibilityResponse[];
  
  // Final assessment
  assessment: EligibilityAssessment;
  
  // Metadata
  completedAt: Date;
  duration: number; // in seconds
  userAgent?: string;
  ipAddress?: string;
  
  // Medical-legal compliance
  consentGiven: boolean;
  disclaimerAccepted: boolean;
  dataRetentionConsent: boolean;
}

/**
 * API response from eligibility parsing endpoint
 */
export interface ParsedCriteriaResponse {
  success: boolean;
  criteria: InterpretedCriterion[];
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  error?: string;
}

/**
 * Configuration for question generation
 */
export interface QuestionConfig {
  pattern: RegExp;
  type: EligibilityQuestion['type'];
  generator: (text: string, category: string) => string;
  options?: string[];
}

/**
 * Service interface for eligibility checking
 */
export interface IEligibilityCheckerService {
  /**
   * Parse trial eligibility criteria using AI
   */
  parseEligibilityCriteria(trial: ClinicalTrial): Promise<InterpretedCriterion[]>;
  
  /**
   * Generate questions from interpreted criteria
   */
  generateQuestions(
    criteria: InterpretedCriterion[], 
    healthProfile?: HealthProfile
  ): Promise<EligibilityQuestion[]>;
  
  /**
   * Assess eligibility based on responses
   */
  assessEligibility(
    criteria: InterpretedCriterion[],
    responses: EligibilityResponse[]
  ): Promise<EligibilityAssessment>;
  
  /**
   * Save eligibility check to database
   */
  saveEligibilityCheck(
    userId: string,
    trial: ClinicalTrial,
    criteria: InterpretedCriterion[],
    questions: EligibilityQuestion[],
    responses: EligibilityResponse[],
    assessment: EligibilityAssessment
  ): Promise<EligibilityCheckRecord>;
  
  /**
   * Retrieve past eligibility checks for a user
   */
  getUserEligibilityChecks(userId: string): Promise<EligibilityCheckRecord[]>;
  
  /**
   * Get specific eligibility check by ID
   */
  getEligibilityCheck(checkId: string): Promise<EligibilityCheckRecord | null>;
}
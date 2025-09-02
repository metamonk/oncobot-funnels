/**
 * Eligibility Checker Service
 * 
 * CONTEXT-AWARE implementation following CLAUDE.md principles:
 * - Proper TypeScript types (no 'any')
 * - Environment-aware API calls
 * - Caching for performance
 * - Simplified question generation
 * - Better error handling
 */

import { ClinicalTrial, HealthProfile } from '@/lib/tools/clinical-trials/types';
import { debug, DebugCategory } from '@/lib/tools/clinical-trials/debug';
import type {
  InterpretedCriterion,
  EligibilityQuestion,
  EligibilityResponse,
  EligibilityAssessment,
  ParsedCriteriaResponse,
  QuestionConfig,
  ResponseValue
} from './types';

/**
 * Question generation patterns - configuration-driven approach
 */
const QUESTION_PATTERNS: QuestionConfig[] = [
  {
    pattern: /\bage\s+(\d+|≥|>=|≤|<=)/i,
    type: 'NUMERIC',
    generator: () => 'What is your age?'
  },
  {
    pattern: /\becog\b|\bperformance status\b/i,
    type: 'SINGLE_CHOICE',
    generator: () => 'What is your current activity level?',
    options: [
      '0 - Fully active',
      '1 - Restricted but ambulatory',
      '2 - Ambulatory but unable to work',
      '3 - Limited self-care',
      '4 - Completely disabled'
    ]
  },
  {
    pattern: /\bpregnant\b|\bnursing\b|\bbreastfeeding\b/i,
    type: 'BOOLEAN',
    generator: () => 'Are you currently pregnant or nursing?'
  },
  {
    pattern: /\bconsent\b|\bwilling\b/i,
    type: 'BOOLEAN',
    generator: (text: string) => `Are you willing and able to: ${text}?`
  },
  {
    pattern: /\badequate\s+(organ|marrow|function)\b/i,
    type: 'BOOLEAN',
    generator: () => 'Do you have adequate organ function as determined by recent lab tests?'
  },
  {
    pattern: /\bbrain\s+metastas/i,
    type: 'BOOLEAN',
    generator: () => 'Do you have brain metastases (cancer that has spread to the brain)?'
  }
];

/**
 * Medical term replacements for simplification
 */
const MEDICAL_TERMS: Record<string, string> = {
  'ECOG': 'Eastern Cooperative Oncology Group performance status',
  'metastatic': 'cancer that has spread',
  'refractory': 'not responding to treatment',
  'contraindicated': 'should not be used',
  'hepatic': 'liver',
  'renal': 'kidney',
  'cardiac': 'heart',
  'pulmonary': 'lung',
  'hematologic': 'blood-related',
  'CNS': 'central nervous system (brain and spinal cord)',
  'NSCLC': 'non-small cell lung cancer',
  'SCLC': 'small cell lung cancer',
  'PD-L1': 'programmed death-ligand 1',
  'KRAS': 'a gene that can contribute to cancer growth',
  'G12C': 'a specific type of KRAS mutation'
};

export class EligibilityCheckerService {
  // Cache for parsed criteria to avoid redundant AI calls
  private criteriaCache = new Map<string, InterpretedCriterion[]>();
  
  /**
   * Get API URL based on environment
   */
  private getApiUrl(path: string): string {
    if (typeof window !== 'undefined') {
      // Browser context
      return path;
    }
    // Server/test context
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}${path}`;
  }

  /**
   * Parse raw eligibility criteria using AI with caching
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
    
    // Check cache first
    if (this.criteriaCache.has(nctId)) {
      debug.log(DebugCategory.ASSESSMENT, 'Using cached criteria', { nctId });
      return this.criteriaCache.get(nctId)!;
    }

    debug.log(DebugCategory.ASSESSMENT, 'Parsing eligibility criteria', { nctId });

    try {
      // Call the AI parsing API with proper URL
      const response = await fetch(this.getApiUrl('/api/eligibility-check/parse'), {
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
      
      // Check for truncation
      if (this.hasTruncation(data.criteria)) {
        console.warn('AI response contains truncated criteria, using fallback parser');
        const fallbackCriteria = this.simpleParser(eligibilityCriteria, nctId);
        this.criteriaCache.set(nctId, fallbackCriteria);
        return fallbackCriteria;
      }
      
      // Map to internal format with proper types
      const criteria = this.mapApiResponseToCriteria(data.criteria);
      
      // Cache the result
      this.criteriaCache.set(nctId, criteria);
      
      return criteria;
      
    } catch (error) {
      debug.log(DebugCategory.ERROR, 'AI parsing failed, using fallback parser', { error });
      const fallbackCriteria = this.simpleParser(eligibilityCriteria, nctId);
      this.criteriaCache.set(nctId, fallbackCriteria);
      return fallbackCriteria;
    }
  }

  /**
   * Type guard for API response validation
   */
  private isValidCriteriaResponse(data: unknown): data is ParsedCriteriaResponse {
    return (
      typeof data === 'object' &&
      data !== null &&
      'success' in data &&
      'criteria' in data &&
      Array.isArray((data as ParsedCriteriaResponse).criteria)
    );
  }

  /**
   * Check if criteria contain truncation markers
   */
  private hasTruncation(criteria: InterpretedCriterion[]): boolean {
    return criteria.some(c => {
      const text = c.originalText || '';
      return (
        text.includes('more characters') ||
        text.match(/\(\d+ more/) !== null ||
        (text.includes('...') && text.length < 50)
      );
    });
  }

  /**
   * Map API response to internal criterion format
   */
  private mapApiResponseToCriteria(apiCriteria: InterpretedCriterion[]): InterpretedCriterion[] {
    return apiCriteria.map(c => ({
      id: c.id,
      originalText: c.originalText,
      interpretedText: c.interpretedText || this.simplifyMedicalLanguage(c.originalText),
      category: this.normalizeCategory(c.category),
      domain: c.domain,
      importance: c.importance,
      requiresValue: c.requiresValue !== false,
      expectedValueType: c.expectedValueType,
      validationRules: c.validationRules
    }));
  }

  /**
   * Normalize category to uppercase
   */
  private normalizeCategory(category: string): 'INCLUSION' | 'EXCLUSION' {
    return category.toUpperCase() as 'INCLUSION' | 'EXCLUSION';
  }

  /**
   * Simple parser fallback when AI parsing fails
   */
  private simpleParser(
    criteriaText: string,
    nctId: string
  ): InterpretedCriterion[] {
    const lines = criteriaText.split('\n').map(line => line.trim()).filter(Boolean);
    const criteria: InterpretedCriterion[] = [];
    
    let currentSection: 'INCLUSION' | 'EXCLUSION' = 'INCLUSION';
    let criterionIndex = 0;

    for (const line of lines) {
      const lineLower = line.toLowerCase();
      
      // Detect section changes
      if (lineLower.includes('inclusion')) {
        currentSection = 'INCLUSION';
        continue;
      }
      if (lineLower.includes('exclusion')) {
        currentSection = 'EXCLUSION';
        continue;
      }

      // Skip headers and short lines
      if (line.length < 10 || lineLower.includes('criteria:')) {
        continue;
      }

      // Clean up common prefixes
      const cleanedLine = line
        .replace(/^[-•*]\s*/, '')
        .replace(/^\d+\.\s*/, '')
        .trim();
      
      if (cleanedLine.length < 5) {
        continue;
      }
      
      // Create interpreted criterion
      const criterion: InterpretedCriterion = {
        id: `${nctId}_${currentSection}_${criterionIndex++}`,
        originalText: cleanedLine,
        interpretedText: this.simplifyMedicalLanguage(cleanedLine),
        category: currentSection,
        domain: this.detectDomain(cleanedLine),
        importance: 'REQUIRED',
        requiresValue: true,
        expectedValueType: this.determineValueType(cleanedLine)
      };

      criteria.push(criterion);
    }

    return criteria;
  }

  /**
   * Simplify medical language using term replacements
   */
  private simplifyMedicalLanguage(text: string): string {
    let simplified = text;
    
    for (const [term, replacement] of Object.entries(MEDICAL_TERMS)) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      simplified = simplified.replace(regex, replacement);
    }
    
    return simplified;
  }

  /**
   * Detect domain based on criterion text
   */
  private detectDomain(text: string): InterpretedCriterion['domain'] {
    const lower = text.toLowerCase();
    
    if (lower.includes('age') || lower.includes('gender') || lower.includes('sex')) {
      return 'DEMOGRAPHICS';
    }
    if (lower.includes('history') || lower.includes('previous') || lower.includes('prior')) {
      return 'MEDICAL_HISTORY';
    }
    if (lower.includes('stage') || lower.includes('diagnosis') || lower.includes('cancer')) {
      return 'CURRENT_CONDITION';
    }
    if (lower.includes('mutation') || lower.includes('marker') || lower.includes('gene')) {
      return 'BIOMARKERS';
    }
    if (lower.includes('treatment') || lower.includes('therapy') || lower.includes('drug')) {
      return 'TREATMENT';
    }
    if (lower.includes('pregnant') || lower.includes('smoking') || lower.includes('alcohol')) {
      return 'LIFESTYLE';
    }
    if (lower.includes('consent') || lower.includes('willing') || lower.includes('able')) {
      return 'ADMINISTRATIVE';
    }
    
    return 'CURRENT_CONDITION';
  }

  /**
   * Determine expected value type from text
   */
  private determineValueType(text: string): InterpretedCriterion['expectedValueType'] {
    const lower = text.toLowerCase();
    
    // Check against patterns
    for (const config of QUESTION_PATTERNS) {
      if (config.pattern.test(lower)) {
        switch (config.type) {
          case 'NUMERIC': return 'NUMERIC';
          case 'DATE': return 'DATE';
          case 'SINGLE_CHOICE':
          case 'MULTIPLE_CHOICE': return 'CHOICE';
          default: return 'BOOLEAN';
        }
      }
    }
    
    return 'BOOLEAN';
  }

  /**
   * Generate questions from interpreted criteria
   */
  async generateQuestions(
    criteria: InterpretedCriterion[],
    healthProfile?: HealthProfile | null
  ): Promise<EligibilityQuestion[]> {
    const questions: EligibilityQuestion[] = [];
    
    for (const criterion of criteria) {
      const question = this.createQuestionFromCriterion(criterion, healthProfile);
      questions.push(question);
    }
    
    // Sort by priority and group
    return this.sortQuestions(questions);
  }

  /**
   * Create a question from a criterion
   */
  private createQuestionFromCriterion(
    criterion: InterpretedCriterion,
    healthProfile?: HealthProfile | null
  ): EligibilityQuestion {
    // Find matching pattern
    const config = QUESTION_PATTERNS.find(p => p.pattern.test(criterion.originalText));
    
    let questionText: string;
    let questionType: EligibilityQuestion['type'];
    let options: string[] | undefined;
    
    if (config) {
      questionText = config.generator(criterion.interpretedText, criterion.category);
      questionType = config.type;
      options = config.options;
    } else {
      // Default question generation
      questionText = this.generateDefaultQuestion(criterion);
      questionType = 'BOOLEAN';
    }
    
    return {
      id: criterion.id,
      criterionId: criterion.id,
      question: questionText,
      type: questionType,
      options,
      context: criterion.interpretedText !== criterion.originalText ? criterion.originalText : undefined,
      helperText: this.extractHelpText(criterion.originalText),
      category: criterion.category,
      allowUncertain: true
    };
  }

  /**
   * Generate default question based on category
   */
  private generateDefaultQuestion(criterion: InterpretedCriterion): string {
    const simplified = criterion.interpretedText;
    
    if (criterion.category === 'EXCLUSION') {
      if (criterion.originalText.toLowerCase().includes('history')) {
        return `Do you have a history of: ${simplified}?`;
      }
      return `Do you currently have: ${simplified}?`;
    }
    
    return `Does this describe you: ${simplified}?`;
  }

  /**
   * Extract help text for medical terms
   */
  private extractHelpText(text: string): string | undefined {
    const helpTexts: string[] = [];
    
    for (const [term, explanation] of Object.entries(MEDICAL_TERMS)) {
      if (text.toLowerCase().includes(term.toLowerCase())) {
        helpTexts.push(`${term}: ${explanation}`);
      }
    }
    
    return helpTexts.length > 0 ? helpTexts.join('; ') : undefined;
  }

  /**
   * Sort questions by priority
   */
  private sortQuestions(questions: EligibilityQuestion[]): EligibilityQuestion[] {
    // Group by category first (inclusion before exclusion)
    return questions.sort((a, b) => {
      if (a.category === 'INCLUSION' && b.category === 'EXCLUSION') return -1;
      if (a.category === 'EXCLUSION' && b.category === 'INCLUSION') return 1;
      return 0;
    });
  }

  /**
   * Assess eligibility based on user responses
   */
  async assessEligibility(
    criteria: InterpretedCriterion[],
    responses: EligibilityResponse[]
  ): Promise<EligibilityAssessment> {
    const responseMap = new Map(responses.map(r => [r.questionId, r]));
    
    let inclusionMet = 0;
    let inclusionTotal = 0;
    let exclusionHit = 0;
    let exclusionTotal = 0;
    const concerns: string[] = [];
    const qualifications: string[] = [];

    for (const criterion of criteria) {
      const response = responseMap.get(criterion.id);
      
      if (!response) {
        concerns.push(`No response for: ${criterion.interpretedText}`);
        continue;
      }

      if (criterion.category === 'INCLUSION') {
        inclusionTotal++;
        if (this.meetsInclusionCriterion(criterion, response)) {
          inclusionMet++;
          qualifications.push(criterion.interpretedText);
        } else {
          concerns.push(`Does not meet: ${criterion.interpretedText}`);
        }
      } else {
        exclusionTotal++;
        if (this.hitsExclusionCriterion(criterion, response)) {
          exclusionHit++;
          concerns.push(`Excluded due to: ${criterion.interpretedText}`);
        }
      }
    }

    // Calculate overall eligibility
    const inclusionScore = inclusionTotal > 0 ? inclusionMet / inclusionTotal : 0;
    const hasExclusions = exclusionHit > 0;
    
    let overallEligibility: EligibilityAssessment['overallEligibility'];
    let confidence: number;
    
    if (inclusionScore >= 0.8 && !hasExclusions) {
      overallEligibility = 'ELIGIBLE';
      confidence = 0.9;
    } else if (inclusionScore >= 0.5 && !hasExclusions) {
      overallEligibility = 'POSSIBLY_ELIGIBLE';
      confidence = 0.6;
    } else if (inclusionScore < 0.3 || hasExclusions) {
      overallEligibility = 'NOT_ELIGIBLE';
      confidence = 0.8;
    } else {
      overallEligibility = 'INSUFFICIENT_DATA';
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
   * Check if response meets inclusion criterion
   */
  private meetsInclusionCriterion(
    criterion: InterpretedCriterion,
    response: EligibilityResponse
  ): boolean {
    const value = response.value;
    
    // Handle boolean responses
    if (typeof value === 'boolean') {
      return value;
    }
    
    // Handle string responses that mean "yes"
    if (typeof value === 'string') {
      return value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
    }
    
    // For other types, check if value exists and is not negative
    return value !== null && value !== undefined && (typeof value !== 'string' || (value !== 'no' && value !== 'false'));
  }

  /**
   * Check if response hits exclusion criterion
   */
  private hitsExclusionCriterion(
    criterion: InterpretedCriterion,
    response: EligibilityResponse
  ): boolean {
    const value = response.value;
    
    // For exclusion, a positive response means exclusion
    if (typeof value === 'boolean') {
      return value;
    }
    
    if (typeof value === 'string') {
      return value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
    }
    
    return false;
  }

  /**
   * Generate summary text
   */
  private generateSummary(
    eligibility: EligibilityAssessment['overallEligibility'],
    inclusionMet: number,
    inclusionTotal: number,
    exclusionHit: number,
    exclusionTotal: number
  ): string {
    const parts: string[] = [];

    switch (eligibility) {
      case 'ELIGIBLE':
        parts.push('Based on your responses, you appear to be eligible for this trial.');
        break;
      case 'POSSIBLY_ELIGIBLE':
        parts.push('Based on your responses, you may be eligible for this trial.');
        break;
      case 'NOT_ELIGIBLE':
        parts.push('Based on your responses, you may not be eligible for this trial.');
        break;
      default:
        parts.push('We need more information to determine your eligibility.');
    }

    if (inclusionTotal > 0) {
      parts.push(`You meet ${inclusionMet} out of ${inclusionTotal} inclusion criteria.`);
    }

    if (exclusionHit > 0) {
      parts.push(`You have ${exclusionHit} exclusion criteria that may disqualify you.`);
    }

    return parts.join(' ');
  }

  /**
   * Clear cache for a specific trial or all trials
   */
  clearCache(nctId?: string): void {
    if (nctId) {
      this.criteriaCache.delete(nctId);
    } else {
      this.criteriaCache.clear();
    }
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
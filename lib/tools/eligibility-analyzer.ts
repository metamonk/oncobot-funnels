import { generateObject } from 'ai';
import { z } from 'zod';
import { HealthProfile, HealthProfileResponse } from '@/lib/db/schema';
import { oncobot } from '@/ai/providers';

// Types for clinical trials
export interface ClinicalTrialForEligibility {
  protocolSection: {
    identificationModule: {
      nctId: string;
      briefTitle: string;
      officialTitle?: string;
    };
    eligibilityModule?: {
      eligibilityCriteria?: string;
    };
    designModule?: {
      phases?: string[];
    };
  };
}

// Base eligibility result
export interface EligibilityCheckResult {
  likelyEligible: boolean;
  inclusionMatches: string[];
  exclusionConcerns: string[];
  uncertainFactors: string[];
  confidence?: number;
}

// Comprehensive eligibility analysis schema
export const eligibilityAnalysisSchema = z.object({
  overallAssessment: z.enum(['likely_eligible', 'possibly_eligible', 'likely_not_eligible', 'insufficient_data']),
  confidence: z.number().min(0).max(100).describe('Confidence percentage in the assessment'),
  
  inclusionCriteria: z.array(z.object({
    criterion: z.string().describe('The specific inclusion criterion from the trial'),
    status: z.enum(['met', 'not_met', 'uncertain', 'not_applicable']),
    evidence: z.string().describe('Evidence from health profile supporting this determination'),
    importance: z.enum(['critical', 'important', 'minor']).describe('How critical this criterion is for eligibility')
  })),
  
  exclusionCriteria: z.array(z.object({
    criterion: z.string().describe('The specific exclusion criterion from the trial'),
    status: z.enum(['present', 'absent', 'uncertain', 'not_applicable']),
    concern: z.string().describe('Specific concern if criterion might exclude patient'),
    severity: z.enum(['absolute', 'relative', 'minor']).describe('Severity of the exclusion')
  })),
  
  missingInformation: z.array(z.object({
    dataPoint: z.string().describe('What information is missing'),
    impact: z.enum(['critical', 'important', 'helpful']).describe('Impact on eligibility determination'),
    howToObtain: z.string().describe('How patient could obtain this information')
  })),
  
  keyMatchFactors: z.array(z.string()).describe('Top factors that make this a good match'),
  keyConcerns: z.array(z.string()).describe('Main concerns or potential issues'),
  
  recommendation: z.object({
    primaryMessage: z.string().describe('Main recommendation for the patient'),
    nextSteps: z.array(z.string()).describe('Specific next steps patient should take'),
    questionsForDoctor: z.array(z.string()).describe('Questions patient should ask their doctor')
  }),
  
  explanationForPatient: z.string().describe('Plain language explanation of eligibility for patient')
});

export type EligibilityAnalysis = z.infer<typeof eligibilityAnalysisSchema>;

/**
 * Format health profile data for AI consumption
 */
function formatHealthProfileForAI(profile: HealthProfile | null, responses: HealthProfileResponse[]): string {
  if (!profile) {
    return 'No health profile available';
  }

  const sections: string[] = [];
  
  // Basic cancer information
  sections.push('PATIENT CANCER PROFILE:');
  sections.push(`- Cancer Region: ${profile.cancerRegion || 'Not specified'}`);
  sections.push(`- Cancer Type: ${profile.cancerType || 'Not specified'}`);
  sections.push(`- Primary Site: ${profile.primarySite || 'Not specified'}`);
  sections.push(`- Disease Stage: ${profile.diseaseStage || 'Not specified'}`);
  sections.push(`- Performance Status: ${profile.performanceStatus || 'Not specified'}`);
  
  // Treatment history
  if (profile.treatmentHistory) {
    sections.push('\nTREATMENT HISTORY:');
    const treatments = profile.treatmentHistory as Record<string, any>;
    Object.entries(treatments).forEach(([treatment, status]) => {
      if (status === 'YES') {
        sections.push(`- Has received: ${treatment.replace(/_/g, ' ').toLowerCase()}`);
      }
    });
  }
  
  // Molecular markers
  if (profile.molecularMarkers) {
    sections.push('\nMOLECULAR MARKERS:');
    const markers = profile.molecularMarkers as Record<string, any>;
    Object.entries(markers).forEach(([marker, value]) => {
      if (marker !== 'testingStatus' && value && value !== 'UNKNOWN') {
        sections.push(`- ${marker}: ${value}`);
      }
    });
  }
  
  // Additional responses that might contain relevant information
  const relevantResponses = responses.filter(r => 
    r.questionId.includes('LAB_VALUES') ||
    r.questionId.includes('ORGAN_FUNCTION') ||
    r.questionId.includes('PRIOR_THERAPIES') ||
    r.questionId.includes('COMORBIDITIES') ||
    r.questionId.includes('ECOG') ||
    r.questionId.includes('KARNOFSKY')
  );
  
  if (relevantResponses.length > 0) {
    sections.push('\nADDITIONAL HEALTH INFORMATION:');
    relevantResponses.forEach(response => {
      sections.push(`- ${response.questionId}: ${JSON.stringify(response.response)}`);
    });
  }
  
  return sections.join('\n');
}

/**
 * Quick eligibility check using AI
 */
export async function checkEligibility(
  trial: ClinicalTrialForEligibility,
  profile: HealthProfile | null,
  responses: HealthProfileResponse[] = [],
  options?: { detailed?: boolean }
): Promise<EligibilityCheckResult | { result: EligibilityCheckResult; analysis: EligibilityAnalysis }> {
  const eligibilityCriteria = trial.protocolSection.eligibilityModule?.eligibilityCriteria || '';
  
  if (!profile || !eligibilityCriteria) {
    const emptyResult: EligibilityCheckResult = {
      likelyEligible: false,
      inclusionMatches: [],
      exclusionConcerns: [],
      uncertainFactors: [profile ? 'No eligibility criteria available' : 'No health profile available'],
      confidence: 0
    };
    return emptyResult;
  }

  // Use detailed analysis for eligibility_check action
  if (options?.detailed) {
    const model = oncobot.languageModel('oncobot-anthropic');
    const healthProfileData = formatHealthProfileForAI(profile, responses);
    const trialTitle = trial.protocolSection.identificationModule.briefTitle;
    const trialPhases = trial.protocolSection.designModule?.phases || [];

    const prompt = `You are a clinical trial eligibility analyst helping cancer patients understand if they might qualify for a clinical trial.

CLINICAL TRIAL:
Title: ${trialTitle}
Phases: ${trialPhases.join(', ')}

ELIGIBILITY CRITERIA:
${eligibilityCriteria}

PATIENT HEALTH PROFILE:
${healthProfileData}

Analyze this patient's potential eligibility for this clinical trial. Consider:
1. Extract and evaluate each inclusion criterion
2. Extract and evaluate each exclusion criterion  
3. Identify missing information that would be helpful
4. Consider standard eligibility requirements even if not explicitly stated
5. Account for the specific cancer type, stage, and molecular markers
6. Consider prior treatments and their potential impact

Remember:
- Be conservative but hopeful in your assessment
- Clearly distinguish between absolute exclusions vs. relative concerns
- Provide actionable next steps for the patient
- Use patient-friendly language in explanations
- Consider that some criteria may have exceptions determined by the trial team`;

    try {
      const result = await generateObject({
        model,
        schema: eligibilityAnalysisSchema,
        prompt,
        maxTokens: 3000,
      });

      const analysis = result.object;
      
      // Convert to standard result format
      const checkResult: EligibilityCheckResult = {
        likelyEligible: analysis.overallAssessment !== 'likely_not_eligible',
        inclusionMatches: analysis.keyMatchFactors,
        exclusionConcerns: analysis.keyConcerns,
        uncertainFactors: analysis.missingInformation.map(m => m.dataPoint),
        confidence: analysis.confidence
      };

      return { result: checkResult, analysis };
    } catch (error) {
      console.error('Detailed eligibility analysis failed:', error);
      // Fall through to quick check
    }
  }

  // Quick check for search results
  const model = oncobot.languageModel('oncobot-haiku');
  const profileSummary = getProfileSummary(profile);
  
  const quickCheckSchema = z.object({
    likelyEligible: z.boolean(),
    inclusionMatches: z.array(z.string()).max(5),  // Increased to handle more matches
    exclusionConcerns: z.array(z.string()).max(5),  // Increased for consistency
    uncertainFactors: z.array(z.string()).max(5)    // Increased for consistency
  });

  try {
    const result = await generateObject({
      model,
      schema: quickCheckSchema,
      prompt: `Quickly assess if this patient might be eligible for a clinical trial.

PATIENT SUMMARY: ${profileSummary}

TRIAL ELIGIBILITY CRITERIA:
${eligibilityCriteria.substring(0, 1500)} ${eligibilityCriteria.length > 1500 ? '...' : ''}

Provide a quick assessment focusing on the most important factors. Be concise.`,
      maxTokens: 500,
    });

    return {
      ...result.object,
      confidence: 70 // Quick check has lower confidence
    };
  } catch (error) {
    console.error('Quick eligibility check failed:', error);
    
    // Return a basic error response
    return {
      likelyEligible: false,
      inclusionMatches: [],
      exclusionConcerns: [],
      uncertainFactors: ['Eligibility analysis temporarily unavailable'],
      confidence: 0
    };
  }
}

/**
 * Get a concise profile summary for quick checks
 */
function getProfileSummary(profile: HealthProfile): string {
  const parts: string[] = [];
  
  if (profile.cancerType) {
    parts.push(`Cancer: ${profile.cancerType.replace(/_/g, ' ')}`);
  }
  if (profile.diseaseStage) {
    parts.push(`Stage: ${profile.diseaseStage.replace(/STAGE_/, '')}`);
  }
  if (profile.performanceStatus) {
    parts.push(`ECOG: ${profile.performanceStatus}`);
  }

  // Add key treatments
  if (profile.treatmentHistory) {
    const treatments = profile.treatmentHistory as Record<string, any>;
    const activeTreatments = Object.entries(treatments)
      .filter(([_, status]) => status === 'YES')
      .map(([treatment]) => treatment.replace(/_/g, ' '));
    
    if (activeTreatments.length > 0) {
      parts.push(`Prior: ${activeTreatments.slice(0, 3).join(', ')}`);
    }
  }
  
  // Add molecular markers - CRITICAL for proper matching!
  if (profile.molecularMarkers) {
    const markers = profile.molecularMarkers as Record<string, any>;
    const activeMarkers: string[] = [];
    
    Object.entries(markers).forEach(([marker, value]) => {
      if (marker !== 'testingStatus' && value && value !== 'UNKNOWN') {
        // Convert KRAS_G12C to "KRAS G12C"
        if (typeof value === 'string' && value.includes('_')) {
          activeMarkers.push(value.replace(/_/g, ' '));
        } else if (typeof value === 'string') {
          activeMarkers.push(`${marker}: ${value}`);
        } else if (value === true) {
          activeMarkers.push(marker);
        }
      }
    });
    
    if (activeMarkers.length > 0) {
      parts.push(`Mutations: ${activeMarkers.join(', ')}`);
    }
  }

  return parts.join(' | ');
}
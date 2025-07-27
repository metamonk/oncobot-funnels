import { generateObject } from 'ai';
import { z } from 'zod';
import { HealthProfile, HealthProfileResponse } from '@/lib/db/schema';
import { oncobot } from '@/ai/providers';

// Schema for structured eligibility analysis output
const eligibilityAnalysisSchema = z.object({
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

// Helper to format health profile data for the AI
function formatHealthProfileForAI(
  profile: HealthProfile | null,
  responses: HealthProfileResponse[]
): string {
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
    r.questionId.includes('COMORBIDITIES')
  );
  
  if (relevantResponses.length > 0) {
    sections.push('\nADDITIONAL HEALTH INFORMATION:');
    relevantResponses.forEach(response => {
      sections.push(`- ${response.questionId}: ${JSON.stringify(response.response)}`);
    });
  }
  
  return sections.join('\n');
}

// Main AI-powered eligibility analysis function
export async function analyzeEligibilityWithAI(
  trialEligibilityCriteria: string,
  trialTitle: string,
  trialPhases: string[],
  profile: HealthProfile | null,
  responses: HealthProfileResponse[]
): Promise<EligibilityAnalysis> {
  // Use a powerful model for comprehensive analysis
  const model = oncobot.languageModel('oncobot-anthropic');

  const healthProfileData = formatHealthProfileForAI(profile, responses);

  const prompt = `You are a clinical trial eligibility analyst helping cancer patients understand if they might qualify for a clinical trial.

CLINICAL TRIAL:
Title: ${trialTitle}
Phases: ${trialPhases.join(', ')}

ELIGIBILITY CRITERIA:
${trialEligibilityCriteria}

PATIENT HEALTH PROFILE:
${healthProfileData}

Analyze this patient's potential eligibility for this clinical trial. Consider:

1. Extract and evaluate each inclusion criterion
2. Extract and evaluate each exclusion criterion
3. Identify missing information that would be helpful
4. Consider standard eligibility requirements even if not explicitly stated (e.g., adequate organ function for chemotherapy trials)
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
      maxTokens: 3000, // Increased for comprehensive analysis
    });

    return result.object;
  } catch (error) {
    console.error('AI eligibility analysis failed:', error);
    
    // Fallback to basic analysis
    return {
      overallAssessment: 'insufficient_data',
      confidence: 0,
      inclusionCriteria: [],
      exclusionCriteria: [],
      missingInformation: [{
        dataPoint: 'AI analysis unavailable',
        impact: 'critical',
        howToObtain: 'Contact the clinical trial team directly for eligibility screening'
      }],
      keyMatchFactors: [],
      keyConcerns: ['Automated analysis unavailable - manual review recommended'],
      recommendation: {
        primaryMessage: 'We were unable to perform an automated eligibility analysis. Please contact the trial team directly.',
        nextSteps: ['Contact the clinical trial coordinator', 'Discuss with your oncologist'],
        questionsForDoctor: ['Am I eligible for this trial?', 'What additional tests might I need?']
      },
      explanationForPatient: 'The automated eligibility check is temporarily unavailable. Please contact the clinical trial team or your doctor to discuss your eligibility.'
    };
  }
}

// Simplified version for quick checks (used in search results)
export async function quickEligibilityCheck(
  trialEligibilityCriteria: string,
  profile: HealthProfile | null
): Promise<{
  likelyEligible: boolean;
  inclusionMatches: string[];
  exclusionConcerns: string[];
  uncertainFactors: string[];
}> {
  if (!profile || !trialEligibilityCriteria) {
    return {
      likelyEligible: false,
      inclusionMatches: [],
      exclusionConcerns: [],
      uncertainFactors: ['Insufficient data for eligibility assessment']
    };
  }

  // Use a fast model for quick checks
  const model = oncobot.languageModel('oncobot-haiku');

  const quickCheckSchema = z.object({
    likelyEligible: z.boolean(),
    inclusionMatches: z.array(z.string()).max(3),
    exclusionConcerns: z.array(z.string()).max(3),
    uncertainFactors: z.array(z.string()).max(2)
  });

  try {
    const result = await generateObject({
      model,
      schema: quickCheckSchema,
      prompt: `Based on this clinical trial eligibility criteria and patient profile, provide a quick eligibility assessment.

CRITERIA: ${trialEligibilityCriteria.substring(0, 1000)}

PATIENT: 
- Cancer: ${profile.cancerRegion} - ${profile.cancerType}
- Stage: ${profile.diseaseStage}
- Prior treatments: ${JSON.stringify(profile.treatmentHistory)}
- Molecular markers: ${JSON.stringify(profile.molecularMarkers)}

Provide brief, specific matches and concerns (max 3 each).`,
      maxTokens: 500,
    });

    return result.object;
  } catch (error) {
    // Fallback to simple matching
    return {
      likelyEligible: false,
      inclusionMatches: [],
      exclusionConcerns: [],
      uncertainFactors: ['Automated analysis unavailable']
    };
  }
}
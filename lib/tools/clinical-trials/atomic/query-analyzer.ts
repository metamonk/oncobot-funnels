/**
 * Query Analyzer Atomic Tool
 * 
 * CONTEXT-AWARE: Following CLAUDE.md principles
 * - Multi-dimensional analysis: Understands queries aren't single-purpose
 * - AI-driven extraction: Uses GPT-4o for intelligent entity extraction
 * - Transparent to main AI: Returns full analysis for orchestration decisions
 */

import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { oncobot } from '@/ai/providers';
import { HealthProfile } from '../types';
import { debug, DebugCategory } from '../debug';

// Multi-dimensional understanding schema
const QueryAnalysisSchema = z.object({
  dimensions: z.object({
    hasLocationComponent: z.boolean(),
    hasConditionComponent: z.boolean(),
    hasMutationComponent: z.boolean(),
    hasNCTComponent: z.boolean(),
    hasEligibilityComponent: z.boolean(),
    hasAdministrativeComponent: z.boolean(),
    hasResearchComponent: z.boolean(),
    hasContinuationComponent: z.boolean(),
  }),
  
  weights: z.object({
    location: z.number().min(0).max(1),
    condition: z.number().min(0).max(1),
    mutation: z.number().min(0).max(1),
    nctLookup: z.number().min(0).max(1),
    eligibility: z.number().min(0).max(1),
    administrative: z.number().min(0).max(1),
  }),
  
  entities: z.object({
    nctIds: z.array(z.string()),
    conditions: z.array(z.string()),
    cancerTypes: z.array(z.string()),
    mutations: z.array(z.string()),
    drugs: z.array(z.string()),
    locations: z.object({
      cities: z.array(z.string()),
      states: z.array(z.string()),
      countries: z.array(z.string()),
      isNearMe: z.boolean(),
    }),
    phases: z.array(z.string()),
    sponsors: z.array(z.string()),
  }),
  
  userIntent: z.object({
    primaryGoals: z.array(z.enum([
      'find_trials',
      'check_eligibility', 
      'get_trial_details',
      'find_locations',
      'contact_sites',
      'compare_trials',
      'understand_trial',
      'continue_search'
    ])),
    userType: z.enum(['patient', 'caregiver', 'coordinator', 'researcher', 'unknown']),
    urgency: z.enum(['immediate', 'planning', 'research']),
    specificity: z.enum(['very_specific', 'moderate', 'exploratory']),
  }),
  
  profileRelevance: z.object({
    needed: z.boolean(),
    importance: z.number().min(0).max(1),
    reason: z.string(),
    usage: z.enum(['primary', 'enhancement', 'filtering', 'optional', 'not_needed']),
  }),
  
  searchStrategy: z.object({
    recommendedTools: z.array(z.string()),
    parallelSearches: z.boolean(),
    sequentialSteps: z.array(z.string()),
    reasoning: z.string(),
  }),
});

export type QueryAnalysis = z.infer<typeof QueryAnalysisSchema>;

interface QueryAnalyzerParams {
  query: string;
  conversationHistory?: string[];
  healthProfile?: HealthProfile | null;
  previousSearches?: string[];
}

export class QueryAnalyzerTool {
  /**
   * Analyze query for multi-dimensional understanding
   * This gives the main AI full visibility into query complexity
   */
  async analyze(params: QueryAnalyzerParams): Promise<{
    success: boolean;
    analysis?: QueryAnalysis;
    error?: {
      type: string;
      message: string;
    };
  }> {
    const { query, conversationHistory = [], healthProfile, previousSearches = [] } = params;
    
    debug.log(DebugCategory.QUERY, 'Analyzing query', { 
      query,
      hasHistory: conversationHistory.length > 0,
      hasProfile: !!healthProfile 
    });
    
    try {
      // Build context for AI analysis
      let context = `Analyze this clinical trials query for ALL dimensions and entities.\n\n`;
      context += `Query: "${query}"\n\n`;
      
      if (conversationHistory.length > 0) {
        context += `Recent conversation:\n${conversationHistory.slice(-3).join('\n')}\n\n`;
      }
      
      if (healthProfile) {
        context += `User has health profile with:\n`;
        context += `- Cancer Type: ${healthProfile.cancerType}\n`;
        context += `- Stage: ${healthProfile.diseaseStage}\n`;
        if (healthProfile.molecularMarkers) {
          const markers = Object.entries(healthProfile.molecularMarkers)
            .filter(([_, status]) => status === 'POSITIVE')
            .map(([marker]) => marker);
          if (markers.length > 0) {
            context += `- Mutations: ${markers.join(', ')}\n`;
          }
        }
        context += '\n';
      }
      
      const prompt = `${context}
Identify ALL components of this query:
- Extract every entity mentioned (conditions, locations, mutations, etc.)
- Extract NCT IDs (format: NCT########) if mentioned
- Look for trial names/acronyms (often contain hyphenated names like "TROPION-Lung12", "KEYNOTE-671", "CheckMate-816", etc.)
- Determine which dimensions are present (can be multiple)
- Weight the importance of each dimension (0-1)
- Understand the user's intent(s) - there may be multiple goals
- Determine if health profile data would be helpful
- Recommend which atomic tools to use and how to compose them
- Set sequentialSteps to empty array [] (this field is required but usually empty)

CRITICAL: Trial names/acronyms (like "TROPION-Lung12", "KEYNOTE-671", "CheckMate-816"):
1. These are SPECIFIC TRIAL NAMES that need intelligent search
2. Extract them in the drugs array for searching
3. Set hasNCTComponent = true (user wants a specific trial)
4. Weight nctLookup high (0.8-1.0) to prioritize finding that specific trial
5. Recommend BOTH text-search AND intelligent-search tools
6. Consider variations: "TROPION-Lung 12" and "TROPION-Lung12" are the same trial
7. These should be searched in multiple fields: title, acronym, and intervention fields

Remember: Most queries have MULTIPLE dimensions. For example:
- "KRAS G12C trials near me" has mutation + location dimensions
- "Am I eligible for NCT12345" has NCT lookup + eligibility dimensions
- "Phase 3 lung cancer in Boston" has phase + condition + location dimensions
- "TROPION-Lung12 study locations" needs to find that SPECIFIC trial first, then show locations`;
      
      const result = await generateObject({
        model: oncobot.languageModel('oncobot-4o-mini'),
        schema: QueryAnalysisSchema,
        prompt,
        temperature: 0.0, // Deterministic as per CLAUDE.md
      });
      
      debug.log(DebugCategory.QUERY, 'Query analysis complete', {
        dimensions: result.object.dimensions,
        entityCounts: {
          conditions: result.object.entities.conditions.length,
          mutations: result.object.entities.mutations.length,
          locations: result.object.entities.locations.cities.length,
          nctIds: result.object.entities.nctIds.length,
        },
        recommendedTools: result.object.searchStrategy.recommendedTools
      });
      
      return {
        success: true,
        analysis: result.object
      };
      
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'Query analysis failed', error);
      
      // Try AI-driven fallback first
      const fallbackAnalysis = await this.aiFallbackAnalysis(query);
      
      return {
        success: true,
        analysis: fallbackAnalysis,
        error: {
          type: 'ai_fallback',
          message: 'Using AI-driven fallback analysis'
        }
      };
    }
  }
  
  /**
   * AI-driven fallback analysis using simplified prompting
   * This is more robust than pattern matching and still works without structured outputs
   */
  private async aiFallbackAnalysis(query: string): Promise<QueryAnalysis> {
    try {
      // Try a simpler AI approach without structured outputs
      const { text } = await generateText({
        model: oncobot.languageModel('oncobot-4o-mini'),
        temperature: 0.0,
        prompt: `Analyze this clinical trials query and respond with a JSON object:
Query: "${query}"

Identify these aspects:
1. Is this about a specific NCT ID? (look for NCT followed by 8 digits)
2. Is this about a specific trial name? (like TROPION-Lung12, KEYNOTE-671, CheckMate-816)
3. Does it mention location? (cities, states, "near me")
4. Does it mention conditions? (cancer types, diseases)
5. Does it mention mutations? (KRAS, EGFR, biomarkers)
6. Is this asking for more results or continuation?

Respond ONLY with a valid JSON object like this example:
{
  "hasNCT": false,
  "nctIds": [],
  "hasTrialName": true,
  "trialNames": ["TROPION-Lung12"],
  "hasLocation": false,
  "hasCondition": true,
  "conditions": ["lung cancer"],
  "hasMutation": false,
  "mutations": [],
  "isContinuation": false
}`
      });

      // Parse the AI response (handle markdown code blocks if present)
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      const analysis = JSON.parse(jsonText);
      
      // Convert to our schema format
      return {
        dimensions: {
          hasLocationComponent: analysis.hasLocation || false,
          hasConditionComponent: analysis.hasCondition || false,
          hasMutationComponent: analysis.hasMutation || false,
          hasNCTComponent: analysis.hasNCT || analysis.hasTrialName || false,
          hasEligibilityComponent: false,
          hasAdministrativeComponent: false,
          hasResearchComponent: true,
          hasContinuationComponent: analysis.isContinuation || false,
        },
        
        weights: {
          location: analysis.hasLocation ? 0.5 : 0,
          condition: analysis.hasCondition ? 0.7 : 0,
          mutation: analysis.hasMutation ? 0.6 : 0,
          nctLookup: analysis.hasNCT ? 1.0 : (analysis.hasTrialName ? 0.8 : 0),
          eligibility: 0,
          administrative: 0,
        },
        
        entities: {
          nctIds: analysis.nctIds || [],
          conditions: analysis.conditions || [],
          cancerTypes: analysis.conditions || [],
          mutations: analysis.mutations || [],
          drugs: analysis.trialNames || [],
          locations: {
            cities: [],
            states: [],
            countries: [],
            isNearMe: query.toLowerCase().includes('near me'),
          },
          phases: [],
          sponsors: [],
        },
        
        userIntent: {
          primaryGoals: analysis.hasTrialName ? ['get_trial_details'] : ['find_trials'],
          userType: 'unknown',
          urgency: 'planning',
          specificity: analysis.hasTrialName ? 'very_specific' : 'moderate',
        },
        
        profileRelevance: {
          needed: analysis.hasCondition || analysis.hasMutation,
          importance: 0.5,
          reason: 'Query mentions medical conditions or trial names',
          usage: 'enhancement',
        },
        
        searchStrategy: {
          recommendedTools: analysis.hasTrialName ? ['text-search', 'nct-lookup'] : ['text-search'],
          parallelSearches: analysis.hasTrialName && analysis.hasCondition,
          sequentialSteps: [],
          reasoning: 'AI-driven fallback analysis',
        },
      };
      
    } catch (fallbackError) {
      // Ultimate fallback - very basic pattern matching as last resort
      debug.error(DebugCategory.ERROR, 'AI fallback also failed', fallbackError);
      return this.ultimateFallbackAnalysis(query);
    }
  }
  
  /**
   * Ultimate fallback - minimal pattern extraction when everything else fails
   * This ensures the system never completely breaks while still extracting key entities
   * Following AI-driven principle: simple extraction, not complex conditionals
   */
  private ultimateFallbackAnalysis(query: string): QueryAnalysis {
    const queryLower = query.toLowerCase();
    const nctMatch = query.match(/NCT\d{8}/gi) || [];
    
    // Extract mutations - common patterns like KRAS G12C, EGFR L858R, etc.
    const mutationPatterns = query.match(/\b(KRAS|EGFR|ALK|ROS1|BRAF|MET|RET|HER2|PIK3CA|NTRK)\s*[A-Z]?\d+[A-Z]?\b/gi) || [];
    const hasMutation = mutationPatterns.length > 0 || queryLower.includes('mutation');
    
    // Extract cities - capitalize first letter of common city names
    const cityPatterns = [
      'chicago', 'boston', 'new york', 'los angeles', 'houston', 'philadelphia',
      'phoenix', 'san antonio', 'san diego', 'dallas', 'san jose', 'austin',
      'seattle', 'denver', 'washington', 'miami', 'atlanta', 'portland'
    ];
    const foundCities: string[] = [];
    for (const city of cityPatterns) {
      if (queryLower.includes(city)) {
        foundCities.push(city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
      }
    }
    
    // Extract common cancer types
    const cancerTypes: string[] = [];
    if (queryLower.includes('lung')) cancerTypes.push('lung cancer');
    if (queryLower.includes('nsclc')) cancerTypes.push('NSCLC');
    if (queryLower.includes('breast')) cancerTypes.push('breast cancer');
    if (queryLower.includes('colon') || queryLower.includes('colorectal')) cancerTypes.push('colorectal cancer');
    
    // Check for trial names (pattern: NAME-Number or NAME Number)
    // Enhanced pattern to capture full trial names like "TROPION-Lung 12"
    const trialNamePatterns = query.match(/\b[A-Z][A-Za-z]+(?:[-\s][A-Za-z]+)?[-\s]?\d+\b/g) || [];
    const potentialTrialNames = trialNamePatterns.filter(name => 
      !name.match(/^[A-Z]\d+[A-Z]?$/) // Exclude mutation patterns
    );
    
    // Also check for hyphenated patterns that look like trial names
    const hyphenatedPatterns = query.match(/\b[A-Z]+-[A-Za-z]+\s*\d+\b/gi) || [];
    potentialTrialNames.push(...hyphenatedPatterns);
    
    const hasLocation = foundCities.length > 0 || queryLower.includes('near me');
    const hasCondition = cancerTypes.length > 0 || queryLower.includes('cancer') || queryLower.includes('trial');
    
    return {
      dimensions: {
        hasLocationComponent: hasLocation,
        hasConditionComponent: hasCondition,
        hasMutationComponent: hasMutation,
        hasNCTComponent: nctMatch.length > 0 || potentialTrialNames.length > 0,
        hasEligibilityComponent: queryLower.includes('eligible'),
        hasAdministrativeComponent: queryLower.includes('contact') || queryLower.includes('coordinator'),
        hasResearchComponent: true,
        hasContinuationComponent: queryLower.includes('more'),
      },
      
      weights: {
        location: hasLocation ? 0.5 : 0,
        condition: hasCondition ? 0.5 : 0,
        mutation: hasMutation ? 0.6 : 0,
        nctLookup: nctMatch.length > 0 ? 1.0 : (potentialTrialNames.length > 0 ? 0.7 : 0),
        eligibility: 0,
        administrative: 0,
      },
      
      entities: {
        nctIds: nctMatch,
        conditions: cancerTypes,
        cancerTypes: cancerTypes,
        mutations: mutationPatterns,
        drugs: potentialTrialNames,
        locations: {
          cities: foundCities,
          states: [],
          countries: [],
          isNearMe: queryLower.includes('near me'),
        },
        phases: [],
        sponsors: [],
      },
      
      userIntent: {
        primaryGoals: potentialTrialNames.length > 0 ? ['get_trial_details', 'find_trials'] : ['find_trials'],
        userType: 'unknown',
        urgency: 'planning',
        specificity: (nctMatch.length > 0 || potentialTrialNames.length > 0) ? 'very_specific' : 'moderate',
      },
      
      profileRelevance: {
        needed: hasMutation || hasCondition,
        importance: hasMutation ? 0.7 : 0.5,
        reason: 'Query contains medical information',
        usage: hasMutation ? 'enhancement' : 'optional',
      },
      
      searchStrategy: {
        recommendedTools: hasMutation ? ['mutation-search', 'text-search'] : ['text-search'],
        parallelSearches: hasMutation && hasLocation,
        sequentialSteps: [],
        reasoning: 'Ultimate fallback with entity extraction',
      },
    };
  }
}

// Export singleton instance
export const queryAnalyzer = new QueryAnalyzerTool();
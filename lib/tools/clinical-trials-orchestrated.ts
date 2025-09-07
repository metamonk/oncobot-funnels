/**
 * Clinical Trials Orchestrated Tool - TRUE AI-DRIVEN
 * 
 * PURE AI ORCHESTRATION: Following CLAUDE.md principles strictly
 * - NO switch statements or if/else chains
 * - NO hardcoded execution logic
 * - AI decides EVERYTHING: tools, parameters, weights
 * - Simple 3-step process: Analyze → Plan → Execute
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { oncobot } from '@/ai/providers';
import { 
  queryAnalyzer,
  unifiedSearch,
  resultComposer,
  nctLookup,
  locationSearch,
  enhancedLocationSearch,
  mutationSearch,
  continuationHandler
} from './clinical-trials/atomic';
import { conversationTrialStore } from './clinical-trials/services/conversation-trial-store';
import { debug, DebugCategory } from './clinical-trials/debug';
import type { HealthProfile } from './clinical-trials/types';

// AI decides everything about execution
const ExecutionPlanSchema = z.object({
  executions: z.array(z.object({
    tool: z.string(),
    parameters: z.record(z.any()),
    weight: z.number(),
    reasoning: z.string()
  })),
  strategy: z.string()
});

interface SearchParams {
  query: string;
  healthProfile?: HealthProfile | null;
  userLocation?: { city?: string; state?: string };
  chatId?: string;
  maxResults?: number;
  filters?: {
    recruitmentStatus?: string[];
    trialPhase?: string[];
  };
}

export async function searchClinicalTrialsOrchestrated(params: SearchParams): Promise<any> {
  const { query, healthProfile, userLocation, chatId, maxResults = 10, filters } = params;
  
  debug.log(DebugCategory.ORCHESTRATION, 'TRUE AI-driven search', { query });
  
  // Check for continuation queries ("show me more", "continue", etc.)
  const isContinuation = query.toLowerCase().includes('show me more') || 
                        query.toLowerCase().includes('show more') ||
                        query.toLowerCase().includes('continue') ||
                        query.toLowerCase().includes('next');
  
  if (isContinuation && chatId) {
    debug.log(DebugCategory.ORCHESTRATION, 'Detected continuation query');
    return await continuationHandler.continue({ chatId, maxResults, query });
  }
  
  try {
    // Step 1: AI analyzes query
    const analysisResult = await queryAnalyzer.analyze({
      query,
      healthProfile
    });
    
    if (!analysisResult.success) {
      // AI failed - simple fallback
      return simpleFailure(query);
    }
    
    // Get stored trials from conversation if available
    let storedTrials = null;
    if (chatId) {
      storedTrials = conversationTrialStore.getAllTrials(chatId);
      debug.log(DebugCategory.ORCHESTRATION, 'Retrieved stored trials', { 
        count: storedTrials?.length || 0 
      });
    }
    
    // Step 2: AI plans entire execution (NO hardcoded logic)
    const executionPlan = await planExecution(
      query,
      analysisResult.analysis,
      healthProfile || null,  // Convert undefined to null
      userLocation,
      maxResults,
      filters,
      storedTrials,  // Pass conversation context
      chatId
    );
    
    // Debug: Log the execution plan
    debug.log(DebugCategory.ORCHESTRATION, 'Execution plan', {
      executions: executionPlan?.executions,
      strategy: executionPlan?.strategy
    });
    
    // Check if planning failed
    if (!executionPlan || !executionPlan.executions || executionPlan.executions.length === 0) {
      debug.error(DebugCategory.ERROR, 'Execution planning failed', new Error('No execution plan generated'));
      return simpleFailure(query);
    }
    
    // Step 3: Execute AI's plan (NO switch statements)
    const searchResults = await executeAIPlan(executionPlan);
    
    // Step 4: AI composes results
    const composed = await resultComposer.compose({
      searchResults,
      query,
      queryAnalysis: analysisResult.analysis,
      healthProfile,
      userLocation,
      chatId,
      maxResults
    });
    
    return composed;
    
  } catch (error) {
    debug.error(DebugCategory.ERROR, 'Orchestration failed', error);
    return simpleFailure(query);
  }
}

/**
 * AI plans the entire execution - NO hardcoded rules
 */
async function planExecution(
  query: string,
  analysis: any,
  healthProfile: HealthProfile | null,
  userLocation: any,
  maxResults: number,
  filters?: any,
  storedTrials?: any,
  chatId?: string
): Promise<any> {
  const toolRegistry = {
    'unified-search': unifiedSearch,
    'nct-lookup': nctLookup,
    'location-search': locationSearch,
    'enhanced-location': enhancedLocationSearch,
    'mutation-search': mutationSearch
  };
  
  try {
    const prompt = `Plan the execution of clinical trial searches.

Query: "${query}"

Analysis Results:
${JSON.stringify(analysis, null, 2)}

Available Context:
- Health Profile: ${healthProfile ? JSON.stringify(healthProfile) : 'none'}
- User Location: ${userLocation ? JSON.stringify(userLocation) : 'none'}
- Max Results: ${maxResults}
- Filters: ${filters ? JSON.stringify(filters) : 'none'}
${storedTrials && storedTrials.length > 0 ? `
- Previously Found Trials in Conversation: ${storedTrials.length} trials
  Recent trials include:
${storedTrials.slice(0, 5).map((st: any) => {
    const nctId = st.trial.protocolSection?.identificationModule?.nctId || st.trial.nctId;
    const briefTitle = st.trial.protocolSection?.identificationModule?.briefTitle || st.trial.briefTitle;
    const officialTitle = st.trial.protocolSection?.identificationModule?.officialTitle || st.trial.officialTitle;
    return `  - ${nctId}: ${briefTitle || officialTitle}`;
  }).join('\n')}
  
  IMPORTANT: If the user is asking about locations, details, or follow-ups about these trials,
  you should search for the specific NCT ID(s) rather than the trial name.` : ''}

Available Tools and Their Parameters:
- unified-search: General API search for any natural language query
  Parameters: { query: string, analysis?: object, maxResults?: number, filters?: object }
  IMPORTANT: Always pass the FULL original query string AND the analysis object
  Example: { query: "TROPION-Lung12 study locations in Texas and Louisiana", analysis: <analysis object>, maxResults: 50 }
  Use for: Complex queries, combined criteria, natural language searches
  
- nct-lookup: Direct NCT ID lookup (handles single or multiple IDs)
  Parameters: { nctId: string } or just the string NCT ID
  Example: { nctId: "NCT04595559" } or "NCT04595559"
  IMPORTANT: For multiple NCT IDs, create multiple executions (one per ID)
  Example for multiple: If user provides 10 NCT IDs, create 10 nct-lookup executions
  
- location-search: Location-based search
  Parameters: { city?: string, state?: string | string[], condition?: string }
  Example: { state: ["Texas", "Louisiana"], condition: "lung cancer" }
  Use for: Basic location searches without distance requirements
  
- enhanced-location: Advanced location search with distance and radius
  Parameters: { city?: string, state?: string, radius?: number, userCoordinates?: {latitude, longitude}, includeDistances?: boolean }
  Example: { state: "Texas", radius: 50, userCoordinates: {latitude: 29.7604, longitude: -95.3698} }
  Use for: "trials within X miles", "nearest trials", distance-based queries
  IMPORTANT: Use this when user asks about distance or "near me"
  
- mutation-search: Mutation-specific search
  Parameters: { mutation: string, cancerType?: string }
  Example: { mutation: "KRAS G12C", cancerType: "NSCLC" }
  Use for: Specific biomarker/mutation queries without location
  NOTE: If query has BOTH mutation AND location, use unified-search instead

CRITICAL EXECUTION RULES:

1. UNDERSTAND THE USER'S INTENT FROM CONTEXT:
   - Initial combined query ("KRAS G12C in Chicago") → User wants INTERSECTION
   - Refinement query ("Show me the ones in Chicago") → Filter previous results
   - Additive query ("Also show trials in Boston") → Add MORE results (UNION)
   - Continuation ("Show me more") → More from same search
   - Follow-up about specific trial ("Which are the closest locations to Louisiana?") → Search for THAT specific NCT ID
   
   LOOK AT THE CONVERSATION HISTORY above! If trials were previously found, 
   follow-up questions are likely about THOSE specific trials, not new searches.

2. FOR INITIAL COMBINED QUERIES (mutation/condition + location):
   - Use unified-search with the FULL query text
   - This gives INTERSECTION (trials matching ALL criteria)
   
   Example: "KRAS G12C trials in Chicago"
   USE: unified-search { query: "KRAS G12C trials in Chicago" }
   
3. FOR REFINEMENT QUERIES (filtering previous results):
   - If user is asking to filter/narrow previous results
   - Consider using the stored results if available
   - Or use unified-search with combined criteria
   
   Example conversation:
   User: "Show KRAS G12C trials"
   User: "Which ones are in Chicago?" 
   INTENT: Filter the KRAS results to only Chicago ones
   
4. FOR ADDITIVE QUERIES (expanding results):
   - User wants to ADD more results, not filter
   - May need separate searches or broader criteria
   
   Example conversation:
   User: "Show KRAS G12C trials"
   User: "Also show me trials in Chicago"
   INTENT: Show KRAS trials PLUS all Chicago trials

2. WHEN SEARCHING FOR A SPECIFIC TRIAL NAME:
   - Use unified-search with the FULL query to preserve context
   - The tool's AI will extract the trial name and any location constraints
   Example: "TROPION-Lung12 in Texas" → unified-search { query: "TROPION-Lung12 in Texas" }

3. WHEN TO USE SPECIALIZED TOOLS:
   - mutation-search: ONLY for mutation WITHOUT location ("KRAS G12C trials")
   - location-search: ONLY for location WITHOUT condition ("all trials in Chicago")
   - nct-lookup: For NCT IDs (single or multiple) - create one execution per NCT ID
   - unified-search: For ANY combined query, natural language, or when in doubt
   
   SPECIAL CASES:
   - Multiple NCT IDs (e.g., 10 IDs pasted): Create 10 separate nct-lookup executions
   - Complex follow-ups ("Do any have locations in Brooklyn?"): Use stored context
   - Eligibility questions ("What would prevent me?"): Look at exclusion criteria in results

4. FOR FOLLOW-UP QUERIES ABOUT PREVIOUSLY FOUND TRIALS:
   - If user asks about "the trial" or "that trial" or locations/details about it
   - AND you have previously found trials in the conversation
   - Use nct-lookup with the specific NCT ID (e.g., NCT06564844)
   - Don't search for the trial name again (like "TROPION-Lung12") as it may not match

5. KEEP IT SIMPLE:
   - Prefer ONE tool over multiple tools
   - When query has multiple aspects, use unified-search
   - Trust the API to handle natural language

For each tool you want to use, provide:
1. The tool name
2. The exact parameters to pass (ALWAYS include: query with FULL text, analysis object from above)
3. A weight (0.5-2.0) for result importance  
4. Brief reasoning

CRITICAL for unified-search: 
- Always include { query: <full original query>, analysis: <analysis object from above> }
- The analysis helps the tool understand how to break down the query properly

REMEMBER: Context matters! Look at the conversation history.
- New combined search → unified-search for INTERSECTION
- Refinement of previous → consider filtering stored results
- Addition to previous → may need UNION of searches
- "Show me more" → continuation of same search
When in doubt, consider what the user is trying to achieve.`;

    const result = await generateObject({
      model: oncobot.languageModel('oncobot-x-fast'), // Use fast model for quick planning
      schema: ExecutionPlanSchema,
      prompt,
      temperature: 0.0
    });
    
    // Add tool references to the plan
    return {
      ...result.object,
      tools: toolRegistry
    };
    
  } catch (error) {
    // AI failed - minimal execution
    return {
      executions: [{
        tool: 'unified-search',
        parameters: { query, maxResults, filters },
        weight: 1.0,
        reasoning: 'AI planning failed - basic search'
      }],
      strategy: 'fallback',
      tools: toolRegistry
    };
  }
}

/**
 * Execute AI's plan - NO switch statements, NO conditionals
 */
async function executeAIPlan(plan: any): Promise<any[]> {
  const results = [];
  
  // Execute each tool as AI planned (no hardcoded logic)
  for (const execution of plan.executions) {
    try {
      const tool = plan.tools[execution.tool];
      
      if (!tool) {
        debug.error(DebugCategory.ERROR, `Unknown tool: ${execution.tool}`, new Error(`Tool not found: ${execution.tool}`));
        continue;
      }
      
      // Debug: Log the exact parameters being passed
      debug.log(DebugCategory.ORCHESTRATION, `Executing ${execution.tool}`, {
        parameters: JSON.stringify(execution.parameters, null, 2)
      });
      
      // Direct execution with AI's parameters
      const result = await tool.search
        ? await tool.search(execution.parameters)
        : await tool.lookup
        ? await tool.lookup(execution.parameters.nctId || execution.parameters)
        : null;
      
      if (result?.success) {
        results.push({
          source: execution.tool,
          trials: result.trials || (result.trial ? [result.trial] : []),
          weight: execution.weight,
          reasoning: execution.reasoning
        });
      }
    } catch (error) {
      debug.error(DebugCategory.ERROR, `Tool ${execution.tool} failed`, error);
      // Continue with other tools
    }
  }
  
  return results;
}

/**
 * Simple failure response - embrace imperfection
 */
function simpleFailure(query: string): any {
  return {
    success: false,
    error: 'Search unavailable',
    matches: [],
    query
  };
}
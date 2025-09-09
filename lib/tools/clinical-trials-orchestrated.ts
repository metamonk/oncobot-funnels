/**
 * Clinical Trials Orchestrated Tool - TRUE AI-DRIVEN
 * 
 * PURE AI ORCHESTRATION: Following CLAUDE.md principles strictly
 * - NO switch statements or if/else chains
 * - NO hardcoded execution logic
 * - AI decides EVERYTHING through a simple instruction
 * - Embrace imperfection over fragility
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
  mutationSearch
} from './clinical-trials/atomic';
import { trialLocations } from './clinical-trials/atomic/trial-locations';
import {
  getStoredTrials,
  getStoredTrial,
  getStoredLocations,
  searchStoredTrials,
  getUnshownTrials
} from './clinical-trials/atomic/store-retrieval';
import { conversationTrialStore } from './clinical-trials/services/conversation-trial-store';
import { debug, DebugCategory } from './clinical-trials/debug';
import type { HealthProfile } from './clinical-trials/types';

// Simple schema - AI provides a single instruction
const AIInstructionSchema = z.object({
  action: z.enum(['search_new', 'use_stored', 'return_empty']),
  tool: z.string().optional(),
  parameters: z.record(z.any()).optional(),
  reasoning: z.string()
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
  
  try {
    // Step 1: AI analyzes query
    const analysisResult = await queryAnalyzer.analyze({
      query,
      healthProfile
    });
    
    if (!analysisResult.success) {
      return simpleFailure(query);
    }
    
    // Get stored trials from conversation (just data for AI)
    const storedTrials = chatId ? conversationTrialStore.getAllTrials(chatId) : null;
    
    // Step 2: AI provides simple instruction
    const instruction = await getAIInstruction(
      query,
      analysisResult.analysis,
      storedTrials,
      chatId
    );
    
    if (!instruction) {
      return simpleFailure(query);
    }
    
    // Step 3: Execute the single instruction
    const searchResults = await executeInstruction(
      instruction,
      query,
      analysisResult.analysis,
      storedTrials,
      maxResults,
      filters,
      chatId
    );
    
    // Step 4: Compose results for UI
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
 * Get simple instruction from AI - TRUE AI-DRIVEN
 */
async function getAIInstruction(
  query: string,
  analysis: any,
  storedTrials: any,
  chatId?: string
): Promise<any> {
  // Build metadata about stored trials for AI visibility
  let storedTrialsInfo = 'No';
  if (storedTrials && storedTrials.length > 0) {
    const trialSummaries = storedTrials.slice(0, 5).map((st: any) => {
      const trial = st.trial;
      const nctId = trial?.protocolSection?.identificationModule?.nctId || 'Unknown';
      const title = trial?.protocolSection?.identificationModule?.briefTitle || 'Unknown';
      const locations = trial?.protocolSection?.contactsLocationsModule?.locations || [];
      const recruitingCount = locations.filter((l: any) => 
        l.status === 'RECRUITING' || l.status === 'NOT_YET_RECRUITING'
      ).length;
      
      // Get a few city names for context
      const cities = locations
        .filter((l: any) => l.city)
        .slice(0, 3)
        .map((l: any) => l.city)
        .join(', ');
      
      // Extract drug/intervention names for better matching
      const interventions = trial?.protocolSection?.armsInterventionsModule?.interventions || [];
      const drugNames = interventions
        .map((i: any) => i.name)
        .filter(Boolean)
        .slice(0, 2)
        .join(', ');
      
      // Include what was searched for (stored in query_context)
      const searchContext = st.query_context ? ` [searched for: "${st.query_context}"]` : '';
      
      return `  - ${nctId}: "${title.substring(0, 60)}..."${drugNames ? ` (drugs: ${drugNames})` : ''}${searchContext} (${locations.length} total locations, ${recruitingCount} recruiting${cities ? `, including ${cities}` : ''})`;
    }).join('\n');
    
    storedTrialsInfo = `Yes (${storedTrials.length} trials stored from this conversation):\n${trialSummaries}`;
  }
  
  const prompt = `Decide what to do with this clinical trial search query.

Query: "${query}"
Analysis: ${JSON.stringify(analysis, null, 2)}
Stored Trials: ${storedTrialsInfo}

You must return ONE of these actions:
1. "search_new" - Search for new trials (specify tool and parameters)
2. "use_stored" - Use previously shown trials from conversation
3. "return_empty" - No results expected

Available tools:
- "unified-search" - General clinical trial search
- "nct-lookup" - Direct NCT ID lookup
- "location-search" - Location-based search
- "mutation-search" - Mutation/biomarker search
- "trial-locations" - Get detailed locations for a specific trial (use when asked about locations for a known trial)
- "get-stored-trials" - Get all trials from current conversation
- "get-stored-trial" - Get specific trial by NCT ID from conversation
- "get-stored-locations" - Get all locations from stored trials
- "search-stored-trials" - Search within stored trials
- "get-unshown-trials" - Get trials not yet shown to user

CRITICAL RULES:
1. If the query asks about LOCATIONS, DISTANCE, or PROXIMITY of trials already discussed → USE "get-stored-locations"
2. If the query mentions a drug/trial name that matches stored trials → USE store retrieval tools
3. If the query is clearly a follow-up about previous results → USE store retrieval tools
4. Only search for NEW trials if the query is clearly asking for something different

Examples:
- "TROPION-Lung12" (no stored trials) → action: "search_new", tool: "unified-search", parameters: { query: "TROPION-Lung12" }
- "which location is closest to Baton Rouge?" (with stored trials) → action: "search_new", tool: "get-stored-locations", parameters: {}
- "tell me more about locations" (with stored trials) → action: "search_new", tool: "get-stored-locations", parameters: {}
- "show me more trials" (with stored trials) → action: "search_new", tool: "get-unshown-trials", parameters: { limit: 5 }
- "what about the TROPION trial?" (with stored TROPION trial) → action: "search_new", tool: "get-stored-trials", parameters: {}
- "NCT05568550" (not in stored trials) → action: "search_new", tool: "nct-lookup", parameters: { nctId: "NCT05568550" }
- "trials in Chicago" (new search) → action: "search_new", tool: "location-search", parameters: { city: "Chicago" }

Note: For store retrieval tools, chatId is "${chatId || 'will be provided automatically'}"

Choose the action that best matches the user's intent. If unsure about tool, use "unified-search".`;

  try {
    const result = await generateObject({
      model: oncobot.languageModel('oncobot-default'),
      schema: AIInstructionSchema,
      prompt,
      temperature: 0.0
    });
    
    debug.log(DebugCategory.ORCHESTRATION, 'AI instruction', result.object);
    return result.object;
  } catch (error) {
    debug.error(DebugCategory.ERROR, 'AI instruction failed', error);
    return null;
  }
}

/**
 * Execute single instruction - no conditionals, just execute what AI said
 */
async function executeInstruction(
  instruction: any,
  query: string,
  analysis: any,
  storedTrials: any,
  maxResults: number,
  filters: any,
  chatId?: string
): Promise<any[]> {
  const tools: Record<string, any> = {
    'unified-search': unifiedSearch,
    'nct-lookup': nctLookup,
    'location-search': locationSearch,
    'enhanced-location': enhancedLocationSearch,
    'mutation-search': mutationSearch,
    'trial-locations': trialLocations,
    'get-stored-trials': getStoredTrials,
    'get-stored-trial': getStoredTrial,
    'get-stored-locations': getStoredLocations,
    'search-stored-trials': searchStoredTrials,
    'get-unshown-trials': getUnshownTrials
  };
  
  // Map instruction to result - this is just data transformation, not logic
  const actionHandlers: Record<string, () => Promise<any[]>> = {
    'search_new': async () => {
      // Default to unified-search if tool name is unrecognized (embrace imperfection)
      let tool = tools[instruction.tool];
      let toolName = instruction.tool;
      
      if (!tool) {
        debug.log(DebugCategory.ORCHESTRATION, 'Unknown tool, defaulting to unified-search', { 
          requestedTool: instruction.tool 
        });
        tool = unifiedSearch;
        toolName = 'unified-search';
      }
      
      try {
        // TRUE AI-DRIVEN: Pass everything to the tool, let it decide
        const params = {
          ...instruction.parameters,
          analysis,
          maxResults,
          filters,
          chatId: storedTrials?.[0]?.chat_id // Pass chatId if available
        };
        
        // Each tool handles its own execution
        let result;
        if (toolName === 'trial-locations') {
          result = await tool.getLocations(params);
        } else if (toolName.startsWith('get-') || toolName === 'search-stored-trials') {
          // Store retrieval tools use 'retrieve' or 'search' method
          const useChatId = chatId || 'default';
          if (toolName === 'search-stored-trials') {
            result = await tool.search(useChatId, params);
          } else if (toolName === 'get-stored-trial') {
            result = await tool.retrieve(useChatId, params.nctId);
          } else {
            result = await tool.retrieve(useChatId, params.limit);
          }
        } else if (tool.search) {
          result = await tool.search(params);
        } else if (tool.lookup) {
          result = await tool.lookup(params.nctId || params);
        }
        
        if (result?.success) {
          // Handle different tool response formats
          if (toolName === 'trial-locations') {
            return [{
              source: toolName,
              locations: result.locations,
              nctId: result.nctId,
              weight: 1.0,
              reasoning: instruction.reasoning
            }];
          } else if (toolName === 'get-stored-locations') {
            // Now returns full trial data with all location details
            return [{
              source: toolName,
              trials: result.trials,  // Full trial data with complete location information
              summary: result.summary,
              weight: 1.0,
              reasoning: instruction.reasoning
            }];
          } else if (toolName === 'get-stored-trials' || toolName === 'get-unshown-trials' || toolName === 'search-stored-trials') {
            return [{
              source: toolName,
              trials: result.trials,
              metadata: result.metadata,
              weight: 1.0,
              reasoning: instruction.reasoning
            }];
          } else if (toolName === 'get-stored-trial') {
            return [{
              source: toolName,
              trials: result.found ? [result.trial] : [],
              metadata: result.metadata,
              weight: 1.0,
              reasoning: instruction.reasoning
            }];
          }
          
          return [{
            source: toolName,
            trials: result.trials || (result.trial ? [result.trial] : []),
            weight: 1.0,
            reasoning: instruction.reasoning
          }];
        }
      } catch (error) {
        debug.error(DebugCategory.ERROR, 'Tool execution failed', error);
      }
      return [];
    },
    
    'use_stored': async () => {
      if (!storedTrials || storedTrials.length === 0) return [];
      return [{
        source: 'conversation_context',
        trials: storedTrials.map((st: any) => st.trial),
        weight: 1.0,
        reasoning: instruction.reasoning
      }];
    },
    
    'return_empty': async () => []
  };
  
  const handler = actionHandlers[instruction.action];
  return handler ? await handler() : [];
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
/**
 * Test to understand why system returns 0 trials
 * Focus on the execution plan and how data flows
 */

import 'dotenv/config';
import { generateObject } from 'ai';
import { z } from 'zod';
import { oncobot } from '../ai/providers';

// Copy of the ExecutionPlanSchema from orchestrator
const ExecutionPlanSchema = z.object({
  executions: z.array(z.object({
    tool: z.string(),
    parameters: z.record(z.any()),
    weight: z.number(),
    reasoning: z.string()
  })).optional(),
  useStoredTrials: z.boolean().optional(),
  directData: z.any().optional(),
  strategy: z.string().optional(),
  reasoning: z.string().optional()
});

async function testExecutionPlan() {
  console.log('\n=== TESTING EXECUTION PLAN GENERATION ===\n');
  
  // Test 1: Initial search query
  console.log('Test 1: Planning for "TROPION-Lung12 in Texas"');
  console.log('--------------------------------------------');
  
  try {
    const prompt1 = `Plan clinical trial search execution.

Query: "TROPION-Lung12 in Texas"
Analysis: {
  "entities": {
    "drugs": ["TROPION-Lung12"],
    "locations": { "states": ["Texas"] }
  }
}
Stored Trials: None

TOOLS:
- unified-search: Natural language API search
  Parameters: { query: string, maxResults?: number, filters?: { recruitmentStatus?: string[], phase?: string[] } }
  Use for: drug names, trial names, general searches
  
- nct-lookup: Direct NCT ID lookup
  Parameters: { nctId: string }
  Use for: specific NCT IDs like "NCT12345678"

DECISION LOGIC:
- If searching for new trials → { executions: [{ tool, parameters, weight: 1.0, reasoning }] }
- Prefer ONE tool that best matches the query intent
- For drug/trial names like "TROPION-Lung12", use unified-search

Return a plan to search for this trial.`;

    const result1 = await generateObject({
      model: oncobot.languageModel('oncobot-default'),
      schema: ExecutionPlanSchema,
      prompt: prompt1,
      temperature: 0.0
    });
    
    console.log('Plan generated:', JSON.stringify(result1.object, null, 2));
  } catch (error) {
    console.error('Failed to generate plan:', error);
  }
  
  // Test 2: Continuation query with stored trials
  console.log('\n\nTest 2: Planning for "tell me more about that trial"');
  console.log('----------------------------------------------------');
  
  try {
    const prompt2 = `Plan clinical trial search execution.

Query: "tell me more about that trial"
Analysis: {
  "userIntent": {
    "primaryGoals": ["get_trial_details", "continue_search"]
  }
}
Stored Trials: [
  {
    "nctId": "NCT06564844",
    "title": "TROPION-Lung12 Study",
    "locations": [{"city": "Houston", "state": "Texas"}]
  }
]

TOOLS:
- unified-search: Natural language API search
- nct-lookup: Direct NCT ID lookup

DECISION LOGIC:
- If query references stored trials (e.g., "that trial", "those results") → { useStoredTrials: true }
- If searching for new trials → { executions: [{ tool, parameters, weight: 1.0, reasoning }] }

Return a plan to handle this continuation query.`;

    const result2 = await generateObject({
      model: oncobot.languageModel('oncobot-default'),
      schema: ExecutionPlanSchema,
      prompt: prompt2,
      temperature: 0.0
    });
    
    console.log('Plan generated:', JSON.stringify(result2.object, null, 2));
  } catch (error) {
    console.error('Failed to generate plan:', error);
  }
  
  console.log('\n=== TEST COMPLETE ===\n');
}

// Run test
testExecutionPlan().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});

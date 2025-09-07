/**
 * Clinical Trials Information Tool
 * 
 * Provides educational and informational content about clinical trials using
 * a modular, extensible architecture.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { DataStreamWriter } from 'ai';
import { handleInfoQuery, initializeModules, type InfoContext } from './clinical-trials/info-modules';

// Initialize modules on first load
initializeModules();

export const clinicalTrialsInfoTool = (dataStream?: DataStreamWriter) =>
  tool({
    description: 'ALWAYS use this tool for questions about: how clinical trials work, eligibility requirements, how to qualify, trial phases, costs, safety, rights, biomarker testing, or any general/educational questions about clinical trials. DO NOT use the clinical_trials search tool for these informational queries. This provides curated educational content, not trial searches.',
    parameters: z.object({
      query: z.string().describe('The user\'s question about clinical trials'),
      hasHealthProfile: z.boolean().describe('Whether the user has a completed health profile')
    }),
    execute: async ({ query, hasHealthProfile }) => {
      try {
        // Create context for module system
        const context: InfoContext = {
          hasProfile: hasHealthProfile,
          query,
          // Could add more context here like:
          // userProfile: await getUserProfile(),
          // previousQuestions: getPreviousQuestions(),
          // sessionContext: getSessionContext()
        };

        // Handle query through modular system
        const response = await handleInfoQuery(query, context);

        // Write UI annotations if needed
        if (dataStream) {
          if (response.requiresProfile && !hasHealthProfile) {
            dataStream.writeMessageAnnotation({
              type: 'show_profile_prompt',
              data: {
                reason: 'User asking about trials but has no profile',
                context: response.sourceModules[0]
              }
            });
          }

          dataStream.writeMessageAnnotation({
            type: 'info_response',
            data: {
              modules: response.sourceModules,
              hasProfile: hasHealthProfile,
              responseType: response.type,
              compositionStrategy: response.compositionStrategy
            }
          });
        }

        return {
          success: true,
          response, // Return the InfoResponse object directly for compatibility
          detectedCategory: response.sourceModules ? response.sourceModules.join('/') : null, // Provide detected category for logging
          requiresProfilePrompt: response.requiresProfile
        };

      } catch (error) {
        console.error('Clinical Trials Info error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'An error occurred',
          response: {
            type: 'educational',
            title: 'Clinical Trials Information',
            content: 'I can help you learn about clinical trials. Please try rephrasing your question.'
          }
        };
      }
    },
  });
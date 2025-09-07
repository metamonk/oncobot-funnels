/**
 * Clinical Trials Details Tool
 * 
 * TRUE AI-DRIVEN: Following CLAUDE.md principles
 * - AI decides when to call this for detailed information
 * - No patterns, just data retrieval
 * - Efficient token usage - only called when needed
 */

import { tool } from 'ai';
import { z } from 'zod';
import { trialDetailsRetriever } from './clinical-trials/atomic/trial-details-retriever';

const trialDetailsSchema = z.object({
  nctId: z.string().describe('The NCT ID of the trial to get details for'),
  chatId: z.string().describe('The chat ID for conversation context'),
  includeLocations: z.boolean().default(true).describe('Include detailed location information'),
  userLatitude: z.number().optional().describe('User latitude for distance calculations'),
  userLongitude: z.number().optional().describe('User longitude for distance calculations')
});

const locationSearchSchema = z.object({
  chatId: z.string().describe('The chat ID for conversation context'),
  state: z.string().optional().describe('State to search for (e.g., "Texas")'),
  city: z.string().optional().describe('City to search for (e.g., "Houston")'),
  withinMiles: z.number().optional().describe('Search radius in miles'),
  userLatitude: z.number().optional().describe('User latitude for distance calculations'),
  userLongitude: z.number().optional().describe('User longitude for distance calculations')
});

/**
 * Tool for getting detailed trial information
 * AI calls this when user asks about specific locations, distances, or trial details
 */
export const clinicalTrialsDetailsTool = (chatId: string) => tool({
  description: `Get detailed information about a specific clinical trial.

Use this tool when the user asks about:
- Specific locations for a trial ("Where exactly is NCT12345678?")
- Distance to trials ("How far is the nearest site?")
- Which trial is closest ("Which one is nearest to me?")
- Detailed eligibility or intervention information
- Contact information for a trial

This tool provides:
- Full location details with facility names, cities, states
- Distance calculations when user coordinates are available
- Detailed eligibility criteria
- Intervention details
- Contact information

IMPORTANT: Only call this for trials that have already been found in the conversation.
The trial must exist in the conversation context to retrieve its details.`,
  parameters: trialDetailsSchema,
  execute: async ({ nctId, chatId, includeLocations, userLatitude, userLongitude }) => {
    console.log('🔍 Getting detailed trial information:', { nctId, includeLocations });
    
    const userCoordinates = userLatitude && userLongitude 
      ? { latitude: userLatitude, longitude: userLongitude }
      : undefined;
    
    const result = await trialDetailsRetriever.getDetails({
      chatId,
      nctId,
      includeLocations,
      userCoordinates
    });
    
    if (!result.success) {
      return {
        error: result.error || 'Failed to retrieve trial details',
        success: false
      };
    }
    
    // Format response for AI consumption
    return {
      success: true,
      nctId: result.nctId,
      title: result.briefTitle,
      locations: result.locations?.map(loc => ({
        facility: loc.facility,
        city: loc.city,
        state: loc.state,
        status: loc.status,
        distance: loc.distance?.description
      })),
      nearestLocation: result.nearestLocation ? {
        facility: result.nearestLocation.facility,
        city: result.nearestLocation.city,
        state: result.nearestLocation.state,
        distance: result.nearestLocation.distance?.description,
        miles: result.nearestLocation.distance?.miles
      } : undefined,
      interventions: result.interventions,
      eligibility: result.eligibilityCriteria,
      contact: result.contactInfo
    };
  }
});

/**
 * Tool for searching stored trials by location
 * AI calls this to answer "Which trials are in Texas?" type questions
 */
export const searchTrialsByLocationTool = (chatId: string) => tool({
  description: `Search through already-found trials to filter by location.

Use this tool when the user asks:
- "Which of these trials are in Texas?"
- "Do any of these have sites in Chicago?"
- "Which trials are within 50 miles of me?"
- "Are there any in California?"

This searches ONLY through trials already found in the conversation.
It does NOT search for new trials - use the main clinical_trials tool for that.`,
  parameters: locationSearchSchema,
  execute: async ({ chatId, state, city, withinMiles, userLatitude, userLongitude }) => {
    console.log('🗺️ Searching stored trials by location:', { state, city, withinMiles });
    
    const userCoordinates = userLatitude && userLongitude 
      ? { latitude: userLatitude, longitude: userLongitude }
      : undefined;
    
    const result = await trialDetailsRetriever.searchStoredTrialsByLocation({
      chatId,
      state,
      city,
      withinMiles,
      userCoordinates
    });
    
    if (!result.success) {
      return {
        error: 'Failed to search trials by location',
        success: false
      };
    }
    
    // Format for AI - keep it concise
    return {
      success: true,
      matchCount: result.matches.length,
      matches: result.matches.map(match => ({
        nctId: match.nctId,
        title: match.briefTitle,
        locationCount: match.matchingLocations.length,
        locations: match.matchingLocations.slice(0, 3).map(loc => ({
          city: loc.city,
          state: loc.state,
          status: loc.status,
          distance: loc.distance?.description
        }))
      })),
      searchCriteria: {
        state,
        city,
        withinMiles
      }
    };
  }
});
/**
 * Clinical Trials Tool Wrapper
 * 
 * TRUE AI-DRIVEN: Following CLAUDE.md principles strictly
 * Wraps the orchestrated search for AI model consumption
 */

import { tool } from 'ai';
import { z } from 'zod';
import { DataStreamWriter } from 'ai';
import { searchClinicalTrialsOrchestrated } from './clinical-trials-orchestrated';
import { getUserHealthProfile } from '@/lib/health-profile-actions';
import { createAISearchSummary } from './clinical-trials/services/trial-compression';

// TRUE AI-DRIVEN: Simple schema that works with ALL models
// The AI decides everything - we just need the query
const clinicalTrialsSchema = z.object({
  query: z.string().describe('The search query for clinical trials')
});

export const clinicalTrialsOrchestratedTool = (
  chatId: string,
  dataStream?: DataStreamWriter,
  options?: { 
    latitude?: string; 
    longitude?: string;
  }
) => tool({
  description: `Search for clinical trials and compose comprehensive answers.

SMART DATA HANDLING: You receive compressed trial summaries to avoid context limits.
Each trial summary contains:
- nctId: Trial identifier 
- briefTitle: Trial name
- overallStatus: Current recruitment status
- briefSummary: Short description (200 chars)
- primaryCondition: Main cancer type
- locationCount & recruitingLocationCount: Site statistics
- sampleCities: Example locations
- interventions: Treatment names
- locationSummary: Complete location info with recruiting status (when available)
- matchScore: Relevance score (when available)
- eligibilityAssessment: Eligibility analysis (when available)

The locationSummary field contains ALL location information.
Example: "Texas: Austin, Dallas, Houston (4 recruiting, 3 not yet); Louisiana: No active sites"

Use this data to compose helpful, personalized answers that:
- Explain WHY trials are relevant to the patient
- Highlight key eligibility requirements  
- Provide location-specific information
- Discuss interventions in patient-friendly terms
- Note any molecular marker requirements (e.g., KRAS G12C)
- Consider the patient's health profile when available

Search capabilities:
- Conditions: "lung cancer", "NSCLC", specific cancer types
- Locations: "trials in Chicago", "Texas", "near me"
- Mutations: "KRAS G12C", "EGFR", biomarkers
- Trial names: "TROPION-Lung12", "KEYNOTE-671"
- NCT IDs: Direct lookup like "NCT12345678"
- Complex queries: Combine multiple criteria naturally`,
  parameters: clinicalTrialsSchema,
  execute: async ({ query }) => {
    // TRUE AI-DRIVEN: Let the orchestrator decide everything
    // Default to 10 results, but AI can request more through the query
    console.log('🔬 Clinical Trials Tool - AI orchestrated search:', { query });
    
    try {
      // Get user's health profile if available
      let healthProfile = null;
      try {
        const profileData = await getUserHealthProfile();
        if (profileData?.profile) {
          // Map the profile to match HealthProfile type
          const profile = profileData.profile;
          healthProfile = {
            userId: profile.id,
            cancerRegion: profile.cancerRegion ?? '',
            cancerType: profile.cancerType ?? '',
            diseaseStage: profile.diseaseStage ?? '',
            molecularMarkers: profile.molecularMarkers ?? {},
            treatmentHistory: profile.treatmentHistory ?? [],
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          } as any; // Type assertion to handle minor differences
        }
      } catch (error) {
        console.log('No health profile available, continuing without it');
      }
      
      // For now, we don't have city/state from coordinates
      // The orchestrator can work without location data
      const userLocation = undefined;
      
      // TRUE AI-DRIVEN: Let the orchestrator decide everything
      // No default filters - the AI understands the query intent
      const result = await searchClinicalTrialsOrchestrated({
        query,
        healthProfile,
        userLocation,
        chatId,
        maxResults: 10,  // Default to 10 results
        filters: undefined  // Let AI decide based on query
      });
      
      // SMART TOKEN MANAGEMENT: Separate UI and AI data
      // Write FULL data to stream for UI rendering
      if (dataStream && result.matches && result.matches.length > 0) {
        dataStream.writeMessageAnnotation({
          type: 'clinicalTrialsSearchResults',
          data: result  // Full data with complete trial objects for UI
        });
      }
      
      // INTELLIGENT DATA SEPARATION: Full data for UI, compressed for AI
      // This prevents context_length_exceeded errors while preserving functionality
      if (result.success) {
        const fullDataSize = JSON.stringify(result).length;
        const compressedResult = createAISearchSummary(result);
        const compressedSize = JSON.stringify(compressedResult).length;
        
        console.log('🔬 Smart data compression:', {
          trialCount: result.matches?.length || 0,
          fullDataSize,
          compressedSize,
          compressionRatio: `${Math.round((compressedSize / fullDataSize) * 100)}%`,
          fullDataInAnnotations: true,
          aiGetsCompressed: true
        });
        
        // Return compressed data for AI to avoid context window limits
        // Full data is already in annotations for UI rendering
        return compressedResult;
      }
      
      // Return minimal structure even on failure
      return {
        success: false,
        error: result.error || 'Search failed',
        matches: [],
        totalCount: 0,
        message: result.message || 'Search failed',
        _fullDataInAnnotations: false
      };
      
    } catch (error) {
      console.error('Clinical trials tool error:', error);
      // Return structure that matches UI expectations
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
        matches: [],  // UI expects 'matches' not 'trials'
        totalCount: 0,
        message: 'Search failed due to an error'
      };
    }
  }
});
import { tool } from 'ai';
import { z } from 'zod';
import { DataStreamWriter } from 'ai';
import { 
  getUserHealthProfile, 
  createHealthProfile, 
  updateHealthProfile,
  deleteHealthProfile,
  hasCompletedHealthProfile
} from '@/lib/health-profile-actions';

// Helper function to format cancer region names
const formatCancerRegion = (region: string): string => {
  const regionNames: Record<string, string> = {
    'THORACIC': 'Thoracic/Lung',
    'GU': 'Genitourinary',
    'GI': 'Gastrointestinal',
    'GYN': 'Gynecologic',
    'BREAST': 'Breast',
    'HEAD_NECK': 'Head and Neck',
    'CNS': 'Brain/CNS',
    'HEMATOLOGIC': 'Blood/Hematologic',
    'SKIN': 'Skin',
    'SARCOMA': 'Sarcoma',
    'PEDIATRIC': 'Pediatric',
    'RARE': 'Rare'
  };
  return regionNames[region] || region;
};

// Helper function to format stage names
const formatStage = (stage: string): string => {
  const stageNames: Record<string, string> = {
    'STAGE_I': 'Stage I',
    'STAGE_II': 'Stage II',
    'STAGE_III': 'Stage III',
    'STAGE_IV': 'Stage IV',
    'RECURRENT': 'Recurrent',
    'UNKNOWN': 'Unknown'
  };
  return stageNames[stage] || stage;
};

// Helper function to extract molecular markers
const extractMolecularMarkers = (markers: any): string[] => {
  if (!markers) return [];
  
  const markerList: string[] = [];
  Object.entries(markers).forEach(([key, value]) => {
    if (value && key !== 'testingStatus' && value !== 'UNKNOWN') {
      if (Array.isArray(value)) {
        markerList.push(...value as string[]);
      } else if (typeof value === 'string') {
        markerList.push(`${key}: ${value}`);
      } else if (typeof value === 'boolean' && value) {
        markerList.push(key);
      }
    }
  });
  
  return markerList;
};

// Helper function to build profile summary
const buildProfileSummary = (profile: any, responses: any[]): {
  summary: string;
  details: Record<string, any>;
} => {
  const summaryParts: string[] = [];
  const details: Record<string, any> = {};
  
  // Cancer region and type
  if (profile.cancerRegion) {
    const regionName = formatCancerRegion(profile.cancerRegion);
    summaryParts.push(`Cancer type: ${regionName}`);
    details.cancerRegion = {
      value: profile.cancerRegion,
      displayName: regionName
    };
  }
  
  if (profile.cancerType && profile.cancerType !== 'OTHER' && profile.cancerType !== 'UNKNOWN') {
    const cleanType = profile.cancerType.replace(/_/g, ' ').toLowerCase();
    summaryParts.push(`Specific type: ${cleanType}`);
    details.cancerType = cleanType;
  }
  
  // Stage
  if (profile.diseaseStage) {
    const stageName = formatStage(profile.diseaseStage);
    summaryParts.push(`Stage: ${stageName}`);
    details.stage = {
      value: profile.diseaseStage,
      displayName: stageName
    };
  }
  
  // Molecular markers
  const markers = extractMolecularMarkers(profile.molecularMarkers);
  if (markers.length > 0) {
    summaryParts.push(`Molecular markers: ${markers.join(', ')}`);
    details.molecularMarkers = markers;
  }
  
  // Treatment history
  if (profile.treatmentHistory) {
    const treatments: string[] = [];
    const history = profile.treatmentHistory as Record<string, any>;
    
    if (history.chemotherapy === 'YES') treatments.push('Chemotherapy');
    if (history.radiation === 'YES') treatments.push('Radiation');
    if (history.surgery === 'YES') treatments.push('Surgery');
    if (history.immunotherapy === 'YES') treatments.push('Immunotherapy');
    if (history.targetedTherapy === 'YES') treatments.push('Targeted therapy');
    
    if (treatments.length > 0) {
      summaryParts.push(`Previous treatments: ${treatments.join(', ')}`);
      details.treatmentHistory = treatments;
    }
  }
  
  // Performance status
  if (profile.performanceStatus) {
    summaryParts.push(`Performance status: ${profile.performanceStatus}`);
    details.performanceStatus = profile.performanceStatus;
  }
  
  // Process responses for additional details
  responses.forEach(response => {
    if (response.questionId === 'DIAGNOSIS_DATE' && response.response) {
      details.diagnosisDate = response.response;
    }
    if (response.questionId === 'CURRENT_TREATMENT' && response.response) {
      details.currentTreatment = response.response;
    }
  });
  
  return {
    summary: summaryParts.join('; '),
    details
  };
};

// Main tool export
export const healthProfileTool = (dataStream?: DataStreamWriter) =>
  tool({
    description: 'Manage user health profiles with multiple actions: check if profile exists, get detailed information, get summary, create, update, or delete profiles.',
    parameters: z.object({
      query: z.string().describe('The action to perform (check, get_details, get_summary, create, update, delete, completion_status) and any associated data as a natural language query')
    }),
    execute: async ({ query }) => {
      let action = 'check'; // Default action, declared outside try block
      
      try {
        // Parse the query to extract action and data
        let profileData = undefined;
        let includeResponses = false;
        
        // Simple action detection from query
        if (query.includes('check') || query.includes('exist')) {
          action = 'check';
        } else if (query.includes('detail')) {
          action = 'get_details';
        } else if (query.includes('summary')) {
          action = 'get_summary';
        } else if (query.includes('create')) {
          action = 'create';
        } else if (query.includes('update')) {
          action = 'update';
        } else if (query.includes('delete')) {
          action = 'delete';
        } else if (query.includes('completion') || query.includes('status')) {
          action = 'completion_status';
        }
        
        switch (action) {
          case 'check': {
            // Quick check if user has a profile
            try {
              const profileData = await getUserHealthProfile();
              
              if (!profileData || !profileData.profile) {
                // Send annotation to trigger UI prompt
                dataStream?.writeMessageAnnotation({
                  type: 'health_profile_prompt',
                  data: {
                    reason: 'no_profile',
                    message: 'Complete your health profile for personalized clinical trial matches'
                  }
                });
                
                return {
                  hasProfile: false,
                  message: "No health profile found. Would you like to create one or share your health information?"
                };
              }
              
              return {
                hasProfile: true,
                profileId: profileData.profile.id,
                lastUpdated: profileData.profile.updatedAt,
                isComplete: profileData.profile.completedAt != null,
                message: "Health profile found"
              };
            } catch (error) {
              console.error('Error checking health profile:', error);
              return {
                hasProfile: false,
                error: true,
                message: "Unable to check health profile at this time"
              };
            }
          }
          
          case 'get_summary': {
            // Get a brief summary of the profile
            const data = await getUserHealthProfile();
            
            if (!data || !data.profile) {
              return {
                success: false,
                message: "No health profile found"
              };
            }
            
            const { summary, details } = buildProfileSummary(data.profile, data.responses);
            
            return {
              success: true,
              profileId: data.profile.id,
              summary: summary,
              keyPoints: details,
              lastUpdated: data.profile.updatedAt,
              isComplete: data.profile.completedAt != null
            };
          }
          
          case 'get_details': {
            // Get comprehensive profile information
            const data = await getUserHealthProfile();
            
            if (!data || !data.profile) {
              return {
                success: false,
                message: "No health profile found"
              };
            }
            
            const { summary, details } = buildProfileSummary(data.profile, data.responses);
            
            const result: any = {
              success: true,
              profile: {
                id: data.profile.id,
                cancerRegion: data.profile.cancerRegion,
                primarySite: data.profile.primarySite,
                cancerType: data.profile.cancerType,
                diseaseStage: data.profile.diseaseStage,
                treatmentHistory: data.profile.treatmentHistory,
                molecularMarkers: data.profile.molecularMarkers,
                performanceStatus: data.profile.performanceStatus,
                complications: data.profile.complications,
                createdAt: data.profile.createdAt,
                updatedAt: data.profile.updatedAt,
                completedAt: data.profile.completedAt,
              },
              summary: summary,
              structuredDetails: details
            };
            
            if (includeResponses) {
              result.responses = data.responses.map(r => ({
                questionId: r.questionId,
                response: r.response,
                timestamp: r.createdAt
              }));
            }
            
            return result;
          }
          
          case 'create': {
            // Create a new health profile
            if (!profileData) {
              return {
                success: false,
                message: "Profile data required for create action"
              };
            }
            
            dataStream?.writeMessageAnnotation({
              type: 'profile_status',
              data: {
                status: 'creating',
                message: 'Creating new health profile...'
              }
            });
            
            const newProfile = await createHealthProfile(profileData);
            
            dataStream?.writeMessageAnnotation({
              type: 'profile_status',
              data: {
                status: 'created',
                message: 'Health profile created successfully'
              }
            });
            
            return {
              success: true,
              profileId: newProfile.id,
              message: "Health profile created successfully",
              profile: newProfile
            };
          }
          
          case 'update': {
            // Update existing profile
            if (!profileData) {
              return {
                success: false,
                message: "Profile data required for update action"
              };
            }
            
            const currentData = await getUserHealthProfile();
            if (!currentData || !currentData.profile) {
              return {
                success: false,
                message: "No existing profile to update"
              };
            }
            
            dataStream?.writeMessageAnnotation({
              type: 'profile_status',
              data: {
                status: 'updating',
                message: 'Updating health profile...'
              }
            });
            
            const updatedProfile = await updateHealthProfile(
              currentData.profile.id,
              profileData
            );
            
            dataStream?.writeMessageAnnotation({
              type: 'profile_status',
              data: {
                status: 'updated',
                message: 'Health profile updated successfully'
              }
            });
            
            return {
              success: true,
              profileId: updatedProfile.id,
              message: "Health profile updated successfully",
              profile: updatedProfile
            };
          }
          
          case 'delete': {
            // Delete health profile
            const currentData = await getUserHealthProfile();
            if (!currentData || !currentData.profile) {
              return {
                success: false,
                message: "No profile to delete"
              };
            }
            
            dataStream?.writeMessageAnnotation({
              type: 'profile_status',
              data: {
                status: 'deleting',
                message: 'Deleting health profile...'
              }
            });
            
            await deleteHealthProfile(currentData.profile.id);
            
            dataStream?.writeMessageAnnotation({
              type: 'profile_status',
              data: {
                status: 'deleted',
                message: 'Health profile deleted successfully'
              }
            });
            
            return {
              success: true,
              message: "Health profile deleted successfully"
            };
          }
          
          case 'completion_status': {
            // Check if profile is completed
            const isCompleted = await hasCompletedHealthProfile();
            
            if (!isCompleted) {
              // Send annotation to trigger UI prompt for incomplete profile
              dataStream?.writeMessageAnnotation({
                type: 'health_profile_prompt',
                data: {
                  reason: 'incomplete_profile',
                  message: 'Complete your health profile for better clinical trial matches'
                }
              });
            }
            
            return {
              success: true,
              isCompleted: isCompleted,
              message: isCompleted 
                ? "Health profile is complete"
                : "Health profile is incomplete"
            };
          }
          
          default:
            throw new Error(`Unknown action: ${action}`);
        }
      } catch (error) {
        console.error('Health profile tool error:', error);
        
        dataStream?.writeMessageAnnotation({
          type: 'error',
          data: {
            message: error instanceof Error ? error.message : 'An error occurred',
            action: action
          }
        });
        
        return {
          success: false,
          error: error instanceof Error ? error.message : 'An error occurred',
          action: action
        };
      }
    },
  });
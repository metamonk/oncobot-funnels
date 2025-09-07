/**
 * Trial Details Retriever Atomic Tool
 * 
 * TRUE AI-DRIVEN: Following CLAUDE.md principles
 * - Single responsibility: Retrieve detailed trial information
 * - AI decides when to call this for location/distance queries
 * - Returns full location data with coordinates when available
 * - No patterns, no validation - just data retrieval
 */

import { conversationTrialStore } from '../services/conversation-trial-store';
import { geoIntelligence } from './geo-intelligence';
import { debug, DebugCategory } from '../debug';
import type { ClinicalTrial } from '../types';

interface LocationDetail {
  facility: string;
  city: string;
  state?: string;
  zip?: string;
  country: string;
  status: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  distance?: {
    miles: number;
    kilometers: number;
    description: string;
  };
}

interface TrialDetailsResult {
  success: boolean;
  nctId?: string;
  briefTitle?: string;
  locations?: LocationDetail[];
  nearestLocation?: LocationDetail;
  interventions?: string[];
  eligibilityCriteria?: string;
  contactInfo?: {
    centralContact?: {
      name?: string;
      phone?: string;
      email?: string;
    };
  };
  error?: string;
}

export class TrialDetailsRetrieverTool {
  /**
   * Get detailed trial information from conversation store
   * AI calls this when user asks about specific trial details
   */
  async getDetails(params: {
    chatId: string;
    nctId: string;
    includeLocations?: boolean;
    userCoordinates?: { latitude: number; longitude: number };
  }): Promise<TrialDetailsResult> {
    const { chatId, nctId, includeLocations = true, userCoordinates } = params;
    
    debug.log(DebugCategory.TOOL, 'Retrieving trial details', { nctId, chatId });
    
    try {
      // Get trial from conversation store
      const storedTrial = conversationTrialStore.getTrial(chatId, nctId);
      
      if (!storedTrial) {
        // Trial not in conversation - AI shouldn't have referenced it
        return {
          success: false,
          error: `Trial ${nctId} not found in conversation`
        };
      }
      
      const trial = storedTrial.trial;
      const result: TrialDetailsResult = {
        success: true,
        nctId,
        briefTitle: trial.protocolSection?.identificationModule?.briefTitle
      };
      
      // Extract detailed location information if requested
      if (includeLocations) {
        const locations = this.extractLocationDetails(trial, userCoordinates);
        result.locations = locations;
        
        // Find nearest location if user coordinates provided
        if (userCoordinates && locations.length > 0) {
          result.nearestLocation = locations.reduce((nearest, current) => {
            if (!current.distance || !nearest.distance) return nearest;
            return current.distance.miles < nearest.distance.miles ? current : nearest;
          });
        }
      }
      
      // Extract interventions
      const interventions = trial.protocolSection?.armsInterventionsModule?.interventions;
      if (interventions?.length) {
        result.interventions = interventions.map((i: any) => 
          `${i.type}: ${i.name}${i.description ? ` - ${i.description.substring(0, 100)}` : ''}`
        );
      }
      
      // Extract eligibility (truncated for token efficiency)
      const eligibility = trial.protocolSection?.eligibilityModule?.eligibilityCriteria;
      if (eligibility) {
        result.eligibilityCriteria = eligibility.substring(0, 1000) + 
          (eligibility.length > 1000 ? '...' : '');
      }
      
      // Extract contact information
      const contacts = trial.protocolSection?.contactsLocationsModule;
      if (contacts?.centralContacts?.[0]) {
        const contact = contacts.centralContacts[0];
        result.contactInfo = {
          centralContact: {
            name: contact.name,
            phone: contact.phone,
            email: contact.email
          }
        };
      }
      
      return result;
      
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'Failed to retrieve trial details', error);
      return {
        success: false,
        error: 'Failed to retrieve trial details'
      };
    }
  }
  
  /**
   * Extract detailed location information from trial
   */
  private extractLocationDetails(
    trial: ClinicalTrial, 
    userCoordinates?: { latitude: number; longitude: number }
  ): LocationDetail[] {
    const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
    
    return locations.map((loc: any) => {
      const detail: LocationDetail = {
        facility: loc.facility || 'Unknown facility',
        city: loc.city || 'Unknown city',
        state: loc.state,
        zip: loc.zip,
        country: loc.country || 'United States',
        status: loc.status || 'UNKNOWN'
      };
      
      // Add coordinates if available (would need geocoding service in production)
      // For now, we'll only calculate distance if coordinates are somehow available
      if (loc.geoPoint) {
        detail.coordinates = {
          latitude: loc.geoPoint.lat,
          longitude: loc.geoPoint.lon
        };
        
        // Calculate distance if user coordinates provided
        if (userCoordinates && detail.coordinates) {
          detail.distance = geoIntelligence.calculateDistance(
            userCoordinates,
            detail.coordinates
          );
        }
      }
      
      return detail;
    }).filter((loc: LocationDetail) => 
      // Only return locations that are recruiting or will be
      loc.status === 'RECRUITING' || 
      loc.status === 'NOT_YET_RECRUITING' ||
      loc.status === 'ENROLLING_BY_INVITATION'
    );
  }
  
  /**
   * Get multiple trial details at once (batch operation)
   */
  async getMultipleDetails(params: {
    chatId: string;
    nctIds: string[];
    includeLocations?: boolean;
    userCoordinates?: { latitude: number; longitude: number };
  }): Promise<TrialDetailsResult[]> {
    const results = await Promise.all(
      params.nctIds.map(nctId => 
        this.getDetails({
          ...params,
          nctId
        })
      )
    );
    
    return results;
  }
  
  /**
   * Search within stored trials for location matches
   * AI can use this to answer "which trials are in Texas?"
   */
  async searchStoredTrialsByLocation(params: {
    chatId: string;
    state?: string;
    city?: string;
    withinMiles?: number;
    userCoordinates?: { latitude: number; longitude: number };
  }): Promise<{
    success: boolean;
    matches: Array<{
      nctId: string;
      briefTitle: string;
      matchingLocations: LocationDetail[];
    }>;
  }> {
    const { chatId, state, city } = params;
    
    debug.log(DebugCategory.SEARCH, 'Searching stored trials by location', { state, city });
    
    // Get all trials from conversation
    const allTrials = conversationTrialStore.getAllTrials(chatId);
    const matches: Array<{
      nctId: string;
      briefTitle: string;
      matchingLocations: LocationDetail[];
    }> = [];
    
    for (const storedTrial of allTrials) {
      const trial = storedTrial.trial;
      const nctId = trial.protocolSection?.identificationModule?.nctId;
      if (!nctId) continue;
      
      const locations = this.extractLocationDetails(trial, params.userCoordinates);
      
      // Filter locations by criteria
      const matchingLocations = locations.filter(loc => {
        if (state && loc.state?.toLowerCase() !== state.toLowerCase()) return false;
        if (city && loc.city?.toLowerCase() !== city.toLowerCase()) return false;
        if (params.withinMiles && params.userCoordinates && loc.distance) {
          if (loc.distance.miles > params.withinMiles) return false;
        }
        return true;
      });
      
      if (matchingLocations.length > 0) {
        matches.push({
          nctId,
          briefTitle: trial.protocolSection?.identificationModule?.briefTitle || 'Unknown',
          matchingLocations
        });
      }
    }
    
    // Sort by number of matching locations
    matches.sort((a, b) => b.matchingLocations.length - a.matchingLocations.length);
    
    return {
      success: true,
      matches
    };
  }
}

// Export singleton instance
export const trialDetailsRetriever = new TrialDetailsRetrieverTool();
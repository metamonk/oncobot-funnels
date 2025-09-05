/**
 * Location Search Atomic Tool
 * 
 * CONTEXT-AWARE: Following CLAUDE.md principles
 * - Single responsibility: Search by location only
 * - Transparent operation: Clear location-based searching
 * - AI controls all parameters: No hidden assumptions
 */

import { ClinicalTrial } from '../types';
import { debug, DebugCategory } from '../debug';

interface LocationSearchParams {
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  radius?: number; // miles
  condition?: string; // Optional condition filter for location search
  status?: string[]; // Optional status filter
  maxResults?: number;
}

interface LocationSearchResult {
  success: boolean;
  trials: ClinicalTrial[];
  totalCount: number;
  error?: {
    type: 'invalid_location' | 'api_error' | 'no_results';
    message: string;
    suggestions: string[];
  };
  metadata: {
    searchLocation: {
      city?: string;
      state?: string;
      country?: string;
    };
    radius?: number;
    retrievedCount: number;
    hasMore: boolean;
    latency: number;
  };
}

export class LocationSearchTool {
  private static readonly API_BASE = 'https://clinicaltrials.gov/api/v2';
  
  /**
   * Search trials by location - transparent location-based search
   */
  async search(params: LocationSearchParams): Promise<LocationSearchResult> {
    const startTime = Date.now();
    const { 
      city, 
      state, 
      country = 'United States',
      zipCode,
      radius,
      condition,
      status = ['RECRUITING'],
      maxResults = 50 
    } = params;
    
    // Validate we have some location info
    if (!city && !state && !zipCode) {
      return {
        success: false,
        trials: [],
        totalCount: 0,
        error: {
          type: 'invalid_location',
          message: 'Must provide city, state, or zip code',
          suggestions: [
            'Provide a city name',
            'Provide a state name',
            'Provide a zip code',
            'Use coordinates with radius'
          ]
        },
        metadata: {
          searchLocation: {},
          retrievedCount: 0,
          hasMore: false,
          latency: Date.now() - startTime
        }
      };
    }
    
    debug.log(DebugCategory.SEARCH, 'Location search', { 
      city, 
      state, 
      country,
      zipCode,
      radius,
      condition 
    });
    
    try {
      // Build API parameters
      const apiParams = new URLSearchParams({
        'format': 'json',
        'pageSize': maxResults.toString(),
        'countTotal': 'true'
      });
      
      // Build location query
      let locationQuery = '';
      if (city) locationQuery = city;
      if (state) locationQuery = locationQuery ? `${locationQuery}, ${state}` : state;
      if (country && country !== 'United States') {
        locationQuery = locationQuery ? `${locationQuery}, ${country}` : country;
      }
      
      // Use query.locn for location
      if (locationQuery) {
        apiParams.append('query.locn', locationQuery);
      }
      
      // Add condition if specified
      if (condition) {
        apiParams.append('query.cond', condition);
      }
      
      // Add status filter
      if (status && status.length > 0) {
        apiParams.append('filter.overallStatus', status.join(','));
      }
      
      // Note: ClinicalTrials.gov API doesn't directly support radius
      // This would need post-processing with distance calculation
      
      const url = `${LocationSearchTool.API_BASE}/studies?${apiParams}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const trials = data.studies || [];
      const totalCount = data.totalCount || 0;
      
      // If we have coordinates and radius, we'd filter here
      // For now, return all trials from the location
      let filteredTrials = trials;
      
      if (params.coordinates && radius) {
        // This would require implementing distance calculation
        // For each trial, calculate distance from coordinates
        // Filter to those within radius
        debug.log(DebugCategory.SEARCH, 'Radius filtering requested but not implemented', {
          coordinates: params.coordinates,
          radius
        });
      }
      
      if (filteredTrials.length === 0) {
        return {
          success: true,
          trials: [],
          totalCount: 0,
          error: {
            type: 'no_results',
            message: `No trials found in ${locationQuery}`,
            suggestions: [
              'Try a nearby major city',
              'Expand search to state level',
              'Remove condition filter to see all trials',
              'Check if location name is spelled correctly'
            ]
          },
          metadata: {
            searchLocation: { city, state, country },
            radius,
            retrievedCount: 0,
            hasMore: false,
            latency: Date.now() - startTime
          }
        };
      }
      
      debug.log(DebugCategory.SEARCH, 'Location search results', {
        location: locationQuery,
        count: filteredTrials.length,
        total: totalCount
      });
      
      return {
        success: true,
        trials: filteredTrials,
        totalCount,
        metadata: {
          searchLocation: { city, state, country },
          radius,
          retrievedCount: filteredTrials.length,
          hasMore: filteredTrials.length < totalCount,
          latency: Date.now() - startTime
        }
      };
      
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'Location search failed', error);
      return {
        success: false,
        trials: [],
        totalCount: 0,
        error: {
          type: 'api_error',
          message: error instanceof Error ? error.message : 'Unknown error',
          suggestions: [
            'Check your internet connection',
            'Verify location spelling',
            'Try a different location format'
          ]
        },
        metadata: {
          searchLocation: { city, state, country },
          radius,
          retrievedCount: 0,
          hasMore: false,
          latency: Date.now() - startTime
        }
      };
    }
  }
  
  /**
   * Get trial sites for a specific trial with full details
   */
  async getTrialSites(nctId: string): Promise<{
    success: boolean;
    sites?: Array<{
      facility: string;
      city: string;
      state: string;
      country: string;
      zipCode?: string;
      status?: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
      contact?: {
        name: string;
        phone?: string;
        email?: string;
        role?: string;
      };
      investigator?: {
        name: string;
        affiliation?: string;
      };
    }>;
    totalSites?: number;
    recruitingSites?: number;
    error?: {
      type: string;
      message: string;
    };
  }> {
    debug.log(DebugCategory.SEARCH, 'Getting trial sites', { nctId });
    
    try {
      // Fetch full trial details with location information
      const url = `${LocationSearchTool.API_BASE}/studies?query.id=${nctId}&format=json&fields=ContactsLocationsModule`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.studies || data.studies.length === 0) {
        return {
          success: false,
          error: {
            type: 'not_found',
            message: `Trial ${nctId} not found`
          }
        };
      }
      
      const trial = data.studies[0];
      const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
      
      // Parse and structure site information
      const sites = locations.map((loc: any) => ({
        facility: loc.facility || 'Not specified',
        city: loc.city || '',
        state: loc.state || '',
        country: loc.country || 'United States',
        zipCode: loc.zip || undefined,
        status: loc.status || 'Unknown',
        coordinates: loc.geoPoint ? {
          latitude: loc.geoPoint.lat,
          longitude: loc.geoPoint.lon
        } : undefined,
        contact: loc.contacts?.[0] ? {
          name: loc.contacts[0].name || '',
          phone: loc.contacts[0].phone || undefined,
          email: loc.contacts[0].email || undefined,
          role: loc.contacts[0].role || undefined
        } : undefined,
        investigator: loc.contacts?.find((c: any) => c.role === 'principal_investigator') ? {
          name: loc.contacts.find((c: any) => c.role === 'principal_investigator').name || '',
          affiliation: loc.contacts.find((c: any) => c.role === 'principal_investigator').affiliation || undefined
        } : undefined
      }));
      
      const recruitingSiteCount = sites.filter(s => s.status === 'Recruiting').length;
      
      debug.log(DebugCategory.SEARCH, 'Trial sites retrieved', {
        nctId,
        totalSites: sites.length,
        recruitingSites: recruitingSiteCount
      });
      
      return {
        success: true,
        sites,
        totalSites: sites.length,
        recruitingSites: recruitingSiteCount
      };
      
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'Failed to get trial sites', error);
      return {
        success: false,
        error: {
          type: 'fetch_failed',
          message: error instanceof Error ? error.message : 'Could not retrieve trial site details'
        }
      };
    }
  }
}

// Export singleton instance
export const locationSearch = new LocationSearchTool();
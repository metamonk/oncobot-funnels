/**
 * Enhanced Location Search Atomic Tool
 * 
 * CONTEXT-AWARE: Following CLAUDE.md principles
 * - AI-driven location intelligence without hardcoded patterns
 * - Full transparency with individual site status
 * - Distance-based ranking using user coordinates
 * - Comprehensive site information retrieval
 */

import { ClinicalTrial } from '../types';
import { debug, DebugCategory } from '../debug';
import { geoIntelligence } from './geo-intelligence';

interface EnhancedLocationSearchParams {
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  userCoordinates?: {
    latitude: number;
    longitude: number;
  };
  radius?: number; // miles
  condition?: string;
  status?: string[];
  maxResults?: number;
  includeDistances?: boolean;
  includeSiteStatus?: boolean;
}

interface SiteInformation {
  facility: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  status?: string; // Site-specific recruitment status
  contact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  distance?: number; // Distance from user in miles
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface EnhancedLocationSearchResult {
  success: boolean;
  trials: Array<ClinicalTrial & {
    enhancedLocations?: SiteInformation[];
    nearestSite?: SiteInformation;
    locationSummary?: string;
  }>;
  totalCount: number;
  error?: {
    type: string;
    message: string;
    suggestions: string[];
  };
  metadata: {
    searchLocation: {
      city?: string;
      state?: string;
      country?: string;
    };
    userCoordinates?: {
      latitude: number;
      longitude: number;
    };
    radius?: number;
    retrievedCount: number;
    hasMore: boolean;
    latency: number;
  };
}

export class EnhancedLocationSearchTool {
  private static readonly API_BASE = 'https://clinicaltrials.gov/api/v2';
  
  /**
   * Calculate distance between two coordinates using Haversine formula
   * This is a pure mathematical calculation, not a hardcoded pattern
   */
  // Use geo-intelligence for distance calculations - TRUE AI-DRIVEN principle
  // No duplication, single source of truth
  private calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const result = geoIntelligence.calculateDistance(
      { latitude: lat1, longitude: lon1 },
      { latitude: lat2, longitude: lon2 }
    );
    return result.miles;
  }
  
  /**
   * Synchronous location data enhancement (no API calls)
   * Used for efficient processing of large result sets
   */
  private enhanceLocationDataSync(
    location: any, 
    userCoordinates?: { latitude: number; longitude: number }
  ): SiteInformation {
    const enhanced: SiteInformation = {
      facility: location.facility || 'Facility name not provided',
      city: location.city || 'City not specified',
      state: location.state || '',
      country: location.country || 'United States',
      zipCode: location.zip
    };
    
    // Add contact info if available
    if (location.contacts && location.contacts.length > 0) {
      const contact = location.contacts[0];
      enhanced.contact = {
        name: contact.name,
        phone: contact.phone,
        email: contact.email
      };
    }
    
    // Add site-specific status if available
    if (location.status) {
      enhanced.status = location.status;
    }
    
    // Calculate distance if we have coordinates
    if (userCoordinates && location.geoPoint) {
      enhanced.coordinates = {
        latitude: location.geoPoint.lat,
        longitude: location.geoPoint.lon
      };
      enhanced.distance = this.calculateDistance(
        userCoordinates.latitude,
        userCoordinates.longitude,
        location.geoPoint.lat,
        location.geoPoint.lon
      );
    }
    
    return enhanced;
  }
  
  /**
   * Fetch complete trial details including all site information
   * This ensures we have all locations, not just a subset
   */
  private async fetchCompleteTrialDetails(nctId: string): Promise<any> {
    try {
      const url = `${EnhancedLocationSearchTool.API_BASE}/studies/${nctId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        debug.error(DebugCategory.ERROR, 'Failed to fetch trial details', { nctId, status: response.status });
        return null;
      }
      
      const data = await response.json();
      return data.studies?.[0] || null;
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'Error fetching trial details', error);
      return null;
    }
  }
  
  /**
   * Enhanced location search with intelligent batching
   * OPTIMIZATION: Only fetch detailed info for top results to prevent API timeout
   */
  async search(params: EnhancedLocationSearchParams): Promise<EnhancedLocationSearchResult> {
    const startTime = Date.now();
    const { 
      city, 
      state, 
      country = 'United States',
      zipCode,
      userCoordinates,
      radius,
      condition,
      status = ['RECRUITING'],
      maxResults = 50,
      includeDistances = true,
      includeSiteStatus = true
    } = params;
    
    // Smart batching: Only fetch detailed info for top results
    const detailBatchSize = Math.min(maxResults, 10); // Max 10 detailed lookups
    
    // Validate location parameters
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
            'Use your current location'
          ]
        },
        metadata: {
          searchLocation: {},
          userCoordinates,
          retrievedCount: 0,
          hasMore: false,
          latency: Date.now() - startTime
        }
      };
    }
    
    debug.log(DebugCategory.SEARCH, 'Enhanced location search', { 
      city, 
      state, 
      country,
      zipCode,
      userCoordinates,
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
      
      // Build location query - be specific when we have city
      let locationQuery = '';
      if (city && state) {
        locationQuery = `${city}, ${state}`;
      } else if (city) {
        locationQuery = city;
      } else if (state) {
        locationQuery = state;
      } else if (zipCode) {
        locationQuery = zipCode;
      }
      
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
      
      const url = `${EnhancedLocationSearchTool.API_BASE}/studies?${apiParams}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const trials = data.studies || [];
      const totalCount = data.totalCount || 0;
      
      // SMART BATCHING: Process trials in two phases
      // Phase 1: Basic enhancement for all trials (no API calls)
      let enhancedTrials = trials.map((trial: ClinicalTrial) => {
        const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
        const enhancedLocations = locations.map((loc: any) => {
          return {
            facility: loc.facility || 'Facility name not provided',
            city: loc.city || 'City not specified',
            state: loc.state || '',
            country: loc.country || 'United States',
            zipCode: loc.zip,
            status: loc.status,
            // Calculate distance if we have coordinates and location has geoPoint
            distance: (userCoordinates && loc.geoPoint) ? 
              this.calculateDistance(
                userCoordinates.latitude,
                userCoordinates.longitude,
                loc.geoPoint.lat,
                loc.geoPoint.lon
              ) : undefined,
            coordinates: loc.geoPoint ? {
              latitude: loc.geoPoint.lat,
              longitude: loc.geoPoint.lon
            } : undefined
          } as SiteInformation;
        });
        
        // Sort by distance if we have coordinates
        if (userCoordinates && includeDistances) {
          enhancedLocations.sort((a, b) => (a.distance || 999999) - (b.distance || 999999));
        }
        
        const nearestSite = enhancedLocations.find(loc => loc.distance !== undefined);
        const locationSummary = this.buildLocationSummary(enhancedLocations, nearestSite);
        
        return {
          ...trial,
          enhancedLocations,
          nearestSite,
          locationSummary
        };
      });
      
      // Phase 2: Detailed enhancement for top results only (with API calls)
      if (includeSiteStatus && enhancedTrials.length > 0) {
        // Sort by distance first to prioritize nearest trials
        if (userCoordinates) {
          enhancedTrials.sort((a: any, b: any) => {
            const distA = a.nearestSite?.distance || 999999;
            const distB = b.nearestSite?.distance || 999999;
            return distA - distB;
          });
        }
        
        // Only fetch detailed info for top trials to prevent timeout
        const topTrialsForDetails = enhancedTrials.slice(0, detailBatchSize);
        const remainingTrials = enhancedTrials.slice(detailBatchSize);
        
        debug.log(DebugCategory.SEARCH, 'Smart batching enabled', {
          total: enhancedTrials.length,
          detailedFetch: topTrialsForDetails.length,
          basicOnly: remainingTrials.length
        });
        
        // Fetch detailed info with timeout protection
        const detailedTrials = await Promise.allSettled(
          topTrialsForDetails.map(async (trial: any) => {
            const nctId = trial.trial?.protocolSection?.identificationModule?.nctId || 
                         trial.protocolSection?.identificationModule?.nctId;
            
            if (!nctId) return trial;
            
            try {
              // Add timeout to prevent hanging
              const fullDetails = await Promise.race([
                this.fetchCompleteTrialDetails(nctId),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Timeout')), 8000)
                )
              ]);
              
              if (fullDetails) {
                // Re-process with complete data
                const locations = fullDetails.protocolSection?.contactsLocationsModule?.locations || [];
                const enhancedLocations = locations.map((loc: any) => 
                  this.enhanceLocationDataSync(loc, userCoordinates)
                );
                
                if (userCoordinates && includeDistances) {
                  enhancedLocations.sort((a: any, b: any) => (a.distance || 999999) - (b.distance || 999999));
                }
                
                const nearestSite = enhancedLocations.find((loc: any) => loc.distance !== undefined);
                const locationSummary = this.buildLocationSummary(enhancedLocations, nearestSite);
                
                return {
                  ...fullDetails,
                  enhancedLocations,
                  nearestSite,
                  locationSummary
                };
              }
            } catch (error) {
              debug.log(DebugCategory.ERROR, 'Failed to fetch detailed info, using basic data', { nctId });
            }
            
            return trial; // Fallback to basic enhancement
          })
        );
        
        // Combine detailed and basic results
        const processedDetailedTrials = detailedTrials.map(result => 
          result.status === 'fulfilled' ? result.value : topTrialsForDetails[detailedTrials.indexOf(result)]
        );
        
        enhancedTrials = [...processedDetailedTrials, ...remainingTrials];
      }
      
      // Final sort by distance (already done in Phase 2, but ensure consistency)
      if (userCoordinates) {
        enhancedTrials.sort((a: any, b: any) => {
          const distA = a.nearestSite?.distance || 999999;
          const distB = b.nearestSite?.distance || 999999;
          return distA - distB;
        });
      }
      
      debug.log(DebugCategory.SEARCH, 'Enhanced location search results', {
        location: locationQuery,
        count: enhancedTrials.length,
        total: totalCount,
        hasDistances: enhancedTrials.some((t: any) => t.nearestSite?.distance !== undefined),
        detailedEnhanced: enhancedTrials.filter((t: any) => t.enhancedLocations && t.enhancedLocations.length > 0).length,
        smartBatchingUsed: includeSiteStatus && enhancedTrials.length > detailBatchSize
      });
      
      return {
        success: true,
        trials: enhancedTrials,
        totalCount,
        metadata: {
          searchLocation: { city, state, country },
          userCoordinates,
          radius,
          retrievedCount: enhancedTrials.length,
          hasMore: enhancedTrials.length < totalCount,
          latency: Date.now() - startTime
        }
      };
      
    } catch (error) {
      debug.error(DebugCategory.ERROR, 'Enhanced location search failed', error);
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
          userCoordinates,
          retrievedCount: 0,
          hasMore: false,
          latency: Date.now() - startTime
        }
      };
    }
  }
  
  /**
   * Build an intelligent location summary
   * No hardcoded patterns - just presenting available information clearly
   */
  private buildLocationSummary(
    locations: SiteInformation[], 
    nearestSite?: SiteInformation
  ): string {
    if (locations.length === 0) {
      return 'No location information available';
    }
    
    // Count recruiting sites (case-insensitive to handle API variations)
    const recruitingSites = locations.filter(loc => 
      loc.status?.toUpperCase() === 'RECRUITING'
    ).length;
    
    // Build summary parts
    const parts: string[] = [];
    
    // Total sites
    parts.push(`${locations.length} site${locations.length !== 1 ? 's' : ''}`);
    
    // Recruiting count if any
    if (recruitingSites > 0) {
      parts.push(`${recruitingSites} recruiting`);
    }
    
    // Nearest site if available
    if (nearestSite?.distance !== undefined) {
      const distance = Math.round(nearestSite.distance);
      parts.push(`nearest ${distance} miles`);
    }
    
    // Get unique states
    const states = new Set(locations.map(l => l.state).filter(Boolean));
    if (states.size > 0) {
      parts.push(`in ${states.size} state${states.size !== 1 ? 's' : ''}`);
    }
    
    return parts.join(', ');
  }
}

// Export singleton instance
export const enhancedLocationSearch = new EnhancedLocationSearchTool();
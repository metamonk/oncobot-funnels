/**
 * Location Service - Centralized location intelligence for clinical trials
 * Provides geocoding, distance calculation, and proximity matching
 */

import { LocationMatcher } from './location-matcher';
import type { ClinicalTrial, StudyLocation } from './types';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationContext {
  userLocation?: {
    coordinates?: Coordinates;
    city?: string;
    state?: string;
    country?: string;
    metroArea?: string;
  };
  searchRadius?: number; // in miles
  preferredLocations?: string[];
}

export interface LocationResult {
  location: StudyLocation;
  distance?: number; // in miles
  isMetroArea?: boolean;
  matchType?: 'exact' | 'metro' | 'state' | 'country';
}

export interface TrialWithDistance extends ClinicalTrial {
  distance?: number; // minimum distance to user
  closestLocation?: LocationResult;
  locationMatches?: LocationResult[];
}

export class LocationService {
  private static instance: LocationService;
  
  private constructor() {}
  
  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }
  
  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLon = this.toRad(coord2.lng - coord1.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
  
  /**
   * Geocode a location string to coordinates
   * Returns mock coordinates for major cities (can be replaced with real API)
   */
  async geocodeLocation(location: string): Promise<Coordinates | null> {
    // Major US cities with cancer centers
    const cityCoordinates: Record<string, Coordinates> = {
      'chicago': { lat: 41.8781, lng: -87.6298 },
      'new york': { lat: 40.7128, lng: -74.0060 },
      'los angeles': { lat: 34.0522, lng: -118.2437 },
      'houston': { lat: 29.7604, lng: -95.3698 },
      'boston': { lat: 42.3601, lng: -71.0589 },
      'philadelphia': { lat: 39.9526, lng: -75.1652 },
      'san francisco': { lat: 37.7749, lng: -122.4194 },
      'seattle': { lat: 47.6062, lng: -122.3321 },
      'atlanta': { lat: 33.7490, lng: -84.3880 },
      'miami': { lat: 25.7617, lng: -80.1918 },
      'denver': { lat: 39.7392, lng: -104.9903 },
      'phoenix': { lat: 33.4484, lng: -112.0740 },
      'detroit': { lat: 42.3314, lng: -83.0458 },
      'minneapolis': { lat: 44.9778, lng: -93.2650 },
      'san diego': { lat: 32.7157, lng: -117.1611 },
      'dallas': { lat: 32.7767, lng: -96.7970 },
      'baltimore': { lat: 39.2904, lng: -76.6122 },
      'washington': { lat: 38.9072, lng: -77.0369 },
      'portland': { lat: 45.5152, lng: -122.6784 },
      'cleveland': { lat: 41.4993, lng: -81.6944 },
    };
    
    const normalized = location.toLowerCase().trim();
    
    // Check direct city match
    for (const [city, coords] of Object.entries(cityCoordinates)) {
      if (normalized.includes(city)) {
        return coords;
      }
    }
    
    // Check state abbreviations
    const stateCoordinates: Record<string, Coordinates> = {
      'il': cityCoordinates.chicago,
      'ny': cityCoordinates['new york'],
      'ca': cityCoordinates['los angeles'],
      'tx': cityCoordinates.houston,
      'ma': cityCoordinates.boston,
    };
    
    for (const [state, coords] of Object.entries(stateCoordinates)) {
      if (normalized === state || normalized.endsWith(`, ${state}`)) {
        return coords;
      }
    }
    
    return null;
  }
  
  /**
   * Reverse geocode coordinates to location information
   */
  async reverseGeocode(coordinates: Coordinates): Promise<{city: string; state: string} | null> {
    // Simple implementation - in production, use real geocoding API
    const cities = [
      { name: 'Chicago', state: 'IL', coords: { lat: 41.8781, lng: -87.6298 }, radius: 50 },
      { name: 'New York', state: 'NY', coords: { lat: 40.7128, lng: -74.0060 }, radius: 50 },
      { name: 'Los Angeles', state: 'CA', coords: { lat: 34.0522, lng: -118.2437 }, radius: 50 },
      { name: 'Houston', state: 'TX', coords: { lat: 29.7604, lng: -95.3698 }, radius: 50 },
      { name: 'Boston', state: 'MA', coords: { lat: 42.3601, lng: -71.0589 }, radius: 30 },
    ];
    
    // Find closest city
    for (const city of cities) {
      const distance = this.calculateDistance(coordinates, city.coords);
      if (distance <= city.radius) {
        return { city: city.name, state: city.state };
      }
    }
    
    return null;
  }
  
  /**
   * Extract location from query string
   */
  extractLocationFromQuery(query: string): string | null {
    // Location patterns
    const patterns = [
      /(?:near|in|at|around|close to|proximity to)\s+([A-Za-z\s,]+?)(?:\.|,|\?|$)/i,
      /trials?\s+(?:near|in|at|around)\s+([A-Za-z\s,]+?)(?:\.|,|\?|$)/i,
      /([A-Za-z\s]+?,\s*[A-Z]{2})\b/, // City, STATE format
    ];
    
    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }
  
  /**
   * Rank trials by proximity to user location
   */
  async rankTrialsByProximity(
    trials: ClinicalTrial[],
    context: LocationContext
  ): Promise<TrialWithDistance[]> {
    if (!context.userLocation?.coordinates) {
      // No user location, return trials as-is
      return trials;
    }
    
    const userCoords = context.userLocation.coordinates;
    const radius = context.searchRadius;
    
    const trialsWithDistance: TrialWithDistance[] = await Promise.all(
      trials.map(async (trial) => {
        const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
        const locationResults: LocationResult[] = [];
        
        for (const location of locations) {
          if (!location.city) continue;
          
          // Try to geocode the location
          const locationString = `${location.city}, ${location.state || location.country}`;
          const coords = await this.geocodeLocation(locationString);
          
          if (coords) {
            const distance = this.calculateDistance(userCoords, coords);
            
            // Check if within radius (if specified)
            if (!radius || distance <= radius) {
              locationResults.push({
                location,
                distance,
                matchType: this.getMatchType(location, context),
                isMetroArea: LocationMatcher.isMetroArea(location.city || '', context.userLocation.city || '')
              });
            }
          }
        }
        
        // Sort location results by distance
        locationResults.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        
        return {
          ...trial,
          distance: locationResults[0]?.distance,
          closestLocation: locationResults[0],
          locationMatches: locationResults
        };
      })
    );
    
    // Sort trials by closest distance
    trialsWithDistance.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    
    // If radius is specified, filter out trials beyond radius
    if (radius) {
      return trialsWithDistance.filter(trial => 
        trial.distance !== undefined && trial.distance <= radius
      );
    }
    
    return trialsWithDistance;
  }
  
  /**
   * Filter trials by location with metro area support
   */
  filterTrialsByLocation(
    trials: ClinicalTrial[],
    location: string,
    includeMetroAreas: boolean = true
  ): ClinicalTrial[] {
    const expandedTerms = includeMetroAreas 
      ? LocationMatcher.generateLocationTerms(location)
      : [location.toLowerCase()];
    
    return trials.filter(trial => {
      const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
      
      return locations.some(loc => {
        const city = loc.city?.toLowerCase() || '';
        const state = loc.state?.toLowerCase() || '';
        const country = loc.country?.toLowerCase() || '';
        
        return expandedTerms.some(term => 
          city.includes(term) || 
          state.includes(term) || 
          country.includes(term)
        );
      });
    });
  }
  
  /**
   * Get location summary for a trial
   */
  getLocationSummary(trial: ClinicalTrial): string {
    const summaryArray = LocationMatcher.getLocationSummary(trial);
    
    if (summaryArray.length === 0) {
      return 'No locations specified';
    }
    
    if (summaryArray.length === 1) {
      return summaryArray[0];
    }
    
    return `${summaryArray[0]} + ${summaryArray.length - 1} more location${summaryArray.length - 1 > 1 ? 's' : ''}`;
  }
  
  /**
   * Determine match type for a location
   */
  private getMatchType(
    location: StudyLocation,
    context: LocationContext
  ): 'exact' | 'metro' | 'state' | 'country' {
    if (!context.userLocation) return 'country';
    
    const userCity = context.userLocation.city?.toLowerCase();
    const userState = context.userLocation.state?.toLowerCase();
    const userCountry = context.userLocation.country?.toLowerCase() || 'united states';
    
    const locCity = location.city?.toLowerCase();
    const locState = location.state?.toLowerCase();
    const locCountry = location.country?.toLowerCase() || 'united states';
    
    if (userCity && locCity && locCity.includes(userCity)) {
      return 'exact';
    }
    
    if (userCity && locCity && LocationMatcher.isMetroArea(location.city || '', context.userLocation.city || '')) {
      return 'metro';
    }
    
    if (userState && locState && locState.includes(userState)) {
      return 'state';
    }
    
    if (userCountry && locCountry && locCountry.includes(userCountry)) {
      return 'country';
    }
    
    return 'country';
  }
  
  /**
   * Build location context from various sources
   */
  async buildLocationContext(
    query: string,
    userCoordinates?: { latitude?: number; longitude?: number },
    healthProfile?: any
  ): Promise<LocationContext> {
    const context: LocationContext = {};
    
    // 1. Try to use provided coordinates
    if (userCoordinates?.latitude && userCoordinates?.longitude) {
      const coords: Coordinates = {
        lat: userCoordinates.latitude,
        lng: userCoordinates.longitude
      };
      
      context.userLocation = { coordinates: coords };
      
      // Try to reverse geocode to get city/state
      const location = await this.reverseGeocode(coords);
      if (location) {
        context.userLocation.city = location.city;
        context.userLocation.state = location.state;
        context.userLocation.metroArea = LocationMatcher.getMetroArea(location.city);
      }
    }
    
    // 2. Extract location from query
    const queryLocation = this.extractLocationFromQuery(query);
    if (queryLocation) {
      // If we don't have user location yet, create it
      if (!context.userLocation) {
        context.userLocation = {};
      }
      
      // Try to geocode the query location
      const coords = await this.geocodeLocation(queryLocation);
      if (coords) {
        // Override with query location if more specific
        context.userLocation.coordinates = coords;
        
        // Parse city/state from query location
        const parts = queryLocation.split(',').map(p => p.trim());
        if (parts.length === 2) {
          context.userLocation.city = parts[0];
          context.userLocation.state = parts[1];
        } else {
          context.userLocation.city = queryLocation;
        }
        
        context.userLocation.metroArea = LocationMatcher.getMetroArea(context.userLocation.city);
      }
    }
    
    // 3. Extract radius from query
    const radiusMatch = query.match(/within\s+(\d+)\s+miles?/i);
    if (radiusMatch) {
      context.searchRadius = parseInt(radiusMatch[1]);
    }
    
    // 4. TODO: Add health profile location preferences when available
    
    return context;
  }
}

// Export singleton instance
export const locationService = LocationService.getInstance();
/**
 * Location Service - Centralized location intelligence for clinical trials
 * Provides geocoding, distance calculation, and proximity matching
 */

// LocationMatcher functionality is now integrated into this service
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
    // Check for "near me" patterns first - special case
    if (/\bnear\s+me\b/i.test(query) || /\bmy\s+(location|area)\b/i.test(query)) {
      return 'NEAR_ME'; // Special marker for current location
    }
    
    // Location patterns - FIXED: Now properly captures locations without trailing punctuation
    const patterns = [
      /(?:near|in|at|around|close to|proximity to)\s+([A-Za-z][A-Za-z\s,]*?)(?:\s+for\s+|\s+trials?\s*|\.|,|\?|$)/i,
      /trials?\s+(?:near|in|at|around)\s+([A-Za-z][A-Za-z\s,]*?)(?:\s+for\s+|\.|,|\?|$)/i,
      /([A-Za-z][A-Za-z\s]+?,\s*[A-Z]{2})\b/, // City, STATE format
    ];
    
    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        // Clean up the captured location
        let location = match[1].trim();
        // Remove trailing common words that might get captured
        location = location.replace(/\s+(trials?|for|with|and)$/i, '').trim();
        if (location && location.toLowerCase() !== 'me') {
          return location;
        }
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
                isMetroArea: this.isMetroArea(location.city || '', context.userLocation?.city || '')
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
    // Get expanded location terms including metro areas if enabled
    const locationLower = location.toLowerCase();
    const expandedTerms: string[] = includeMetroAreas 
      ? [...this.getLocationVariations(location)]
      : [locationLower];
    
    return trials.filter(trial => {
      const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
      
      return locations.some(loc => {
        const city = loc.city?.toLowerCase() || '';
        const state = loc.state?.toLowerCase() || '';
        const country = loc.country?.toLowerCase() || '';
        
        return expandedTerms.some((term: string) => 
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
    const summaryArray = this.getLocationSummaryArray(trial);
    
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
    
    if (userCity && locCity && this.isMetroArea(location.city || '', context.userLocation.city || '')) {
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
   * Check if two cities are in the same metro area
   */
  isMetroArea(city1: string, city2: string): boolean {
    const metroAreas: Record<string, string[]> = {
      'New York': ['New York', 'Manhattan', 'Newark', 'Jersey City', 'Yonkers', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'],
      'Los Angeles': ['Los Angeles', 'Long Beach', 'Anaheim', 'Santa Ana', 'Irvine', 'Glendale', 'Pasadena'],
      'Chicago': ['Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville', 'Evanston', 'Elgin'],
      'Houston': ['Houston', 'The Woodlands', 'Sugar Land', 'Pasadena', 'Pearland'],
      'Philadelphia': ['Philadelphia', 'Camden', 'Wilmington', 'Cherry Hill'],
      'Phoenix': ['Phoenix', 'Mesa', 'Scottsdale', 'Glendale', 'Tempe', 'Chandler'],
      'San Francisco': ['San Francisco', 'Oakland', 'San Jose', 'Berkeley', 'Palo Alto', 'Mountain View'],
      'Boston': ['Boston', 'Cambridge', 'Quincy', 'Newton', 'Somerville'],
      'Seattle': ['Seattle', 'Tacoma', 'Bellevue', 'Everett', 'Kent', 'Renton'],
      'Miami': ['Miami', 'Fort Lauderdale', 'West Palm Beach', 'Pompano Beach', 'Miami Beach'],
      'Atlanta': ['Atlanta', 'Sandy Springs', 'Roswell', 'Alpharetta', 'Marietta'],
      'Dallas': ['Dallas', 'Fort Worth', 'Arlington', 'Plano', 'Irving', 'Garland']
    };
    
    const c1Lower = city1.toLowerCase();
    const c2Lower = city2.toLowerCase();
    
    for (const [metro, cities] of Object.entries(metroAreas)) {
      const citiesLower = cities.map(c => c.toLowerCase());
      if (citiesLower.includes(c1Lower) && citiesLower.includes(c2Lower)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get location variations including metro areas and state names
   */
  getLocationVariations(location: string): string[] {
    const variations = new Set<string>();
    const locationLower = location.toLowerCase();
    variations.add(locationLower);
    
    // Metro area expansions
    const metroExpansions: Record<string, string[]> = {
      'new york': ['nyc', 'manhattan', 'brooklyn', 'queens', 'bronx', 'staten island'],
      'los angeles': ['la', 'hollywood', 'beverly hills', 'santa monica'],
      'san francisco': ['sf', 'bay area', 'silicon valley', 'oakland', 'san jose'],
      'washington': ['dc', 'washington dc', 'district of columbia'],
      'boston': ['cambridge', 'somerville', 'brookline'],
      'chicago': ['chicagoland', 'windy city'],
      'philadelphia': ['philly', 'phila'],
      'miami': ['south florida', 'miami-dade'],
      'dallas': ['dfw', 'dallas-fort worth'],
      'seattle': ['puget sound', 'greater seattle']
    };
    
    for (const [city, expansions] of Object.entries(metroExpansions)) {
      if (locationLower.includes(city)) {
        expansions.forEach(exp => variations.add(exp));
      }
      // Also check reverse - if location is an expansion, add the main city
      if (expansions.some(exp => locationLower.includes(exp))) {
        variations.add(city);
      }
    }
    
    // State expansions
    const stateExpansions: Record<string, string[]> = {
      'california': ['ca', 'calif'],
      'new york': ['ny'],
      'texas': ['tx'],
      'florida': ['fl'],
      'illinois': ['il'],
      'pennsylvania': ['pa', 'penn'],
      'massachusetts': ['ma', 'mass'],
      'georgia': ['ga'],
      'north carolina': ['nc'],
      'virginia': ['va']
    };
    
    for (const [state, abbrevs] of Object.entries(stateExpansions)) {
      if (locationLower.includes(state)) {
        abbrevs.forEach(abbr => variations.add(abbr));
      }
      if (abbrevs.some(abbr => locationLower === abbr || locationLower.endsWith(`, ${abbr}`))) {
        variations.add(state);
      }
    }
    
    return Array.from(variations);
  }
  
  /**
   * Get location summary for a trial (returns array of locations)
   */
  getLocationSummaryArray(trial: ClinicalTrial): string[] {
    const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
    
    if (locations.length === 0) {
      return [];
    }
    
    // Group locations by state/country for summarization
    const locationGroups = new Map<string, Set<string>>();
    
    for (const loc of locations) {
      if (!loc.city) continue;
      
      const key = loc.country === 'United States' || !loc.country
        ? (loc.state || 'US')
        : (loc.country || 'Unknown');
      
      if (!locationGroups.has(key)) {
        locationGroups.set(key, new Set());
      }
      locationGroups.get(key)!.add(loc.city);
    }
    
    // Create summary array
    const summary: string[] = [];
    
    for (const [region, cities] of locationGroups.entries()) {
      if (cities.size === 1) {
        const city = cities.values().next().value;
        summary.push(`${city}, ${region}`);
      } else {
        summary.push(`${cities.size} locations in ${region}`);
      }
    }
    
    return summary.slice(0, 5); // Limit to 5 for brevity
  }
  
  /**
   * Get metro area for a city
   */
  getMetroArea(city: string): string {
    const metroAreas: Record<string, string> = {
      'new york': 'New York Metro',
      'brooklyn': 'New York Metro',
      'queens': 'New York Metro',
      'bronx': 'New York Metro',
      'staten island': 'New York Metro',
      'newark': 'New York Metro',
      'jersey city': 'New York Metro',
      'los angeles': 'Los Angeles Metro',
      'long beach': 'Los Angeles Metro',
      'anaheim': 'Los Angeles Metro',
      'santa ana': 'Los Angeles Metro',
      'chicago': 'Chicago Metro',
      'aurora': 'Chicago Metro',
      'naperville': 'Chicago Metro',
      'houston': 'Houston Metro',
      'the woodlands': 'Houston Metro',
      'sugar land': 'Houston Metro',
      'philadelphia': 'Philadelphia Metro',
      'camden': 'Philadelphia Metro',
      'san francisco': 'Bay Area',
      'oakland': 'Bay Area',
      'san jose': 'Bay Area',
      'berkeley': 'Bay Area',
      'palo alto': 'Bay Area',
      'boston': 'Boston Metro',
      'cambridge': 'Boston Metro',
      'quincy': 'Boston Metro',
      'seattle': 'Seattle Metro',
      'tacoma': 'Seattle Metro',
      'bellevue': 'Seattle Metro',
      'miami': 'Miami Metro',
      'fort lauderdale': 'Miami Metro',
      'west palm beach': 'Miami Metro',
      'atlanta': 'Atlanta Metro',
      'sandy springs': 'Atlanta Metro',
      'dallas': 'Dallas-Fort Worth',
      'fort worth': 'Dallas-Fort Worth',
      'arlington': 'Dallas-Fort Worth',
      'plano': 'Dallas-Fort Worth'
    };
    
    const cityLower = city.toLowerCase();
    return metroAreas[cityLower] || city;
  }
  
  /**
   * Check if a trial matches a location (including metro areas)
   */
  matchesLocation(trial: ClinicalTrial, location: string): boolean {
    const locations = trial.protocolSection?.contactsLocationsModule?.locations || [];
    
    if (locations.length === 0) {
      return false;
    }
    
    const locationLower = location.toLowerCase();
    const locationVariations = this.getLocationVariations(location);
    
    return locations.some(loc => {
      const city = loc.city?.toLowerCase() || '';
      const state = loc.state?.toLowerCase() || '';
      const country = loc.country?.toLowerCase() || '';
      const facility = loc.facility?.toLowerCase() || '';
      
      // Check direct matches
      if (locationVariations.some(variation => 
        city.includes(variation) ||
        state.includes(variation) ||
        country.includes(variation) ||
        facility.includes(variation)
      )) {
        return true;
      }
      
      // Check metro area matches
      if (loc.city && this.isMetroArea(loc.city, location)) {
        return true;
      }
      
      return false;
    });
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
        context.userLocation.metroArea = this.getMetroArea(location.city);
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
        
        context.userLocation.metroArea = this.getMetroArea(context.userLocation.city);
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
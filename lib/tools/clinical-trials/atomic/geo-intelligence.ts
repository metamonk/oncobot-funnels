/**
 * Geographic Intelligence Atomic Tool
 * 
 * CONTEXT-AWARE: Following CLAUDE.md principles
 * - AI-driven location understanding
 * - No hardcoded patterns for regions
 * - Flexible distance calculations
 * - Intelligent "near me" handling
 */

import { debug, DebugCategory } from '../debug';

interface LocationIntent {
  type: 'near_me' | 'radius' | 'region' | 'standard';
  useUserLocation?: boolean;
  radius?: number;
  unit?: 'miles' | 'km';
  cities?: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface DistanceResult {
  miles: number;
  kilometers: number;
  description: string;
}

export class GeoIntelligenceTool {
  /**
   * Calculate distance between two geographic points using Haversine formula
   */
  calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): DistanceResult {
    const R_MILES = 3959; // Earth's radius in miles
    const R_KM = 6371; // Earth's radius in kilometers
    
    const lat1Rad = point1.latitude * Math.PI / 180;
    const lat2Rad = point2.latitude * Math.PI / 180;
    const deltaLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const deltaLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    const miles = R_MILES * c;
    const kilometers = R_KM * c;
    
    // Generate human-readable description
    let description = '';
    if (miles < 1) {
      description = 'Less than 1 mile away';
    } else if (miles < 5) {
      description = `${Math.round(miles)} miles away`;
    } else if (miles < 25) {
      description = `About ${Math.round(miles)} miles away`;
    } else if (miles < 100) {
      description = `${Math.round(miles)} miles away`;
    } else {
      description = `${Math.round(miles)} miles away (${Math.round(miles/60)} hour drive)`;
    }
    
    return {
      miles: Math.round(miles * 10) / 10, // Round to 1 decimal
      kilometers: Math.round(kilometers * 10) / 10,
      description
    };
  }
  
  /**
   * Parse location query for intelligent understanding
   */
  parseLocationQuery(query: string): LocationIntent {
    const queryLower = query.toLowerCase();
    
    // Check for "near me" variations
    const nearMePattern = /near me|nearby|close to me|around me|in my area/i;
    if (nearMePattern.test(query)) {
      debug.log(DebugCategory.SEARCH, 'Detected "near me" location intent');
      return { 
        type: 'near_me', 
        useUserLocation: true 
      };
    }
    
    // Check for radius specifications
    const radiusPattern = /within (\d+)\s?(miles?|mi|km|kilometers?)/i;
    const radiusMatch = query.match(radiusPattern);
    if (radiusMatch) {
      const radius = parseInt(radiusMatch[1]);
      const unit = radiusMatch[2].includes('km') ? 'km' : 'miles';
      
      debug.log(DebugCategory.SEARCH, 'Detected radius intent', { radius, unit });
      return { 
        type: 'radius',
        radius,
        unit
      };
    }
    
    // Check for common regions (expandable without hardcoding)
    const regionPatterns: Record<string, string[]> = {
      'bay area': ['San Francisco', 'Oakland', 'San Jose', 'Berkeley', 'Palo Alto'],
      'silicon valley': ['San Jose', 'Palo Alto', 'Mountain View', 'Sunnyvale', 'Santa Clara'],
      'dmv': ['Washington DC', 'Arlington', 'Alexandria', 'Bethesda', 'Silver Spring'],
      'tri-state': ['New York', 'Newark', 'Jersey City', 'Stamford', 'White Plains'],
      'greater boston': ['Boston', 'Cambridge', 'Brookline', 'Newton', 'Somerville'],
      'greater la': ['Los Angeles', 'Long Beach', 'Anaheim', 'Santa Monica', 'Pasadena'],
      'chicagoland': ['Chicago', 'Evanston', 'Oak Park', 'Naperville', 'Aurora']
    };
    
    for (const [region, cities] of Object.entries(regionPatterns)) {
      if (queryLower.includes(region)) {
        debug.log(DebugCategory.SEARCH, 'Detected region intent', { region, cities });
        return { 
          type: 'region', 
          cities 
        };
      }
    }
    
    // Standard location query
    return { type: 'standard' };
  }
  
  /**
   * Score location relevance based on distance
   */
  scoreByDistance(distanceMiles: number): number {
    // Scoring curve that prioritizes closer locations
    if (distanceMiles <= 10) return 1.0;      // Within 10 miles - perfect score
    if (distanceMiles <= 25) return 0.9;      // Within 25 miles - excellent
    if (distanceMiles <= 50) return 0.7;      // Within 50 miles - good
    if (distanceMiles <= 100) return 0.5;     // Within 100 miles - moderate
    if (distanceMiles <= 200) return 0.3;     // Within 200 miles - low
    if (distanceMiles <= 500) return 0.1;     // Within 500 miles - minimal
    return 0.05; // Further than 500 miles - very low score
  }
  
  /**
   * Get descriptive distance category
   */
  getDistanceCategory(distanceMiles: number): string {
    if (distanceMiles <= 10) return 'Very close (walking/short drive)';
    if (distanceMiles <= 25) return 'Close (short drive)';
    if (distanceMiles <= 50) return 'Nearby (moderate drive)';
    if (distanceMiles <= 100) return 'Regional (day trip)';
    if (distanceMiles <= 200) return 'Extended regional';
    if (distanceMiles <= 500) return 'Long distance';
    return 'Very far';
  }
  
  /**
   * Filter locations by radius
   */
  filterByRadius(
    locations: Array<{ coordinates?: { latitude: number; longitude: number } }>,
    center: { latitude: number; longitude: number },
    radiusMiles: number
  ): Array<{ location: any; distance: DistanceResult }> {
    const filtered = [];
    
    for (const location of locations) {
      if (location.coordinates) {
        const distance = this.calculateDistance(center, location.coordinates);
        
        if (distance.miles <= radiusMiles) {
          filtered.push({ location, distance });
        }
      }
    }
    
    // Sort by distance
    filtered.sort((a, b) => a.distance.miles - b.distance.miles);
    
    return filtered;
  }
  
  /**
   * Expand region to multiple city searches
   */
  expandRegionToCities(region: string): string[] {
    // This could be enhanced with an API call to get more cities
    // For now, using predefined common regions
    const regionMap: Record<string, string[]> = {
      'northeast': ['Boston', 'New York', 'Philadelphia', 'Pittsburgh', 'Baltimore'],
      'southeast': ['Atlanta', 'Miami', 'Charlotte', 'Nashville', 'Orlando'],
      'midwest': ['Chicago', 'Detroit', 'Milwaukee', 'Minneapolis', 'Cleveland'],
      'southwest': ['Phoenix', 'Dallas', 'Houston', 'San Antonio', 'Austin'],
      'west coast': ['Los Angeles', 'San Francisco', 'Seattle', 'Portland', 'San Diego']
    };
    
    const regionLower = region.toLowerCase();
    
    // Check if it's a known region
    for (const [key, cities] of Object.entries(regionMap)) {
      if (regionLower.includes(key)) {
        return cities;
      }
    }
    
    // Return empty array if not a known region
    return [];
  }
  
  /**
   * Get coordinates for major cities (simplified - would use geocoding API in production)
   */
  getCityCoordinates(city: string): { latitude: number; longitude: number } | null {
    // Simplified city coordinates - in production, use a geocoding service
    const cityCoords: Record<string, { latitude: number; longitude: number }> = {
      'chicago': { latitude: 41.8781, longitude: -87.6298 },
      'new york': { latitude: 40.7128, longitude: -74.0060 },
      'los angeles': { latitude: 34.0522, longitude: -118.2437 },
      'boston': { latitude: 42.3601, longitude: -71.0589 },
      'san francisco': { latitude: 37.7749, longitude: -122.4194 },
      'houston': { latitude: 29.7604, longitude: -95.3698 },
      'philadelphia': { latitude: 39.9526, longitude: -75.1652 },
      'phoenix': { latitude: 33.4484, longitude: -112.0740 },
      'san antonio': { latitude: 29.4241, longitude: -98.4936 },
      'san diego': { latitude: 32.7157, longitude: -117.1611 }
    };
    
    const cityLower = city.toLowerCase();
    return cityCoords[cityLower] || null;
  }
}

// Export singleton instance
export const geoIntelligence = new GeoIntelligenceTool();
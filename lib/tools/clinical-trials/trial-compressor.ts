/**
 * Trial Compressor - Token-efficient trial data compression
 * 
 * Reduces clinical trial data size by 80-90% while preserving essential information
 * for AI model consumption. Implements progressive disclosure strategy.
 */

import type { ClinicalTrial } from './types';
// LocationMatcher functionality now integrated into LocationService
import { LocationService } from './location-service';

/**
 * Location context for intelligent compression
 */
export interface CompressionContext {
  targetLocation?: {
    city?: string;
    state?: string;
    country?: string;
    coordinates?: { latitude: number; longitude: number };
  };
  searchRadius?: number;
}

/**
 * Compressed trial format optimized for token efficiency
 * Maintains expected UI structure with protocolSection
 */
export interface CompressedTrial {
  // Maintain the expected structure for UI compatibility
  protocolSection: {
    identificationModule: {
      nctId: string;
      briefTitle: string;
    };
    statusModule?: {
      overallStatus?: string;
      lastUpdatePostDateStruct?: {
        date?: string;
      };
    };
    descriptionModule?: {
      briefSummary?: string;
    };
    conditionsModule?: {
      conditions?: string[];
    };
    designModule?: {
      phases?: string[];
      studyType?: string;
      enrollmentInfo?: {
        count?: number;
      };
    };
    armsInterventionsModule?: {
      interventions?: Array<{
        name?: string;
      }>;
    };
    contactsLocationsModule?: {
      locations?: Array<{
        facility?: string;
        city?: string;
        state?: string;
        country?: string;
        status?: string;
      }>;
      locationSummary?: string;
      locationMetadata?: {
        subset: boolean;
        total: number;
      };
    };
    eligibilityModule?: {
      eligibilityCriteria?: string;
      minimumAge?: string;
      maximumAge?: string;
      sex?: string;
    };
  };
  // Metadata for progressive disclosure
  _compressed: boolean;
  _compressionRatio?: number;
}

/**
 * Compresses clinical trial data for token-efficient transmission
 */
export class TrialCompressor {
  /**
   * Compress a single trial to essential fields only while maintaining UI structure
   * @param trial The trial to compress
   * @param context Optional compression context for intelligent location selection
   */
  static compressTrial(trial: ClinicalTrial, context?: CompressionContext): CompressedTrial {
    const original = JSON.stringify(trial).length;
    
    // Build compressed trial maintaining expected structure
    const compressed: CompressedTrial = {
      protocolSection: {
        identificationModule: {
          nctId: trial.protocolSection?.identificationModule?.nctId || '',
          briefTitle: trial.protocolSection?.identificationModule?.briefTitle || ''
        }
      },
      _compressed: true
    };
    
    // Add status module if available
    if (trial.protocolSection?.statusModule) {
      compressed.protocolSection.statusModule = {};
      if (trial.protocolSection.statusModule.overallStatus) {
        compressed.protocolSection.statusModule.overallStatus = trial.protocolSection.statusModule.overallStatus;
      }
      if (trial.protocolSection.statusModule.lastUpdatePostDateStruct?.date) {
        compressed.protocolSection.statusModule.lastUpdatePostDateStruct = {
          date: trial.protocolSection.statusModule.lastUpdatePostDateStruct.date
        };
      }
    }
    
    // Add truncated summary if available
    if (trial.protocolSection?.descriptionModule?.briefSummary) {
      compressed.protocolSection.descriptionModule = {
        briefSummary: this.truncateText(
          trial.protocolSection.descriptionModule.briefSummary,
          200
        )
      };
    }
    
    // Add conditions
    if (trial.protocolSection?.conditionsModule?.conditions) {
      compressed.protocolSection.conditionsModule = {
        conditions: trial.protocolSection.conditionsModule.conditions.slice(0, 5) // Limit to 5
      };
    }
    
    // Add design module with phases, study type, and enrollment
    if (trial.protocolSection?.designModule) {
      compressed.protocolSection.designModule = {};
      if (trial.protocolSection.designModule.phases) {
        compressed.protocolSection.designModule.phases = trial.protocolSection.designModule.phases;
      }
      if (trial.protocolSection.designModule.studyType) {
        compressed.protocolSection.designModule.studyType = trial.protocolSection.designModule.studyType;
      }
      if (trial.protocolSection.designModule.enrollmentInfo?.count) {
        compressed.protocolSection.designModule.enrollmentInfo = {
          count: trial.protocolSection.designModule.enrollmentInfo.count
        };
      }
    }
    
    // Add limited interventions
    const interventions = trial.protocolSection?.armsInterventionsModule?.interventions;
    if (interventions && interventions.length > 0) {
      compressed.protocolSection.armsInterventionsModule = {
        interventions: interventions.slice(0, 5).map(i => ({ name: i.name }))
      };
    }
    
    // Add limited locations with intelligent selection for geographic diversity
    const locations = trial.protocolSection?.contactsLocationsModule?.locations;
    if (locations && locations.length > 0) {
      const isSubset = locations.length > 10;
      
      // Generate location summary for token efficiency (based on ALL locations)
      const locationService = LocationService.getInstance();
      const locationSummaryArray = locationService.getLocationSummaryArray(trial);
      const locationSummary = locationSummaryArray.length > 0 
        ? locationSummaryArray.length === 1 
          ? locationSummaryArray[0]
          : `${locationSummaryArray[0]} + ${locationSummaryArray.length - 1} more location${locationSummaryArray.length - 1 > 1 ? 's' : ''}`
        : undefined;
      
      // Select locations intelligently based on context
      const selectedLocations = this.selectDiverseLocations(locations, 10, context);
      
      compressed.protocolSection.contactsLocationsModule = {
        locations: selectedLocations.map(loc => ({
          facility: loc.facility,
          city: loc.city,
          state: loc.state,
          country: loc.country,
          status: 'status' in loc ? (loc as any).status : undefined
        })),
        locationSummary,
        // Add metadata to indicate if we're showing a subset
        ...(isSubset && {
          locationMetadata: {
            subset: true,
            total: locations.length
          }
        })
      };
    }
    
    // Add compressed eligibility module
    const eligibility = trial.protocolSection?.eligibilityModule;
    if (eligibility) {
      compressed.protocolSection.eligibilityModule = {
        minimumAge: eligibility.minimumAge,
        maximumAge: eligibility.maximumAge,
        sex: eligibility.sex
      };
      
      // Add truncated eligibility criteria if available
      // Full parsing happens BEFORE compression in smart-router
      if (eligibility.eligibilityCriteria) {
        compressed.protocolSection.eligibilityModule.eligibilityCriteria = 
          this.truncateText(eligibility.eligibilityCriteria, 500);
      }
    }
    
    // Calculate compression ratio
    const compressedSize = JSON.stringify(compressed).length;
    compressed._compressionRatio = Math.round((1 - compressedSize / original) * 100);
    
    return compressed;
  }
  
  /**
   * Compress multiple trials
   */
  static compressTrials(trials: ClinicalTrial[], context?: CompressionContext): CompressedTrial[] {
    return trials.map(trial => this.compressTrial(trial, context));
  }
  
  /**
   * Extract intervention names from trial
   */
  private static extractInterventionNames(trial: ClinicalTrial): string[] {
    const interventions = trial.protocolSection?.armsInterventionsModule?.interventions || [];
    return interventions
      .map(i => i.name)
      .filter((name): name is string => Boolean(name))
      .slice(0, 5); // Limit to 5 interventions
  }
  
  /**
   * Select diverse locations to ensure geographic representation
   * Context-aware: Prioritizes locations relevant to the user's search context
   */
  private static selectDiverseLocations(locations: any[], maxCount: number, context?: CompressionContext): any[] {
    if (locations.length <= maxCount) {
      return locations;
    }
    
    const selected: any[] = [];
    const locationService = LocationService.getInstance();
    
    // If we have a target location context, prioritize relevant locations
    if (context?.targetLocation) {
      // Score each location based on relevance to target
      const scoredLocations = locations.map(location => {
        let score = 0;
        
        // CRITICAL: Always prioritize US locations for US patients
        const isUS = location.country === 'United States' || 
                     !location.country || // Assume US if country not specified
                     location.state; // If state is specified, likely US
        if (isUS) {
          score += 200; // Strong US preference
        }
        
        // Exact city match gets highest priority (within country priority)
        if (context.targetLocation?.city && location.city) {
          if (location.city.toLowerCase() === context.targetLocation.city.toLowerCase()) {
            score += 100;
          }
          // Check if it's in the same metro area
          else if (locationService.isMetroArea(location.city, context.targetLocation.city)) {
            score += 80;
          }
        }
        
        // State match gets high priority
        if (context.targetLocation?.state && location.state) {
          if (location.state.toLowerCase() === context.targetLocation.state.toLowerCase()) {
            score += 50;
          }
        }
        
        // Country match gets some priority (but US already gets bonus)
        if (context.targetLocation?.country && location.country) {
          if (location.country.toLowerCase() === context.targetLocation.country.toLowerCase()) {
            score += 20;
          }
        }
        
        // Prefer recruiting locations
        const isRecruiting = !('status' in location) || !location.status || 
                            location.status.toUpperCase() === 'RECRUITING';
        if (isRecruiting) {
          score += 10;
        }
        
        // If we have coordinates, calculate distance-based score
        if (context.targetLocation?.coordinates && location.latitude && location.longitude) {
          const distance = this.calculateDistance(
            context.targetLocation.coordinates.latitude,
            context.targetLocation.coordinates.longitude,
            location.latitude,
            location.longitude
          );
          
          // Inverse distance scoring (closer = higher score)
          // Within 50 miles gets bonus points
          if (distance < 50) {
            score += 60 - distance;
          } else if (distance < 200) {
            score += 30 - (distance / 10);
          }
        }
        
        return { location, score };
      });
      
      // Sort by score (highest first)
      scoredLocations.sort((a, b) => b.score - a.score);
      
      // Take the top scoring locations first
      const highPriority = scoredLocations
        .filter(item => item.score > 50)
        .slice(0, Math.min(5, maxCount));
      
      for (const item of highPriority) {
        selected.push(item.location);
      }
      
      // If we still have room, add geographically diverse locations
      if (selected.length < maxCount) {
        const remaining = scoredLocations
          .filter(item => !selected.includes(item.location))
          .map(item => item.location);
        
        const diverse = this.selectGeographicallyDiverse(remaining, maxCount - selected.length);
        selected.push(...diverse);
      }
    } else {
      // No context provided - fall back to pure geographic diversity
      selected.push(...this.selectGeographicallyDiverse(locations, maxCount));
    }
    
    return selected.slice(0, maxCount);
  }
  
  /**
   * Select geographically diverse locations when no specific context is provided
   * CRITICAL: Prioritizes US locations for US-focused oncology platform
   */
  private static selectGeographicallyDiverse(locations: any[], maxCount: number): any[] {
    // Separate US and non-US locations
    const usLocations: any[] = [];
    const nonUSLocations: any[] = [];
    const locationsByUSState = new Map<string, any[]>();
    const locationsByCountry = new Map<string, any[]>();
    
    for (const location of locations) {
      if (!location.city) continue;
      
      const isUS = location.country === 'United States' || 
                   !location.country || // Assume US if country not specified
                   location.state; // If state is specified, likely US
      
      if (isUS) {
        usLocations.push(location);
        const state = location.state || 'Unknown State';
        if (!locationsByUSState.has(state)) {
          locationsByUSState.set(state, []);
        }
        locationsByUSState.get(state)!.push(location);
      } else {
        nonUSLocations.push(location);
        const country = location.country || 'Unknown';
        if (!locationsByCountry.has(country)) {
          locationsByCountry.set(country, []);
        }
        locationsByCountry.get(country)!.push(location);
      }
    }
    
    const selected: any[] = [];
    
    // First priority: Add US locations with state diversity
    const usStates = Array.from(locationsByUSState.entries())
      .sort(([, a], [, b]) => b.length - a.length); // Sort by number of locations
    
    // First pass: Add at least one location from each US state (up to limit)
    const usTarget = Math.min(maxCount * 0.8, usLocations.length); // Reserve 80% for US locations
    
    for (const [state, stateLocations] of usStates) {
      if (selected.length >= usTarget) break;
      
      // Prioritize recruiting locations
      const recruiting = stateLocations.filter(loc => 
        !('status' in loc) || !loc.status || loc.status.toUpperCase() === 'RECRUITING'
      );
      
      if (recruiting.length > 0) {
        selected.push(recruiting[0]);
      } else {
        selected.push(stateLocations[0]);
      }
    }
    
    // Second pass: Fill more US locations if we have room
    if (selected.length < usTarget) {
      for (const [state, stateLocations] of usStates) {
        if (selected.length >= usTarget) break;
        
        const alreadyFromState = selected.filter(loc => 
          stateLocations.includes(loc)
        ).length;
        
        const remaining = stateLocations.slice(alreadyFromState);
        for (const loc of remaining) {
          if (selected.length >= usTarget) break;
          if (!selected.includes(loc)) {
            selected.push(loc);
          }
        }
      }
    }
    
    // Third pass: Add non-US locations only if we have remaining slots
    if (selected.length < maxCount && nonUSLocations.length > 0) {
      const countries = Array.from(locationsByCountry.entries())
        .sort(([, a], [, b]) => b.length - a.length);
      
      // Add one location per country for diversity
      for (const [country, countryLocations] of countries) {
        if (selected.length >= maxCount) break;
        
        const recruiting = countryLocations.filter(loc => 
          !('status' in loc) || !loc.status || loc.status.toUpperCase() === 'RECRUITING'
        );
        
        if (recruiting.length > 0) {
          selected.push(recruiting[0]);
        } else {
          selected.push(countryLocations[0]);
        }
      }
    }
    
    return selected;
  }
  
  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Truncate text to specified length with smart sentence boundary detection
   */
  private static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    
    // Try to truncate at a sentence boundary
    const truncated = text.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('. ');
    const lastNewline = truncated.lastIndexOf('\n');
    const lastSemicolon = truncated.lastIndexOf('; ');
    
    // Find the best break point
    const breakPoint = Math.max(lastPeriod, lastNewline, lastSemicolon);
    
    if (breakPoint > maxLength * 0.7) {
      // If we have a good break point that preserves at least 70% of the text
      const result = text.substring(0, breakPoint + 1).trim();
      const remainingChars = text.length - result.length;
      return `${result}\n... (${remainingChars.toLocaleString()} more characters)`;
    }
    
    // Otherwise, just truncate at word boundary
    const words = truncated.split(' ');
    words.pop(); // Remove last potentially partial word
    const result = words.join(' ');
    const remainingChars = text.length - result.length;
    return `${result}... (${remainingChars.toLocaleString()} more characters)`;
  }
  
  /**
   * Extract key inclusion/exclusion criteria
   */
  private static extractKeyCriteria(criteriaText: string): {
    inclusion: string[];
    exclusion: string[];
  } {
    const lines = criteriaText.split('\n').map(line => line.trim()).filter(Boolean);
    const inclusion: string[] = [];
    const exclusion: string[] = [];
    let currentSection: 'inclusion' | 'exclusion' | null = null;
    
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      
      // Detect section headers
      if (lineLower.includes('inclusion criteria') || lineLower === 'inclusion:') {
        currentSection = 'inclusion';
        continue;
      }
      if (lineLower.includes('exclusion criteria') || lineLower === 'exclusion:') {
        currentSection = 'exclusion';
        continue;
      }
      
      // Skip headers and very short lines
      if (!line || line.length < 10) continue;
      
      // Add to appropriate section (limit to first 50 chars per criteria)
      const cleaned = line.replace(/^[\d\-\*•\.]+\s*/, '').trim();
      if (cleaned && cleaned.length > 10) {
        const truncated = this.truncateText(cleaned, 50);
        if (currentSection === 'inclusion') {
          inclusion.push(truncated);
        } else if (currentSection === 'exclusion') {
          exclusion.push(truncated);
        }
      }
    }
    
    return { inclusion, exclusion };
  }
  
}
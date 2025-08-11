/**
 * Location Filter Operator - Filters trials by location(s)
 */

import { BaseOperator } from '../../base-operator';
import { LocationMatcher } from '../../../location-matcher';
import type { ClinicalTrial } from '../../../types';
import type { OperatorContext } from '../../types';

export interface LocationFilterConfig {
  /**
   * Cities to filter by
   */
  cities?: string[];
  
  /**
   * States to filter by
   */
  states?: string[];
  
  /**
   * Countries to filter by
   */
  countries?: string[];
  
  /**
   * Whether to include metro areas
   */
  includeMetroAreas?: boolean;
  
  /**
   * Whether to require all locations or any location
   */
  requireAll?: boolean;
}

export class LocationFilter extends BaseOperator<ClinicalTrial, ClinicalTrial> {
  name = 'location-filter';
  canStream = true;
  
  private config: LocationFilterConfig;
  
  constructor(config: LocationFilterConfig = {}) {
    super();
    this.config = {
      includeMetroAreas: true,
      requireAll: false,
      ...config
    };
  }
  
  async execute(
    trials: ClinicalTrial[], 
    context: OperatorContext
  ): Promise<ClinicalTrial[]> {
    this.startExecution(trials.length);
    
    // Determine locations to filter by
    const locations = this.getLocationsToFilter(context);
    
    if (locations.length === 0) {
      // No location filtering needed
      this.logWarning('No locations specified for filtering');
      this.endExecution(trials.length);
      return trials;
    }
    
    // Stream filtering start
    await this.streamData(
      { 
        locations,
        trialCount: trials.length,
        requireAll: this.config.requireAll
      },
      'filter_start',
      context
    );
    
    // Filter trials
    const filteredTrials = trials.filter(trial => 
      this.matchesLocationCriteria(trial, locations)
    );
    
    const filtered = trials.length - filteredTrials.length;
    
    // Add location match metadata to each trial
    const trialsWithMetadata = filteredTrials.map(trial => {
      const matchedLocations = this.getMatchedLocations(trial, locations);
      return {
        ...trial,
        _locationMatches: matchedLocations
      };
    });
    
    // Stream filtering results
    await this.streamData(
      { 
        original: trials.length,
        filtered: filtered,
        remaining: filteredTrials.length,
        matchBreakdown: this.getLocationMatchBreakdown(trialsWithMetadata, locations)
      },
      'filter_complete',
      context
    );
    
    // Add metadata
    this.addMetadata('locations', locations);
    this.addMetadata('filtered', filtered);
    this.addMetadata('matchType', this.config.requireAll ? 'all' : 'any');
    
    this.endExecution(filteredTrials.length);
    return trialsWithMetadata;
  }
  
  private getLocationsToFilter(context: OperatorContext): string[] {
    const locations: string[] = [];
    
    // From context
    if (context.location) {
      locations.push(context.location);
    }
    
    if (context.locations) {
      locations.push(...context.locations);
    }
    
    // From config
    if (this.config.cities) {
      locations.push(...this.config.cities);
    }
    
    if (this.config.states) {
      locations.push(...this.config.states);
    }
    
    if (this.config.countries) {
      locations.push(...this.config.countries);
    }
    
    // Deduplicate
    return [...new Set(locations)];
  }
  
  private matchesLocationCriteria(
    trial: ClinicalTrial, 
    locations: string[]
  ): boolean {
    if (this.config.requireAll) {
      // Trial must match ALL specified locations
      return locations.every(location => 
        LocationMatcher.matchesLocation(trial, location)
      );
    } else {
      // Trial must match ANY of the specified locations
      return locations.some(location => 
        LocationMatcher.matchesLocation(trial, location)
      );
    }
  }
  
  private getMatchedLocations(
    trial: ClinicalTrial, 
    locations: string[]
  ): string[] {
    return locations.filter(location => 
      LocationMatcher.matchesLocation(trial, location)
    );
  }
  
  private getLocationMatchBreakdown(
    trials: any[], 
    locations: string[]
  ): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    for (const location of locations) {
      breakdown[location] = trials.filter(trial => 
        trial._locationMatches?.includes(location)
      ).length;
    }
    
    return breakdown;
  }
  
  validate(context: OperatorContext): boolean {
    // Check if any location criteria is specified
    const hasContextLocation = !!(context.location || context.locations?.length);
    const hasConfigLocation = !!(
      this.config.cities?.length || 
      this.config.states?.length || 
      this.config.countries?.length
    );
    
    return hasContextLocation || hasConfigLocation;
  }
}
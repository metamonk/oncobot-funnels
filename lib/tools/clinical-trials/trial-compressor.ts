/**
 * Trial Compressor - Token-efficient trial data compression
 * 
 * Reduces clinical trial data size by 80-90% while preserving essential information
 * for AI model consumption. Implements progressive disclosure strategy.
 */

import type { ClinicalTrial } from './types';
import { LocationMatcher } from './location-matcher';

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
    };
    descriptionModule?: {
      briefSummary?: string;
    };
    conditionsModule?: {
      conditions?: string[];
    };
    designModule?: {
      phases?: string[];
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
   */
  static compressTrial(trial: ClinicalTrial): CompressedTrial {
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
    if (trial.protocolSection?.statusModule?.overallStatus) {
      compressed.protocolSection.statusModule = {
        overallStatus: trial.protocolSection.statusModule.overallStatus
      };
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
    
    // Add design module with phases and enrollment
    if (trial.protocolSection?.designModule) {
      compressed.protocolSection.designModule = {};
      if (trial.protocolSection.designModule.phases) {
        compressed.protocolSection.designModule.phases = trial.protocolSection.designModule.phases;
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
    
    // Add limited locations (keep only first 10 for token efficiency)
    const locations = trial.protocolSection?.contactsLocationsModule?.locations;
    if (locations && locations.length > 0) {
      const isSubset = locations.length > 10;
      
      // Generate location summary for token efficiency
      const locationSummaryArray = LocationMatcher.getLocationSummary(trial);
      const locationSummary = locationSummaryArray.length > 0 
        ? locationSummaryArray.length === 1 
          ? locationSummaryArray[0]
          : `${locationSummaryArray[0]} + ${locationSummaryArray.length - 1} more location${locationSummaryArray.length - 1 > 1 ? 's' : ''}`
        : undefined;
      
      compressed.protocolSection.contactsLocationsModule = {
        locations: locations.slice(0, 10).map(loc => ({
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
  static compressTrials(trials: ClinicalTrial[]): CompressedTrial[] {
    return trials.map(trial => this.compressTrial(trial));
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
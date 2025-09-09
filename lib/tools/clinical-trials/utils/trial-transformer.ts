/**
 * Utility functions for transforming clinical trial data structures
 * 
 * Following TRUE AI-DRIVEN architecture: simple, robust transformations
 * that handle both API formats gracefully
 */

import type { ClinicalTrial } from '../types';

/**
 * Transforms a clinical trial to ensure it has the protocolSection wrapper
 * Handles both structures:
 * 1. Trials WITH protocolSection wrapper (from search results)
 * 2. Trials WITHOUT protocolSection wrapper (from saved trials)
 * 
 * @param trial - The trial data in either format
 * @returns The trial with guaranteed protocolSection structure
 */
export function ensureProtocolSection(trial: any): ClinicalTrial {
  // If trial already has protocolSection, return as-is
  if (trial?.protocolSection) {
    return trial as ClinicalTrial;
  }

  // Wrap the trial data in protocolSection structure
  return {
    protocolSection: {
      identificationModule: trial?.identificationModule ? {
        nctId: trial.identificationModule.nctId,
        briefTitle: trial.identificationModule.briefTitle || '',
        officialTitle: trial.identificationModule.officialTitle
      } : { nctId: '', briefTitle: '' },
      descriptionModule: trial?.descriptionModule,
      statusModule: trial?.statusModule,
      sponsorCollaboratorsModule: trial?.sponsorCollaboratorsModule,
      contactsLocationsModule: trial?.locationsModule ? {
        locations: trial.locationsModule.locations
      } : trial?.contactsLocationsModule,
      eligibilityModule: trial?.eligibilityModule,
      conditionsModule: trial?.conditionsModule,
      designModule: trial?.designModule,
      armsInterventionsModule: trial?.armsInterventionsModule,
      outcomesModule: trial?.outcomesModule
    }
  };
}

/**
 * Extracts the NCT ID from a trial regardless of its structure
 * 
 * @param trial - The trial data in any format
 * @returns The NCT ID or null if not found
 */
export function extractNctId(trial: any): string | null {
  // Try protocolSection structure first
  if (trial?.protocolSection?.identificationModule?.nctId) {
    return trial.protocolSection.identificationModule.nctId;
  }
  
  // Try direct structure
  if (trial?.identificationModule?.nctId) {
    return trial.identificationModule.nctId;
  }
  
  return null;
}

/**
 * Extracts the trial title from a trial regardless of its structure
 * 
 * @param trial - The trial data in any format
 * @returns The brief title, NCT ID, or 'Clinical Trial' as fallback
 */
export function extractTrialTitle(trial: any): string {
  // Try protocolSection structure
  if (trial?.protocolSection?.identificationModule) {
    return trial.protocolSection.identificationModule.briefTitle ||
           trial.protocolSection.identificationModule.nctId ||
           'Clinical Trial';
  }
  
  // Try direct structure
  if (trial?.identificationModule) {
    return trial.identificationModule.briefTitle ||
           trial.identificationModule.nctId ||
           'Clinical Trial';
  }
  
  return 'Clinical Trial';
}

/**
 * Checks if a trial has the protocolSection wrapper
 * 
 * @param trial - The trial data to check
 * @returns True if the trial has protocolSection, false otherwise
 */
export function hasProtocolSection(trial: any): boolean {
  return Boolean(trial?.protocolSection);
}
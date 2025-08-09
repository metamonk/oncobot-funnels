/**
 * Type definitions for Clinical Trials system
 */

export interface MolecularMarkers {
  [key: string]: 'POSITIVE' | 'NEGATIVE' | 'HIGH' | 'LOW' | string | undefined;
}

export interface HealthProfile {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  cancerRegion?: string | null;
  primarySite?: string | null;
  cancerType?: string | null;
  cancer_type?: string; // Alternative format
  diseaseStage?: string | null;
  stage?: string; // Alternative format
  treatmentHistory?: unknown;
  molecularMarkers?: MolecularMarkers;
  mutations?: string[]; // Alternative format
  treatments?: string[];
  location?: string;
  previousTrials?: string[];
  questionnaireVersion?: number;
}

export interface StudyLocation {
  facility?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  geoPoint?: {
    lat: number;
    lon: number;
  };
}

export interface ClinicalTrialModule {
  nctId: string;
  briefTitle: string;
  officialTitle?: string;
}

export interface ClinicalTrialProtocol {
  identificationModule: ClinicalTrialModule;
  statusModule?: {
    overallStatus?: string;
    [key: string]: unknown;
  };
  descriptionModule?: {
    briefSummary?: string;
    [key: string]: unknown;
  };
  conditionsModule?: {
    conditions?: string[];
    keywords?: string[];
    [key: string]: unknown;
  };
  designModule?: {
    phases?: string[];
    [key: string]: unknown;
  };
  armsInterventionsModule?: {
    interventions?: Array<{
      name?: string;
      description?: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };
  eligibilityModule?: {
    eligibilityCriteria?: string;
    sex?: string;
    minimumAge?: string;
    maximumAge?: string;
    [key: string]: unknown;
  };
  contactsLocationsModule?: {
    locations?: StudyLocation[];
    centralContacts?: unknown[];
    [key: string]: unknown;
  };
}

export interface ClinicalTrial {
  protocolSection: ClinicalTrialProtocol;
  derivedSection?: unknown;
  hasResults?: boolean;
  [key: string]: unknown;
}

export interface ScoredTrial extends ClinicalTrial {
  relevanceScore?: number;
  matchReason?: string;
}
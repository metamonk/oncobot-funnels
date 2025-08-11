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
  performanceStatus?: string | null;
  complications?: unknown;
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

// ============================================================================
// NEW ELIGIBILITY ASSESSMENT STRUCTURE
// ============================================================================

/**
 * Three-layer eligibility assessment model that properly separates:
 * 1. Search relevance (why trial appeared)
 * 2. Trial criteria (what trial requires)
 * 3. User assessment (personal eligibility)
 */
export interface TrialEligibilityAssessment {
  // Layer 1: Search Context (Always present)
  searchRelevance: {
    matchedTerms: string[];        // Terms that matched the search
    relevanceScore: number;         // 0-1 search relevance
    searchStrategy: 'profile' | 'entity' | 'literal' | 'nct';
    reasoning: string;              // Why this trial was included
  };
  
  // Layer 2: Trial Requirements (What the trial requires)
  trialCriteria: {
    parsed: boolean;                // Whether criteria were successfully parsed
    inclusion: CriteriaItem[];      // Parsed inclusion criteria
    exclusion: CriteriaItem[];      // Parsed exclusion criteria
    demographics: {
      ageRange?: [number, number];
      sex?: 'ALL' | 'MALE' | 'FEMALE';
      healthyVolunteers?: boolean;
    };
    rawText?: string;              // Original criteria text (progressive disclosure)
    parseConfidence: number;       // 0-1 confidence in parsing accuracy
  };
  
  // Layer 3: User Assessment (Only with profile)
  userAssessment?: {
    hasProfile: boolean;
    assessmentDate: string;        // ISO date string
    eligibilityScore?: number;     // 0-1, only calculated with profile
    matches: {
      inclusion: MatchedCriteria[];
      exclusion: MatchedCriteria[];
    };
    missingData: string[];         // What we need from user
    confidence: 'high' | 'medium' | 'low' | 'insufficient-data';
    recommendation: 'likely' | 'possible' | 'unlikely' | 'insufficient-data';
  };
}

/**
 * Individual eligibility criterion item
 */
export interface CriteriaItem {
  id: string;                     // Unique identifier for this criterion
  text: string;                   // Human-readable criterion text
  category: 'disease' | 'biomarker' | 'treatment' | 'demographic' | 'performance' | 'other';
  required: boolean;              // Whether this is required or optional
  parsedEntities?: {
    genes?: string[];
    mutations?: string[];
    cancerTypes?: string[];
    stages?: string[];
    treatments?: string[];
    biomarkers?: string[];
  };
}

/**
 * Matched criteria with assessment details
 */
export interface MatchedCriteria extends CriteriaItem {
  matchType: 'exact' | 'partial' | 'inferred' | 'missing';
  profileData?: string;           // What from profile matched
  confidence: number;             // 0-1 confidence in match
  reasoning: string;              // Explanation of match/mismatch
}


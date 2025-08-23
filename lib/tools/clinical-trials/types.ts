/**
 * Type definitions for Clinical Trials system
 */

export interface MolecularMarkers {
  [key: string]: 'POSITIVE' | 'NEGATIVE' | 'HIGH' | 'LOW' | string | undefined;
}

export interface TreatmentHistoryItem {
  name: string;
  type?: 'chemotherapy' | 'radiation' | 'surgery' | 'immunotherapy' | 'targeted' | 'other';
  startDate?: Date | string;
  endDate?: Date | string;
  response?: 'complete' | 'partial' | 'stable' | 'progression' | 'unknown';
}

export interface Complication {
  name: string;
  severity?: 'mild' | 'moderate' | 'severe';
  ongoing?: boolean;
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
  treatmentHistory?: string[] | TreatmentHistoryItem[];
  molecularMarkers?: MolecularMarkers;
  mutations?: string[]; // Alternative format
  treatments?: string[];
  location?: string;
  previousTrials?: string[];
  performanceStatus?: string | null;
  complications?: string[] | Complication[];
  questionnaireVersion?: number;
  // Additional demographic fields for better matching
  dateOfBirth?: Date | string;
  age?: number; // Calculated from dateOfBirth
  sex?: 'MALE' | 'FEMALE' | 'OTHER';
  race?: string;
  ethnicity?: string;
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

export interface ClinicalTrialContact {
  name?: string;
  role?: string;
  phone?: string;
  email?: string;
}

export interface ClinicalTrialIntervention {
  type?: string;
  name?: string;
  description?: string;
  armGroupLabels?: string[];
  otherNames?: string[];
}

export interface ClinicalTrialProtocol {
  identificationModule: ClinicalTrialModule;
  statusModule?: {
    overallStatus?: string;
    startDateStruct?: { date: string; type?: string };
    completionDateStruct?: { date: string; type?: string };
    lastUpdatePostDateStruct?: { date: string };
    studyFirstPostDateStruct?: { date: string };
    lastUpdateSubmitDate?: string;
    whyStopped?: string;
  };
  descriptionModule?: {
    briefSummary?: string;
    detailedDescription?: string;
  };
  conditionsModule?: {
    conditions?: string[];
    keywords?: string[];
  };
  designModule?: {
    phases?: string[];
    studyType?: string;
    patientRegistry?: boolean;
    targetDuration?: string;
    primaryPurpose?: string;
    allocation?: string;
    interventionModel?: string;
    masking?: string;
    enrollmentInfo?: {
      count?: number;
      type?: string;
    };
  };
  armsInterventionsModule?: {
    interventions?: ClinicalTrialIntervention[];
    armGroups?: Array<{
      label?: string;
      type?: string;
      description?: string;
      interventionNames?: string[];
    }>;
  };
  eligibilityModule?: {
    eligibilityCriteria?: string;
    sex?: string;
    minimumAge?: string;
    maximumAge?: string;
    healthyVolunteers?: boolean;
    stdAges?: string[];
  };
  contactsLocationsModule?: {
    locations?: StudyLocation[];
    centralContacts?: ClinicalTrialContact[];
    overallOfficials?: Array<{
      name?: string;
      affiliation?: string;
      role?: string;
    }>;
  };
  sponsorCollaboratorsModule?: {
    responsibleParty?: {
      type?: string;
      investigatorFullName?: string;
      investigatorTitle?: string;
      investigatorAffiliation?: string;
    };
    leadSponsor?: {
      name?: string;
      class?: string;
    };
    collaborators?: Array<{
      name?: string;
      class?: string;
    }>;
  };
  outcomesModule?: {
    primaryOutcomes?: Array<{
      measure?: string;
      description?: string;
      timeFrame?: string;
    }>;
    secondaryOutcomes?: Array<{
      measure?: string;
      description?: string;
      timeFrame?: string;
    }>;
  };
}

export interface ClinicalTrialDerivedSection {
  miscInfoModule?: {
    versionHolder?: string;
    modelPredictions?: Array<{
      predictionType?: string;
      confidence?: number;
    }>;
  };
  conditionBrowseModule?: {
    meshTerms?: Array<{ id: string; term: string }>;
    ancestors?: Array<{ id: string; term: string }>;
    browseLeaves?: Array<{
      id: string;
      name: string;
      relevance?: string;
    }>;
  };
  interventionBrowseModule?: {
    meshTerms?: Array<{ id: string; term: string }>;
    ancestors?: Array<{ id: string; term: string }>;
    browseLeaves?: Array<{
      id: string;
      name: string;
      relevance?: string;
    }>;
  };
}

export interface ClinicalTrial {
  protocolSection: ClinicalTrialProtocol;
  derivedSection?: ClinicalTrialDerivedSection;
  hasResults?: boolean;
  rank?: number;
  // Extended metadata from search results
  _score?: number;
  _eligibilityScore?: number;
  _matchReason?: string;
  _locationMatches?: string[];
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

/**
 * Trial match interface for UI display
 */
export interface TrialMatch {
  nctId: string;
  title: string;
  summary: string;
  conditions: string[];
  interventions: string[];
  locations: Array<{
    facility: string;
    city: string;
    state: string;
    country: string;
    status: string;
  }>;
  locationSummary?: string;
  distance?: number; // Distance in miles from user location
  closestLocation?: {
    location: StudyLocation;
    distance?: number;
    isMetroArea?: boolean;
    matchType?: 'exact' | 'metro' | 'state' | 'country';
  };
  enrollmentCount?: number;
  studyType?: string;
  phases?: string[];
  lastUpdateDate?: string;
  matchReason?: string;
  relevanceScore?: number;
  trial: ClinicalTrial | any; // Should be CompressedTrial for token efficiency
  filterLocation?: string;
  // Eligibility scoring enhancements
  recommendations?: string[];
  eligibilityBreakdown?: {
    conditionMatch: number;
    stageMatch: number;
    molecularMatch: number;
    treatmentHistoryMatch: number;
    demographicMatch: number;
    performanceStatusMatch: number;
  };
  // UI-expected assessment structure
  eligibilityAssessment?: {
    // From EligibilityAnalyzer
    likelyEligible?: boolean;
    score?: number;
    inclusionMatches?: string[];
    exclusionConcerns?: string[];
    uncertainFactors?: string[];
    missingInformation?: string[];
    
    // Original structure (kept for compatibility)
    trialCriteria?: {
      parsed: boolean;
      inclusion: Array<{
        id: string;
        text: string;
        category: string;
        required: boolean;
      }>;
      exclusion: Array<{
        id: string;
        text: string;
        category: string;
        required: boolean;
      }>;
    };
    userAssessment?: {
      hasProfile: boolean;
      eligibilityScore?: number;
      confidence?: 'high' | 'medium' | 'low';
      recommendation?: 'likely' | 'possible' | 'unlikely';
      inclusionMatches?: string[];
      exclusionConcerns?: string[];
      missingData: string[];
    };
  };
}

/**
 * Cached search results for a chat session
 */
export interface CachedSearch {
  chatId: string;
  trials: ClinicalTrial[];
  healthProfile: HealthProfile | null;
  searchQueries: string[];
  timestamp: number;
  lastOffset: number;
}


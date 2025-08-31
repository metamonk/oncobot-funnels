/**
 * Type definitions for the saved trials system
 */

// Clinical trial data structure from ClinicalTrials.gov API
export interface ClinicalTrial {
  identificationModule?: {
    nctId: string;
    orgStudyIdInfo?: {
      id: string;
    };
    briefTitle?: string;
    officialTitle?: string;
  };
  descriptionModule?: {
    briefSummary?: string;
    detailedDescription?: string;
  };
  statusModule?: {
    overallStatus?: string;
    startDateStruct?: {
      date?: string;
    };
    completionDateStruct?: {
      date?: string;
    };
  };
  sponsorCollaboratorsModule?: {
    leadSponsor?: {
      name?: string;
      class?: string;
    };
  };
  locationsModule?: {
    locations?: Array<{
      facility?: string;
      city?: string;
      state?: string;
      country?: string;
      status?: string;
    }>;
  };
  eligibilityModule?: {
    minimumAge?: string;
    maximumAge?: string;
    sex?: string;
    healthyVolunteers?: string;
    eligibilityCriteria?: string;
  };
  contactsModule?: {
    centralContacts?: Array<{
      name?: string;
      role?: string;
      phone?: string;
      email?: string;
    }>;
  };
}

// Saved trial record in the database
export interface SavedTrial {
  id: string;
  userId: string;
  nctId: string;
  title: string;
  notes?: string | null;
  tags?: string[];
  searchContext?: SearchContext | null;
  trialSnapshot: ClinicalTrial;
  lastUpdated: Date;
  savedAt: Date;
  healthProfileSnapshot?: HealthProfileSnapshot | null;
}

// Search context when a trial was saved
export interface SearchContext {
  query?: string;
  filters?: Record<string, unknown>;
  sessionId?: string;
  timestamp?: number;
}

// Health profile snapshot at save time
export interface HealthProfileSnapshot {
  cancerType?: string;
  cancerRegion?: string;
  diseaseStage?: string;
  molecularMarkers?: Record<string, string>;
}

// Service layer types
export interface SaveTrialInput {
  nctId: string;
  title: string;
  notes?: string;
  tags?: string[];
  trialSnapshot: ClinicalTrial;
  searchContext?: SearchContext;
  healthProfileSnapshot?: HealthProfileSnapshot;
}

export interface UpdateTrialInput {
  id: string;
  notes?: string;
  tags?: string[];
}

// UI component props
export interface SaveButtonProps {
  trial: ClinicalTrial;
  initialSaved?: boolean;
  className?: string;
}

// Event system types
export interface TrialSaveEvent {
  nctId: string;
  saved: boolean;
  timestamp: number;
}

export type SaveStateCallback = (saved: boolean) => void;

// Sync API types
export interface SyncRequest {
  trials: Array<{
    nctId: string;
    title?: string;
    trialSnapshot?: ClinicalTrial;
    syncStatus: 'pending' | 'synced' | 'failed';
  }>;
  deletions: string[];
}

export interface SyncResponse {
  success: boolean;
  synced: string[];
  failed: string[];
  error?: string;
}
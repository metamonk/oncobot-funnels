/**
 * Trial Status Service
 * 
 * Centralized, configurable service for managing clinical trial recruitment status filtering.
 * Provides flexible, environment-aware status filtering with progressive enhancement.
 */

import type { ClinicalTrial } from '../types';
import { debug, DebugCategory } from '../debug';

/**
 * Recruitment statuses from ClinicalTrials.gov API
 */
export enum RecruitmentStatus {
  RECRUITING = 'RECRUITING',
  ACTIVE_NOT_RECRUITING = 'ACTIVE_NOT_RECRUITING',
  NOT_YET_RECRUITING = 'NOT_YET_RECRUITING',
  ENROLLING_BY_INVITATION = 'ENROLLING_BY_INVITATION',
  COMPLETED = 'COMPLETED',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
  WITHDRAWN = 'WITHDRAWN',
  UNKNOWN = 'UNKNOWN',
  EXPANDED_ACCESS = 'EXPANDED_ACCESS'
}

/**
 * Configuration for trial status filtering
 */
export interface TrialStatusConfig {
  // Status priorities and inclusion
  statusPriorities: {
    primary: RecruitmentStatus[];      // Always include in searches
    secondary: RecruitmentStatus[];    // Include when expanding results
    excluded: RecruitmentStatus[];     // Never include
  };
  
  // Filtering rules
  filterRules: {
    strictRecruiting: boolean;         // Only RECRUITING status
    includeInvitation: boolean;        // Include ENROLLING_BY_INVITATION
    includeNotRecruiting: boolean;     // Include ACTIVE_NOT_RECRUITING
    includeExpanded: boolean;          // Include EXPANDED_ACCESS
    autoExpand: boolean;               // Automatically expand if few results
    minResultsBeforeExpansion: number; // Threshold for auto-expansion
  };
  
  // User preferences (can be overridden per-user)
  userPreferences?: {
    preferredStatuses?: RecruitmentStatus[];
    excludeStatuses?: RecruitmentStatus[];
    maxDistanceForNonRecruiting?: number;  // Miles
    showCompletedTrials?: boolean;
  };
}

/**
 * Search context for intelligent status selection
 */
export interface SearchContext {
  resultCount?: number;
  hasRareDisease?: boolean;
  userLocation?: { latitude: number; longitude: number };
  searchRadius?: number;
  urgency?: 'high' | 'medium' | 'low';
  previousSearchStatuses?: RecruitmentStatus[];
}

/**
 * Default configurations for different environments
 */
const DEFAULT_CONFIGS: Record<string, TrialStatusConfig> = {
  production: {
    statusPriorities: {
      primary: [
        RecruitmentStatus.RECRUITING,
        RecruitmentStatus.NOT_YET_RECRUITING  // Include upcoming trials
      ],
      secondary: [
        RecruitmentStatus.ENROLLING_BY_INVITATION,
        RecruitmentStatus.EXPANDED_ACCESS
      ],
      excluded: [
        RecruitmentStatus.TERMINATED,
        RecruitmentStatus.SUSPENDED,
        RecruitmentStatus.WITHDRAWN,
        RecruitmentStatus.COMPLETED,
        RecruitmentStatus.ACTIVE_NOT_RECRUITING  // Exclude non-recruiting in production
      ]
    },
    filterRules: {
      strictRecruiting: false,  // Start with recruiting but can expand
      includeInvitation: false,  // Don't include by default
      includeNotRecruiting: false,  // Don't include non-recruiting
      includeExpanded: false,
      autoExpand: true,
      minResultsBeforeExpansion: 3  // Expand sooner to find more results
    }
  },
  development: {
    statusPriorities: {
      primary: [
        RecruitmentStatus.RECRUITING,
        RecruitmentStatus.NOT_YET_RECRUITING  // Include upcoming trials in dev
      ],
      secondary: [
        RecruitmentStatus.ENROLLING_BY_INVITATION,
        RecruitmentStatus.EXPANDED_ACCESS,
        RecruitmentStatus.ACTIVE_NOT_RECRUITING  // Only as fallback in dev
      ],
      excluded: [
        RecruitmentStatus.TERMINATED,
        RecruitmentStatus.SUSPENDED,
        RecruitmentStatus.WITHDRAWN,
        RecruitmentStatus.COMPLETED
      ]
    },
    filterRules: {
      strictRecruiting: false,
      includeInvitation: false,  // Don't include by default even in dev
      includeNotRecruiting: false,  // Don't include by default
      includeExpanded: false,  // Don't include by default
      autoExpand: true,
      minResultsBeforeExpansion: 3
    }
  }
};

/**
 * Service for managing trial recruitment status filtering
 */
export class TrialStatusService {
  private static instance: TrialStatusService;
  private config: TrialStatusConfig;
  private environment: string;
  
  private constructor(environment: string = process.env.NODE_ENV || 'development') {
    this.environment = environment;
    this.config = this.loadConfig();
  }
  
  static getInstance(): TrialStatusService {
    if (!TrialStatusService.instance) {
      TrialStatusService.instance = new TrialStatusService();
    }
    return TrialStatusService.instance;
  }
  
  /**
   * Load configuration based on environment
   */
  private loadConfig(): TrialStatusConfig {
    const envConfig = DEFAULT_CONFIGS[this.environment] || DEFAULT_CONFIGS.development;
    
    // Could be extended to load from database or config file
    // const customConfig = await loadCustomConfig();
    // return mergeConfigs(envConfig, customConfig);
    
    return envConfig;
  }
  
  /**
   * Update configuration (useful for testing or runtime changes)
   */
  updateConfig(config: Partial<TrialStatusConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      statusPriorities: {
        ...this.config.statusPriorities,
        ...config.statusPriorities
      },
      filterRules: {
        ...this.config.filterRules,
        ...config.filterRules
      },
      userPreferences: {
        ...this.config.userPreferences,
        ...config.userPreferences
      }
    };
    
    debug.log(DebugCategory.TOOL, 'Trial status config updated', this.config);
  }
  
  /**
   * Get statuses to use for initial search
   */
  getInitialSearchStatuses(context?: SearchContext): RecruitmentStatus[] {
    // Check for user preferences first
    if (this.config.userPreferences?.preferredStatuses?.length) {
      return this.config.userPreferences.preferredStatuses;
    }
    
    // Strict recruiting mode
    if (this.config.filterRules.strictRecruiting) {
      return [RecruitmentStatus.RECRUITING];
    }
    
    // Use primary statuses by default (should only be recruiting statuses)
    const statuses = [...this.config.statusPriorities.primary];
    
    // Only add invitation status if configured AND we need more results
    if (this.config.filterRules.includeInvitation && 
        !statuses.includes(RecruitmentStatus.ENROLLING_BY_INVITATION) &&
        context?.resultCount !== undefined && 
        context.resultCount < (this.config.filterRules.minResultsBeforeExpansion || 5)) {
      statuses.push(RecruitmentStatus.ENROLLING_BY_INVITATION);
    }
    
    // Don't add not recruiting in initial search - only in expansion
    // Remove this block entirely as ACTIVE_NOT_RECRUITING should not be in initial search
    
    debug.log(DebugCategory.TOOL, 'Initial search statuses', { 
      statuses,
      context,
      config: this.config.filterRules
    });
    
    return statuses;
  }
  
  /**
   * Get expanded statuses when initial search returns few results
   */
  getExpandedSearchStatuses(context?: SearchContext): RecruitmentStatus[] {
    const currentStatuses = context?.previousSearchStatuses || this.getInitialSearchStatuses(context);
    const expandedStatuses = [...currentStatuses];
    
    // Add secondary statuses
    for (const status of this.config.statusPriorities.secondary) {
      if (!expandedStatuses.includes(status)) {
        expandedStatuses.push(status);
      }
    }
    
    // For rare diseases or high urgency, include even more statuses
    if (context?.hasRareDisease || context?.urgency === 'high') {
      if (!expandedStatuses.includes(RecruitmentStatus.NOT_YET_RECRUITING)) {
        expandedStatuses.push(RecruitmentStatus.NOT_YET_RECRUITING);
      }
      if (this.config.filterRules.includeExpanded && 
          !expandedStatuses.includes(RecruitmentStatus.EXPANDED_ACCESS)) {
        expandedStatuses.push(RecruitmentStatus.EXPANDED_ACCESS);
      }
    }
    
    // Remove excluded statuses
    const filtered = expandedStatuses.filter(status => 
      !this.config.statusPriorities.excluded.includes(status)
    );
    
    debug.log(DebugCategory.TOOL, 'Expanded search statuses', {
      original: currentStatuses,
      expanded: filtered,
      context
    });
    
    return filtered;
  }
  
  /**
   * Determine if search should be expanded based on results
   */
  shouldExpandSearch(resultCount: number, context?: SearchContext): boolean {
    if (!this.config.filterRules.autoExpand) {
      return false;
    }
    
    const threshold = context?.hasRareDisease 
      ? Math.max(1, this.config.filterRules.minResultsBeforeExpansion / 2)
      : this.config.filterRules.minResultsBeforeExpansion;
    
    return resultCount < threshold;
  }
  
  /**
   * Filter trials by recruitment status with prioritization
   */
  filterTrialsByStatus(
    trials: ClinicalTrial[], 
    allowedStatuses?: RecruitmentStatus[]
  ): ClinicalTrial[] {
    const statuses = allowedStatuses || this.getInitialSearchStatuses();
    
    // First, try to get only RECRUITING trials
    const recruitingTrials = trials.filter(trial => {
      const status = trial.protocolSection?.statusModule?.overallStatus as RecruitmentStatus;
      return status === RecruitmentStatus.RECRUITING;
    });
    
    // If we have recruiting trials, return those first
    if (recruitingTrials.length > 0) {
      // Also include other trials but put recruiting first
      const otherTrials = trials.filter(trial => {
        const status = trial.protocolSection?.statusModule?.overallStatus as RecruitmentStatus;
        return status !== RecruitmentStatus.RECRUITING && statuses.includes(status);
      });
      return [...recruitingTrials, ...otherTrials];
    }
    
    // Otherwise, return all trials matching allowed statuses
    return trials.filter(trial => {
      const status = trial.protocolSection?.statusModule?.overallStatus as RecruitmentStatus;
      return statuses.includes(status);
    });
  }
  
  /**
   * Rank trials by recruitment status preference
   */
  rankTrialsByStatus(trials: ClinicalTrial[]): ClinicalTrial[] {
    const statusRank: Record<string, number> = {
      [RecruitmentStatus.RECRUITING]: 100,
      [RecruitmentStatus.ENROLLING_BY_INVITATION]: 90,
      [RecruitmentStatus.NOT_YET_RECRUITING]: 80,
      [RecruitmentStatus.EXPANDED_ACCESS]: 70,
      [RecruitmentStatus.ACTIVE_NOT_RECRUITING]: 60,
      [RecruitmentStatus.COMPLETED]: 30,
      [RecruitmentStatus.SUSPENDED]: 20,
      [RecruitmentStatus.TERMINATED]: 10,
      [RecruitmentStatus.WITHDRAWN]: 5,
      [RecruitmentStatus.UNKNOWN]: 0
    };
    
    return [...trials].sort((a, b) => {
      const statusA = a.protocolSection?.statusModule?.overallStatus || RecruitmentStatus.UNKNOWN;
      const statusB = b.protocolSection?.statusModule?.overallStatus || RecruitmentStatus.UNKNOWN;
      
      const rankA = statusRank[statusA] || 0;
      const rankB = statusRank[statusB] || 0;
      
      return rankB - rankA;
    });
  }
  
  /**
   * Get display label for recruitment status
   */
  getStatusLabel(status: RecruitmentStatus): string {
    const labels: Record<RecruitmentStatus, string> = {
      [RecruitmentStatus.RECRUITING]: 'Actively Recruiting',
      [RecruitmentStatus.ACTIVE_NOT_RECRUITING]: 'Active, Not Recruiting',
      [RecruitmentStatus.NOT_YET_RECRUITING]: 'Not Yet Recruiting',
      [RecruitmentStatus.ENROLLING_BY_INVITATION]: 'By Invitation Only',
      [RecruitmentStatus.COMPLETED]: 'Completed',
      [RecruitmentStatus.SUSPENDED]: 'Suspended',
      [RecruitmentStatus.TERMINATED]: 'Terminated',
      [RecruitmentStatus.WITHDRAWN]: 'Withdrawn',
      [RecruitmentStatus.UNKNOWN]: 'Unknown',
      [RecruitmentStatus.EXPANDED_ACCESS]: 'Expanded Access'
    };
    
    return labels[status] || status;
  }
  
  /**
   * Get status badge color for UI
   */
  getStatusColor(status: RecruitmentStatus): string {
    const colors: Record<RecruitmentStatus, string> = {
      [RecruitmentStatus.RECRUITING]: 'green',
      [RecruitmentStatus.ACTIVE_NOT_RECRUITING]: 'yellow',
      [RecruitmentStatus.NOT_YET_RECRUITING]: 'blue',
      [RecruitmentStatus.ENROLLING_BY_INVITATION]: 'purple',
      [RecruitmentStatus.COMPLETED]: 'gray',
      [RecruitmentStatus.SUSPENDED]: 'orange',
      [RecruitmentStatus.TERMINATED]: 'red',
      [RecruitmentStatus.WITHDRAWN]: 'red',
      [RecruitmentStatus.UNKNOWN]: 'gray',
      [RecruitmentStatus.EXPANDED_ACCESS]: 'cyan'
    };
    
    return colors[status] || 'gray';
  }
  
  /**
   * Check if a trial is actively recruiting
   */
  isActivelyRecruiting(trial: ClinicalTrial): boolean {
    const status = trial.protocolSection?.statusModule?.overallStatus as RecruitmentStatus;
    return status === RecruitmentStatus.RECRUITING || 
           status === RecruitmentStatus.ENROLLING_BY_INVITATION;
  }
}

// Export singleton instance
export const trialStatusService = TrialStatusService.getInstance();
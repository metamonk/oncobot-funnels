/**
 * Clinical Trials Info Module Types
 * 
 * Core types and interfaces for the modular info system
 */

export interface InfoSection {
  heading: string;
  content: string;
  items?: string[];
}

export interface InfoResponse {
  type: 'informational' | 'action_needed' | 'educational';
  title: string;
  content: string;
  sections?: InfoSection[];
  nextSteps?: string[];
  relatedQuestions?: string[];
  requiresProfile?: boolean;
  actionButton?: {
    label: string;
    action: 'create_profile' | 'search_trials' | 'learn_more';
  };
}

export interface InfoContext {
  hasProfile: boolean;
  userProfile?: any; // Will be typed with actual HealthProfile type
  query: string;
  previousQuestions?: string[];
  sessionContext?: Record<string, any>;
}

export interface InfoModuleMetadata {
  id: string;
  name: string;
  description: string;
  priority: number;
  sources?: string[];
  lastUpdated?: Date;
  reviewedBy?: string;
  tags?: string[];
}

export interface InfoModule {
  metadata: InfoModuleMetadata;
  patterns: RegExp[];
  keywords?: string[];
  getResponse: (context: InfoContext) => InfoResponse | Promise<InfoResponse>;
  canHandle?: (query: string, context: InfoContext) => boolean;
  preProcess?: (query: string) => string;
  postProcess?: (response: InfoResponse, context: InfoContext) => InfoResponse;
}

export interface MatchResult {
  module: InfoModule;
  confidence: number;
  matchType: 'pattern' | 'keyword' | 'semantic';
  matchedPattern?: RegExp;
  matchedKeywords?: string[];
}

export interface ComposedResponse extends InfoResponse {
  sourceModules: string[];
  compositionStrategy: 'single' | 'merged' | 'sequential';
}
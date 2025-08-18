/**
 * Core Analytics Types and Interfaces
 * 
 * Centralized type definitions for the entire analytics system
 */

// ============================================================================
// Core Event Types
// ============================================================================

export interface AnalyticsEvent {
  name: string;
  category: EventCategory;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
  revenue?: RevenueData;
}

export interface RevenueData {
  currency: string;
  amount: number;
  type?: 'one-time' | 'recurring' | 'trial';
}

export enum EventCategory {
  SEARCH = 'search',
  ENGAGEMENT = 'engagement',
  CONVERSION = 'conversion',
  PERFORMANCE = 'performance',
  ERROR = 'error',
  FEATURE_DISCOVERY = 'feature_discovery',
  NAVIGATION = 'navigation',
  HEALTH_PROFILE = 'health_profile',
  CLINICAL_TRIALS = 'clinical_trials',
}

// ============================================================================
// User and Session Types
// ============================================================================

export interface UserTraits {
  email?: string;
  name?: string;
  createdAt?: Date;
  plan?: string;
  hasHealthProfile?: boolean;
  cancerType?: string;
  diseaseStage?: string;
}

export interface SessionData {
  id: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  events: string[];
  source: AttributionSource;
  touchpoints: TouchPoint[];
  conversions: string[];
  totalValue: number;
}

export interface TouchPoint {
  timestamp: number;
  event: string;
  source?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Attribution Types
// ============================================================================

export enum AttributionSource {
  ORGANIC_SEARCH = 'organic_search',
  DIRECT = 'direct',
  REFERRAL = 'referral',
  SOCIAL = 'social',
  EMAIL = 'email',
  PAID_SEARCH = 'paid_search',
  PAID_SOCIAL = 'paid_social',
  INTERNAL = 'internal',
}

// ============================================================================
// Provider Types
// ============================================================================

export interface AnalyticsProvider {
  name: string;
  isReady: boolean;
  
  // Core methods
  track(event: AnalyticsEvent): Promise<void>;
  identify(userId: string, traits?: UserTraits): Promise<void>;
  setUserProperties(properties: Record<string, any>): Promise<void>;
  reset(): Promise<void>;
  
  // Optional methods
  startSession?(sessionData: Partial<SessionData>): Promise<void>;
  endSession?(): Promise<void>;
  flush?(): Promise<void>;
}

export interface AnalyticsConfig {
  providers: AnalyticsProviderConfig[];
  debug?: boolean;
  batchSize?: number;
  flushInterval?: number;
  sessionTimeout?: number;
  enableAutoTracking?: boolean;
  enableErrorTracking?: boolean;
  enablePerformanceTracking?: boolean;
}

export interface AnalyticsProviderConfig {
  name: string;
  enabled: boolean;
  config?: Record<string, any>;
}

// ============================================================================
// Event Schema Types
// ============================================================================

export interface EventSchema {
  name: string;
  category: EventCategory;
  requiredProperties?: string[];
  optionalProperties?: string[];
  revenue?: RevenueData;
  description?: string;
  version?: string;
}

// ============================================================================
// Performance Types
// ============================================================================

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id: string;
  navigationType?: string;
}

export enum PerformanceCategory {
  INSTANT = 'instant',       // <100ms
  FAST = 'fast',             // <300ms
  MODERATE = 'moderate',     // <1000ms
  SLOW = 'slow',             // <3000ms
  VERY_SLOW = 'very_slow',   // ≥3000ms
}

// ============================================================================
// Error Types
// ============================================================================

export interface AnalyticsError {
  message: string;
  code?: string;
  stack?: string;
  context?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
}

// ============================================================================
// Feature Discovery Types
// ============================================================================

export interface Feature {
  id: string;
  name: string;
  category: string;
  value: number;
  description?: string;
  firstUsedAt?: number;
  usageCount?: number;
}

// ============================================================================
// Clinical Trials Types
// ============================================================================

export interface TrialInteraction {
  trialId: string;
  interactionType: 'view' | 'contact_view' | 'contact_click' | 'criteria_expand' | 'export';
  matchScore?: number;
  location?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Conversion Types
// ============================================================================

export interface ConversionEvent {
  id: string;
  name: string;
  value: number;
  type: 'engagement' | 'action' | 'intent' | 'conversion' | 'revenue' | 'viral' | 'technical' | 'value_realized';
  category?: EventCategory;
  metadata?: Record<string, any>;
}

// ============================================================================
// Time to Value Types
// ============================================================================

export interface TTVMilestone {
  id: string;
  name: string;
  value: number;
  achievedAt?: number;
  timeToAchieve?: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// Utility Types
// ============================================================================

export type EventHandler = (event: AnalyticsEvent) => void | Promise<void>;
export type ErrorHandler = (error: AnalyticsError) => void;
export type Middleware = (event: AnalyticsEvent, next: () => Promise<void>) => Promise<void>;

// ============================================================================
// Export all types
// ============================================================================

export type {
  AnalyticsEvent as Event,
  UserTraits as User,
  SessionData as Session,
  AnalyticsProvider as Provider,
  AnalyticsConfig as Config,
};
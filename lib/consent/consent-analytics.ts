/**
 * Consent Analytics Service
 * Tracks consent metrics for optimization and compliance
 * Following CLAUDE.md: AI-driven architecture, no complex conditionals
 */

import { ConsentCategory } from './consent-client';

export interface ConsentMetrics {
  userId: string;
  timestamp: Date;
  action: 'granted' | 'revoked' | 'checked' | 'failed';
  category?: ConsentCategory;
  context?: string;
  timeToDecision?: number; // milliseconds
  error?: string;
}

export interface ConsentAnalytics {
  acceptanceRate: number;
  averageTimeToConsent: number;
  dropoffRate: number;
  mostGrantedCategory: ConsentCategory | null;
  leastGrantedCategory: ConsentCategory | null;
}

/**
 * Consent Analytics Service
 * Provides insights into consent patterns and user behavior
 */
export class ConsentAnalyticsService {
  private static metrics: ConsentMetrics[] = [];
  private static sessionStartTimes = new Map<string, number>();

  /**
   * Start tracking a consent session
   */
  static startSession(userId: string): void {
    this.sessionStartTimes.set(userId, Date.now());
  }

  /**
   * Track a consent event
   */
  static track(metrics: Omit<ConsentMetrics, 'timestamp'>): void {
    const userId = metrics.userId;
    const sessionStartTime = this.sessionStartTimes.get(userId);
    
    const fullMetrics: ConsentMetrics = {
      ...metrics,
      timestamp: new Date(),
      timeToDecision: sessionStartTime ? Date.now() - sessionStartTime : undefined
    };

    this.metrics.push(fullMetrics);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Consent Analytics]', fullMetrics);
    }

    // In production, this would send to analytics service
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(fullMetrics);
    }
  }

  /**
   * Track consent granted
   */
  static trackGranted(userId: string, categories: ConsentCategory[], context?: string): void {
    categories.forEach(category => {
      this.track({
        userId,
        action: 'granted',
        category,
        context
      });
    });
  }

  /**
   * Track consent revoked
   */
  static trackRevoked(userId: string, categories: ConsentCategory[], context?: string): void {
    categories.forEach(category => {
      this.track({
        userId,
        action: 'revoked',
        category,
        context
      });
    });
  }

  /**
   * Track consent check
   */
  static trackCheck(userId: string, category: ConsentCategory, context?: string): void {
    this.track({
      userId,
      action: 'checked',
      category,
      context
    });
  }

  /**
   * Track consent failure
   */
  static trackFailure(userId: string, error: string, context?: string): void {
    this.track({
      userId,
      action: 'failed',
      error,
      context
    });
  }

  /**
   * Get analytics summary
   */
  static getAnalytics(): ConsentAnalytics {
    const granted = this.metrics.filter(m => m.action === 'granted');
    const total = new Set(this.metrics.map(m => m.userId)).size;
    const acceptanceRate = total > 0 ? (granted.length / total) * 100 : 0;

    const timesToConsent = this.metrics
      .filter(m => m.action === 'granted' && m.timeToDecision)
      .map(m => m.timeToDecision!);
    
    const averageTimeToConsent = timesToConsent.length > 0
      ? timesToConsent.reduce((a, b) => a + b, 0) / timesToConsent.length
      : 0;

    // Calculate category statistics
    const categoryGrants = new Map<ConsentCategory, number>();
    granted.forEach(m => {
      if (m.category) {
        categoryGrants.set(m.category, (categoryGrants.get(m.category) || 0) + 1);
      }
    });

    let mostGrantedCategory: ConsentCategory | null = null;
    let leastGrantedCategory: ConsentCategory | null = null;
    let maxGrants = 0;
    let minGrants = Infinity;

    categoryGrants.forEach((count, category) => {
      if (count > maxGrants) {
        maxGrants = count;
        mostGrantedCategory = category;
      }
      if (count < minGrants) {
        minGrants = count;
        leastGrantedCategory = category;
      }
    });

    // Calculate dropoff rate
    const started = this.sessionStartTimes.size;
    const completed = granted.filter((m, i, arr) => 
      arr.findIndex(x => x.userId === m.userId) === i
    ).length;
    const dropoffRate = started > 0 ? ((started - completed) / started) * 100 : 0;

    return {
      acceptanceRate,
      averageTimeToConsent,
      dropoffRate,
      mostGrantedCategory,
      leastGrantedCategory
    };
  }

  /**
   * Send metrics to analytics service (placeholder for production)
   */
  private static async sendToAnalytics(metrics: ConsentMetrics): Promise<void> {
    // In production, this would send to your analytics service
    // For now, just log that we would send it
    if (process.env.NODE_ENV === 'production') {
      try {
        // Example: await fetch('/api/analytics/consent', { method: 'POST', body: JSON.stringify(metrics) });
        console.log('[Consent Analytics] Would send to analytics:', metrics);
      } catch (error) {
        console.error('[Consent Analytics] Failed to send analytics:', error);
      }
    }
  }

  /**
   * Clear all metrics (for testing)
   */
  static clearMetrics(): void {
    this.metrics = [];
    this.sessionStartTimes.clear();
  }

  /**
   * Export metrics for analysis
   */
  static exportMetrics(): ConsentMetrics[] {
    return [...this.metrics];
  }
}
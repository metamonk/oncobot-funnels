/**
 * Unified Analytics Client
 * 
 * Core analytics orchestrator that manages all providers and events
 */

import {
  AnalyticsEvent,
  AnalyticsProvider,
  AnalyticsConfig,
  UserTraits,
  SessionData,
  Middleware,
  ErrorHandler,
  EventCategory,
} from './types';
import { safeExecute, SafeStorage, getCurrentTimestamp, getAttributionSource } from './utils';
import { EventRegistry } from './event-registry';

export class AnalyticsClient {
  private providers: Map<string, AnalyticsProvider> = new Map();
  private middlewares: Middleware[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private session: SessionData | null = null;
  private config: AnalyticsConfig;
  private eventRegistry: EventRegistry;
  private isInitialized = false;
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.eventRegistry = new EventRegistry();
    this.initialize();
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  private async initialize() {
    // Initialize session
    this.initializeSession();
    
    // Set up event batching if configured
    if (this.config.flushInterval) {
      this.startBatchTimer();
    }
    
    // Mark as initialized
    this.isInitialized = true;
    
    // Process any queued events
    await this.processEventQueue();
  }

  private initializeSession() {
    const existingSession = SafeStorage.getJSON<SessionData>('analytics_session');
    
    if (existingSession && this.isSessionValid(existingSession)) {
      this.session = existingSession;
      this.session.lastActivity = getCurrentTimestamp();
    } else {
      this.session = this.createNewSession();
    }
    
    this.persistSession();
  }

  private createNewSession(): SessionData {
    return {
      id: this.generateSessionId(),
      startTime: getCurrentTimestamp(),
      lastActivity: getCurrentTimestamp(),
      pageViews: 0,
      events: [],
      source: getAttributionSource(),
      touchpoints: [],
      conversions: [],
      totalValue: 0,
    };
  }

  private isSessionValid(session: SessionData): boolean {
    const timeout = this.config.sessionTimeout || 30 * 60 * 1000; // 30 minutes default
    return getCurrentTimestamp() - session.lastActivity < timeout;
  }

  private persistSession() {
    if (this.session) {
      SafeStorage.setJSON('analytics_session', this.session);
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================================================
  // Provider Management
  // ============================================================================

  public addProvider(provider: AnalyticsProvider) {
    this.providers.set(provider.name, provider);
    
    // Initialize session on provider if supported
    if (provider.startSession && this.session) {
      safeExecute(() => provider.startSession!(this.session!));
    }
  }

  public removeProvider(name: string) {
    const provider = this.providers.get(name);
    if (provider?.endSession) {
      safeExecute(() => provider.endSession!());
    }
    this.providers.delete(name);
  }

  public getProvider(name: string): AnalyticsProvider | undefined {
    return this.providers.get(name);
  }

  // ============================================================================
  // Event Tracking
  // ============================================================================

  public async track(
    eventName: string,
    properties?: Record<string, any>,
    options?: {
      category?: EventCategory;
      revenue?: { currency: string; amount: number };
      immediate?: boolean;
    }
  ): Promise<void> {
    const event: AnalyticsEvent = {
      name: eventName,
      category: options?.category || EventCategory.ENGAGEMENT,
      properties: this.enrichProperties(properties),
      timestamp: getCurrentTimestamp(),
      sessionId: this.session?.id,
      revenue: options?.revenue,
    };
    
    // Validate event if schema exists
    const validation = this.eventRegistry.validate(event);
    if (!validation.valid && this.config.debug) {
      console.warn(`Event validation failed: ${eventName}`, validation.errors);
    }
    
    // Update session
    if (this.session) {
      this.session.lastActivity = getCurrentTimestamp();
      this.session.events.push(eventName);
      if (options?.revenue) {
        this.session.totalValue += options.revenue.amount;
      }
      this.persistSession();
    }
    
    // Process through middleware
    await this.processMiddleware(event);
    
    // Send immediately or queue
    if (options?.immediate || !this.config.batchSize) {
      await this.sendEvent(event);
    } else {
      this.queueEvent(event);
    }
  }

  private enrichProperties(properties?: Record<string, any>): Record<string, any> {
    return {
      ...properties,
      session_id: this.session?.id,
      session_duration: this.session ? getCurrentTimestamp() - this.session.startTime : 0,
      page_url: typeof window !== 'undefined' ? window.location.href : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    };
  }

  private async processMiddleware(event: AnalyticsEvent): Promise<void> {
    let index = 0;
    
    const next = async (): Promise<void> => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        await middleware(event, next);
      }
    };
    
    await next();
  }

  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    const promises = Array.from(this.providers.values())
      .filter(provider => provider.isReady)
      .map(provider => 
        safeExecute(
          () => provider.track(event),
          `Failed to track event ${event.name} with provider ${provider.name}`
        )
      );
    
    await Promise.all(promises);
  }

  private queueEvent(event: AnalyticsEvent) {
    this.eventQueue.push(event);
    
    if (this.config.batchSize && this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  private async processEventQueue(): Promise<void> {
    if (!this.isInitialized || this.eventQueue.length === 0) return;
    
    const events = [...this.eventQueue];
    this.eventQueue = [];
    
    for (const event of events) {
      await this.sendEvent(event);
    }
  }

  private startBatchTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval!);
  }

  // ============================================================================
  // User Management
  // ============================================================================

  public async identify(userId: string, traits?: UserTraits): Promise<void> {
    const promises = Array.from(this.providers.values())
      .filter(provider => provider.isReady)
      .map(provider => 
        safeExecute(
          () => provider.identify(userId, traits),
          `Failed to identify user with provider ${provider.name}`
        )
      );
    
    await Promise.all(promises);
  }

  public async setUserProperties(properties: Record<string, any>): Promise<void> {
    const promises = Array.from(this.providers.values())
      .filter(provider => provider.isReady)
      .map(provider => 
        safeExecute(
          () => provider.setUserProperties(properties),
          `Failed to set user properties with provider ${provider.name}`
        )
      );
    
    await Promise.all(promises);
  }

  public async reset(): Promise<void> {
    // Clear session
    this.session = this.createNewSession();
    this.persistSession();
    
    // Reset all providers
    const promises = Array.from(this.providers.values())
      .map(provider => 
        safeExecute(
          () => provider.reset(),
          `Failed to reset provider ${provider.name}`
        )
      );
    
    await Promise.all(promises);
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  public async flush(): Promise<void> {
    await this.processEventQueue();
    
    // Flush all providers that support it
    const promises = Array.from(this.providers.values())
      .filter(provider => provider.flush)
      .map(provider => 
        safeExecute(
          () => provider.flush!(),
          `Failed to flush provider ${provider.name}`
        )
      );
    
    await Promise.all(promises);
  }

  public addMiddleware(middleware: Middleware) {
    this.middlewares.push(middleware);
  }

  public addErrorHandler(handler: ErrorHandler) {
    this.errorHandlers.push(handler);
  }

  public getSession(): SessionData | null {
    return this.session;
  }

  public getConfig(): AnalyticsConfig {
    return this.config;
  }

  public destroy() {
    // Stop batch timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // End sessions on all providers
    Array.from(this.providers.values()).forEach(provider => {
      if (provider.endSession) {
        safeExecute(() => provider.endSession!());
      }
    });
    
    // Clear providers
    this.providers.clear();
    
    // Clear session
    this.session = null;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let analyticsInstance: AnalyticsClient | null = null;

export function getAnalytics(config?: AnalyticsConfig): AnalyticsClient {
  if (!analyticsInstance && config) {
    analyticsInstance = new AnalyticsClient(config);
  }
  
  if (!analyticsInstance) {
    throw new Error('Analytics not initialized. Please provide config on first call.');
  }
  
  return analyticsInstance;
}

export function resetAnalytics() {
  if (analyticsInstance) {
    analyticsInstance.destroy();
    analyticsInstance = null;
  }
}
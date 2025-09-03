/**
 * Universal Consent Management Service
 * 
 * Progressive consent collection system that:
 * - Collects consent at the moment of need
 * - Stores consent preferences in database
 * - Provides simple management interface
 * - Ensures business model viability while respecting user privacy
 */

import { db } from '@/lib/db';
import { userConsent } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Check if we're on the server or client
const isServer = typeof window === 'undefined';

export type ConsentCategory = 
  | 'eligibility_checks'    // Core: Required for using OncoBot
  | 'trial_matching'        // Core: Required for matching with trials
  | 'contact_sharing'       // Core: Share contact with trial sites
  | 'data_sharing'         // Core: Share health data with partners
  | 'marketing'            // Optional: Marketing communications
  | 'analytics'            // Optional: Usage analytics
  | 'research'             // Optional: Aggregated research

export interface ConsentStatus {
  category: ConsentCategory;
  consented: boolean;
  consentedAt: Date | null;
  required: boolean;
  description: string;
}

export interface ConsentUpdate {
  category: ConsentCategory;
  consented: boolean;
}

/**
 * Core consent categories required for OncoBot functionality
 * User must accept all core consents to use the platform
 */
const CORE_CONSENTS: ConsentCategory[] = [
  'eligibility_checks',
  'trial_matching', 
  'contact_sharing',
  'data_sharing'
];

/**
 * Optional consent categories that enhance user experience
 * User can opt in/out without affecting core functionality
 */
const OPTIONAL_CONSENTS: ConsentCategory[] = [
  'marketing',
  'analytics',
  'research'
];

/**
 * Consent descriptions for user interface
 */
const CONSENT_DESCRIPTIONS: Record<ConsentCategory, string> = {
  eligibility_checks: 'Use your health information to check trial eligibility',
  trial_matching: 'Match you with relevant clinical trials based on your profile',
  contact_sharing: 'Share your contact information with trial sites and sponsors',
  data_sharing: 'Share your health data with research partners for matching',
  marketing: 'Send you updates about new trials and OncoBot features',
  analytics: 'Collect usage data to improve our service',
  research: 'Use anonymized data for cancer research insights'
};

export class ConsentService {
  /**
   * Get default consent structure (all false)
   */
  private static getDefaultConsents(): ConsentStatus[] {
    return [...CORE_CONSENTS, ...OPTIONAL_CONSENTS].map(category => ({
      category,
      consented: false,
      consentedAt: null,
      required: CORE_CONSENTS.includes(category),
      description: CONSENT_DESCRIPTIONS[category]
    }));
  }
  /**
   * Get all consent statuses for a user
   */
  static async getUserConsents(userId: string): Promise<ConsentStatus[]> {
    // Client-side: Call API
    if (!isServer) {
      try {
        const response = await fetch('/api/consent');
        if (!response.ok) throw new Error('Failed to fetch consents');
        const data = await response.json();
        return data.consents;
      } catch (error) {
        console.error('Error fetching consents:', error);
        return this.getDefaultConsents();
      }
    }
    
    // Server-side: Direct database access
    try {
      // Get existing consents from database
      const existingConsents = await db
        .select()
        .from(userConsent)
        .where(eq(userConsent.userId, userId));

      // Create a map of existing consents
      const consentMap = new Map(
        existingConsents.map(c => [c.category as ConsentCategory, c])
      );

      // Build complete consent status list
      const allCategories = [...CORE_CONSENTS, ...OPTIONAL_CONSENTS];
      
      return allCategories.map(category => ({
        category,
        consented: consentMap.get(category)?.consented ?? false,
        consentedAt: consentMap.get(category)?.consentedAt ?? null,
        required: CORE_CONSENTS.includes(category),
        description: CONSENT_DESCRIPTIONS[category]
      }));
    } catch (error) {
      console.error('Error fetching user consents:', error);
      // Return default state - no consents given
      return [...CORE_CONSENTS, ...OPTIONAL_CONSENTS].map(category => ({
        category,
        consented: false,
        consentedAt: null,
        required: CORE_CONSENTS.includes(category),
        description: CONSENT_DESCRIPTIONS[category]
      }));
    }
  }

  /**
   * Check if user has all required core consents
   */
  static async hasRequiredConsents(userId: string): Promise<boolean> {
    const consents = await this.getUserConsents(userId);
    return CORE_CONSENTS.every(category => {
      const consent = consents.find(c => c.category === category);
      return consent?.consented === true;
    });
  }

  /**
   * Check if user has specific consent
   */
  static async hasConsent(
    userId: string, 
    category: ConsentCategory
  ): Promise<boolean> {
    // Client-side: Get all consents and check
    if (!isServer) {
      try {
        const consents = await this.getUserConsents(userId);
        const consent = consents.find(c => c.category === category);
        return consent?.consented ?? false;
      } catch (error) {
        console.error('Error checking consent:', error);
        return false;
      }
    }
    
    // Server-side: Direct database query
    try {
      const consent = await db
        .select()
        .from(userConsent)
        .where(and(
          eq(userConsent.userId, userId),
          eq(userConsent.category, category)
        ))
        .limit(1);
      
      return consent[0]?.consented ?? false;
    } catch (error) {
      console.error('Error checking consent:', error);
      return false;
    }
  }

  /**
   * Update user consent for one or more categories
   */
  static async updateConsents(
    userId: string,
    updates: ConsentUpdate[]
  ): Promise<void> {
    // Client-side: Call API
    if (!isServer) {
      const response = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update consent preferences');
      }
      return;
    }
    
    // Server-side: Direct database access
    try {
      for (const update of updates) {
        // Check if consent record exists
        const existing = await db
          .select()
          .from(userConsent)
          .where(and(
            eq(userConsent.userId, userId),
            eq(userConsent.category, update.category)
          ))
          .limit(1);

        if (existing.length > 0) {
          // Update existing consent
          await db
            .update(userConsent)
            .set({
              consented: update.consented,
              consentedAt: update.consented ? new Date() : null,
              updatedAt: new Date()
            })
            .where(and(
              eq(userConsent.userId, userId),
              eq(userConsent.category, update.category)
            ));
        } else {
          // Create new consent record
          await db.insert(userConsent).values({
            userId,
            category: update.category,
            consented: update.consented,
            consentedAt: update.consented ? new Date() : null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error updating consents:', error);
      throw new Error('Failed to update consent preferences');
    }
  }

  /**
   * Grant all core consents (used during initial onboarding)
   */
  static async grantCoreConsents(userId: string): Promise<void> {
    // Client-side: Call API
    if (!isServer) {
      const response = await fetch('/api/consent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'grant_core' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to grant core consents');
      }
      return;
    }
    
    // Server-side: Use existing method
    const coreUpdates: ConsentUpdate[] = CORE_CONSENTS.map(category => ({
      category,
      consented: true
    }));
    
    await this.updateConsents(userId, coreUpdates);
  }

  /**
   * Revoke all consents (user opts out completely)
   */
  static async revokeAllConsents(userId: string): Promise<void> {
    const allCategories = [...CORE_CONSENTS, ...OPTIONAL_CONSENTS];
    const revokeUpdates: ConsentUpdate[] = allCategories.map(category => ({
      category,
      consented: false
    }));
    
    await this.updateConsents(userId, revokeUpdates);
  }

  /**
   * Get consent requirements for specific action
   */
  static getRequiredConsentsForAction(action: string): ConsentCategory[] {
    switch (action) {
      case 'create_health_profile':
      case 'update_health_profile':
        return ['eligibility_checks', 'trial_matching'];
      
      case 'check_eligibility':
        return ['eligibility_checks', 'trial_matching', 'data_sharing'];
      
      case 'contact_trial_site':
        return ['contact_sharing'];
      
      case 'save_trial':
        return ['trial_matching'];
      
      default:
        return [];
    }
  }
}
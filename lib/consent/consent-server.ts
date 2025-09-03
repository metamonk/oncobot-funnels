/**
 * Server-side Consent Service
 * 
 * Handles database operations for consent management
 * Only for use in server components and API routes
 */

import { db } from '@/lib/db';
import { userConsent } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { ConsentCategory, ConsentStatus, ConsentUpdate } from './consent-client';

/**
 * Core consent categories required for OncoBot functionality
 */
const CORE_CONSENTS: ConsentCategory[] = [
  'eligibility_checks',
  'trial_matching', 
  'contact_sharing',
  'data_sharing'
];

/**
 * Optional consent categories that enhance user experience
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

export class ConsentServiceServer {
  /**
   * Get all consent statuses for a user
   */
  static async getUserConsents(userId: string): Promise<ConsentStatus[]> {
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
}
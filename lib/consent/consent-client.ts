/**
 * Client-side Consent Service
 * 
 * Handles all consent operations through API calls
 * Safe for use in client components
 */

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
   * Check if user has specific consent with retry logic
   */
  static async hasConsent(
    userId: string, 
    category: ConsentCategory,
    options: { retries?: number; fallbackToRequired?: boolean } = {}
  ): Promise<boolean> {
    const { retries = 2, fallbackToRequired = true } = options;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const consents = await this.getUserConsents(userId);
        const consent = consents.find(c => c.category === category);
        return consent?.consented ?? false;
      } catch (error) {
        console.error(`Error checking consent (attempt ${attempt + 1}/${retries + 1}):`, error);
        
        // If this is the last attempt
        if (attempt === retries) {
          // For safety, require consent if we can't verify (GDPR compliance)
          if (fallbackToRequired && CORE_CONSENTS.includes(category)) {
            console.warn(`Falling back to require consent for ${category} due to error`);
            return false; // Safer to require consent if we can't verify
          }
          return false;
        }
        
        // Exponential backoff before retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }
    
    return false;
  }

  /**
   * Update user consent for one or more categories
   */
  static async updateConsents(
    userId: string,
    updates: ConsentUpdate[]
  ): Promise<void> {
    const response = await fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update consent preferences');
    }
  }

  /**
   * Grant all core consents (used during initial onboarding) with retry logic
   */
  static async grantCoreConsents(userId: string): Promise<void> {
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch('/api/consent', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'grant_core' })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to grant core consents: ${response.statusText}`);
        }
        
        return; // Success
      } catch (error) {
        lastError = error as Error;
        console.error(`Failed to grant core consents (attempt ${attempt + 1}/${maxRetries}):`, error);
        
        // If network error, wait and retry
        if (error instanceof Error && 
            (error.message.includes('network') || 
             error.message.includes('fetch') ||
             error.message.includes('Failed to fetch'))) {
          // Exponential backoff: 500ms, 1s, 2s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
          continue;
        }
        
        // If server error (5xx), retry
        if (error instanceof Error && error.message.includes('500')) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
          continue;
        }
        
        // If other error (4xx, etc), don't retry
        throw error;
      }
    }
    
    // All retries failed
    throw new Error(`Failed to grant core consents after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Revoke all consents (user opts out completely)
   */
  static async revokeAllConsents(userId: string): Promise<void> {
    const response = await fetch('/api/consent', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'revoke_all' })
    });
    
    if (!response.ok) {
      throw new Error('Failed to revoke consents');
    }
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
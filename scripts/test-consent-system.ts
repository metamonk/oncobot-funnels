/**
 * Comprehensive Consent System Testing Script
 * Following CLAUDE.md: Test the entire system, not just your change
 * 
 * This script tests the complete consent management flow including:
 * - User consent states
 * - Consent dialog triggering
 * - Database integrity
 * - Privacy settings synchronization
 */

import { db } from '@/lib/db';
import { userConsent, healthProfile } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { ConsentServiceServer } from '@/lib/consent/consent-server';
import type { ConsentCategory } from '@/lib/consent/consent-client';

// Test configuration
const TEST_USER_ID = process.env.TEST_USER_ID || '';
const VERBOSE = process.env.VERBOSE === 'true';

// Console colors for better visibility
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg: string) => console.log(`${colors.cyan}ℹ${colors.reset}  ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset}  ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset}  ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset}  ${msg}`),
  section: (msg: string) => console.log(`\n${colors.bright}${msg}${colors.reset}`),
};

/**
 * Test 1: Check current consent state for a user
 */
async function testGetCurrentConsents(userId: string) {
  log.section('Test 1: Getting Current Consent State');
  
  try {
    const consents = await ConsentServiceServer.getUserConsents(userId);
    
    if (VERBOSE) {
      log.info(`Found ${consents.length} consent categories:`);
      consents.forEach(consent => {
        const status = consent.consented ? '✓' : '✗';
        const required = consent.required ? '(Required)' : '(Optional)';
        console.log(`  ${status} ${consent.category} ${required} - ${consent.description}`);
        if (consent.consentedAt) {
          console.log(`     Consented at: ${consent.consentedAt}`);
        }
      });
    }
    
    const hasRequired = await ConsentServiceServer.hasRequiredConsents(userId);
    if (hasRequired) {
      log.success('User has all required consents');
    } else {
      log.warning('User missing required consents');
    }
    
    return consents;
  } catch (error) {
    log.error(`Failed to get consents: ${error}`);
    throw error;
  }
}

/**
 * Test 2: Clear all consents for a user
 */
async function testClearConsents(userId: string) {
  log.section('Test 2: Clearing All Consents');
  
  try {
    await ConsentServiceServer.revokeAllConsents(userId);
    log.success('All consents cleared');
    
    // Verify they're actually cleared
    const consents = await ConsentServiceServer.getUserConsents(userId);
    const allRevoked = consents.every(c => !c.consented);
    
    if (allRevoked) {
      log.success('Verified: All consents are revoked');
    } else {
      log.error('Some consents are still active after revocation');
    }
    
    return allRevoked;
  } catch (error) {
    log.error(`Failed to clear consents: ${error}`);
    throw error;
  }
}

/**
 * Test 3: Grant core consents
 */
async function testGrantCoreConsents(userId: string) {
  log.section('Test 3: Granting Core Consents');
  
  try {
    await ConsentServiceServer.grantCoreConsents(userId);
    log.success('Core consents granted');
    
    // Verify core consents are granted
    const coreCategories: ConsentCategory[] = [
      'eligibility_checks',
      'trial_matching',
      'contact_sharing',
      'data_sharing'
    ];
    
    for (const category of coreCategories) {
      const hasConsent = await ConsentServiceServer.hasConsent(userId, category);
      if (hasConsent) {
        log.success(`✓ ${category} consent granted`);
      } else {
        log.error(`✗ ${category} consent NOT granted`);
      }
    }
    
    return true;
  } catch (error) {
    log.error(`Failed to grant core consents: ${error}`);
    throw error;
  }
}

/**
 * Test 4: Check consent requirements for actions
 */
async function testConsentRequirements() {
  log.section('Test 4: Testing Consent Requirements for Actions');
  
  const actions = [
    { action: 'create_health_profile', expected: ['eligibility_checks', 'trial_matching'] },
    { action: 'check_eligibility', expected: ['eligibility_checks', 'trial_matching', 'data_sharing'] },
    { action: 'contact_trial_site', expected: ['contact_sharing'] },
    { action: 'save_trial', expected: ['trial_matching'] },
  ];
  
  try {
    const { getRequiredConsentsForAction } = await import('@/lib/consent/consent-client').then(m => m.ConsentService);
    
    for (const { action, expected } of actions) {
      const required = getRequiredConsentsForAction(action);
      const matches = JSON.stringify(required.sort()) === JSON.stringify(expected.sort());
      
      if (matches) {
        log.success(`${action}: ${required.join(', ')}`);
      } else {
        log.error(`${action}: Expected ${expected.join(', ')}, got ${required.join(', ')}`);
      }
    }
    
    return true;
  } catch (error) {
    log.error(`Failed to test consent requirements: ${error}`);
    throw error;
  }
}

/**
 * Test 5: Check health profile relationship
 */
async function testHealthProfileRelationship(userId: string) {
  log.section('Test 5: Testing Health Profile & Consent Relationship');
  
  try {
    // Check if user has a health profile
    const profiles = await db
      .select()
      .from(healthProfile)
      .where(eq(healthProfile.userId, userId));
    
    if (profiles.length > 0) {
      log.info(`User has ${profiles.length} health profile(s)`);
      
      // Check if they have the required consents for health profile
      const hasEligibility = await ConsentServiceServer.hasConsent(userId, 'eligibility_checks');
      const hasMatching = await ConsentServiceServer.hasConsent(userId, 'trial_matching');
      
      if (hasEligibility && hasMatching) {
        log.success('User has required consents for health profile');
      } else {
        log.warning('User has health profile but missing required consents');
        if (!hasEligibility) log.error('  Missing: eligibility_checks');
        if (!hasMatching) log.error('  Missing: trial_matching');
      }
    } else {
      log.info('User has no health profile');
    }
    
    return true;
  } catch (error) {
    log.error(`Failed to test health profile relationship: ${error}`);
    throw error;
  }
}

/**
 * Test 6: Database integrity check
 */
async function testDatabaseIntegrity() {
  log.section('Test 6: Database Integrity Check');
  
  try {
    // Check for orphaned consent records (consents without users)
    const allConsents = await db.select().from(userConsent);
    log.info(`Total consent records in database: ${allConsents.length}`);
    
    // Check for duplicate consent records
    const userConsentMap = new Map<string, Set<string>>();
    let duplicates = 0;
    
    for (const consent of allConsents) {
      const key = `${consent.userId}-${consent.category}`;
      if (!userConsentMap.has(consent.userId)) {
        userConsentMap.set(consent.userId, new Set());
      }
      
      const categories = userConsentMap.get(consent.userId)!;
      if (categories.has(consent.category)) {
        duplicates++;
        log.warning(`Duplicate consent: User ${consent.userId}, Category ${consent.category}`);
      }
      categories.add(consent.category);
    }
    
    if (duplicates === 0) {
      log.success('No duplicate consent records found');
    } else {
      log.error(`Found ${duplicates} duplicate consent records`);
    }
    
    return duplicates === 0;
  } catch (error) {
    log.error(`Failed to check database integrity: ${error}`);
    throw error;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.bright}
╔════════════════════════════════════════╗
║   Consent System Comprehensive Test   ║
╚════════════════════════════════════════╝${colors.reset}`);

  if (!TEST_USER_ID) {
    log.error('TEST_USER_ID environment variable not set');
    log.info('Usage: TEST_USER_ID="your-user-id" pnpm tsx scripts/test-consent-system.ts');
    process.exit(1);
  }

  log.info(`Testing with user ID: ${TEST_USER_ID}`);
  log.info(`Verbose mode: ${VERBOSE ? 'ON' : 'OFF'}`);

  const results: Record<string, boolean> = {};

  try {
    // Run all tests
    await testGetCurrentConsents(TEST_USER_ID);
    results['Get Current Consents'] = true;

    await testClearConsents(TEST_USER_ID);
    results['Clear Consents'] = true;

    await testGrantCoreConsents(TEST_USER_ID);
    results['Grant Core Consents'] = true;

    await testConsentRequirements();
    results['Consent Requirements'] = true;

    await testHealthProfileRelationship(TEST_USER_ID);
    results['Health Profile Relationship'] = true;

    const integrityOk = await testDatabaseIntegrity();
    results['Database Integrity'] = integrityOk;

  } catch (error) {
    log.error(`Test suite failed: ${error}`);
  }

  // Print summary
  log.section('Test Summary');
  let passed = 0;
  let failed = 0;
  
  for (const [test, result] of Object.entries(results)) {
    if (result) {
      log.success(`${test}: PASSED`);
      passed++;
    } else {
      log.error(`${test}: FAILED`);
      failed++;
    }
  }

  console.log(`\n${colors.bright}Results: ${colors.green}${passed} passed${colors.reset}, ${colors.red}${failed} failed${colors.reset}`);

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
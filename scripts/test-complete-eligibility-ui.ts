#!/usr/bin/env tsx
/**
 * Test script to verify the complete eligibility checker UI flow
 * Run with: pnpm tsx scripts/test-complete-eligibility-ui.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, desc } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';
import { generateId } from 'ai';
import { eligibilityCheck, user, savedTrials } from '../lib/db/schema';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function testEligibilityUI() {
  console.log('🧪 Testing Complete Eligibility Checker UI Flow\n');
  console.log('=' .repeat(60));
  
  const queryClient = postgres(DATABASE_URL);
  const db = drizzle(queryClient);
  
  try {
    // Step 1: Find or create a test user
    console.log('\n📋 Step 1: Setting up test user...');
    const testEmail = 'eligibility-test@example.com';
    let testUser = await db.select().from(user).where(eq(user.email, testEmail)).limit(1);
    
    let userId: string;
    if (testUser.length === 0) {
      console.log('   Creating new test user...');
      userId = generateId();
      await db.insert(user).values({
        id: userId,
        name: 'Eligibility Test User',
        email: testEmail,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('   ✅ Test user created');
    } else {
      userId = testUser[0].id;
      console.log('   ✅ Using existing test user');
    }
    
    // Step 2: Create test eligibility checks
    console.log('\n📋 Step 2: Creating test eligibility checks...');
    
    const trials = [
      { nctId: 'NCT03785249', title: 'Study of Nivolumab in Stage IV NSCLC', status: 'LIKELY_ELIGIBLE', score: 85 },
      { nctId: 'NCT04123456', title: 'Pembrolizumab for Advanced Lung Cancer', status: 'POSSIBLY_ELIGIBLE', score: 65 },
      { nctId: 'NCT04789012', title: 'Chemotherapy in Small Cell Lung Cancer', status: 'INELIGIBLE', score: 20 },
    ];
    
    for (const trial of trials) {
      const checkId = generateId();
      const shareToken = generateId();
      
      console.log(`   Creating check for ${trial.nctId}...`);
      
      await db.insert(eligibilityCheck).values({
        id: checkId,
        userId,
        trialId: trial.nctId,
        nctId: trial.nctId,
        trialTitle: trial.title,
        shareToken,
        status: 'completed',
        eligibilityStatus: trial.status as any,
        eligibilityScore: trial.score,
        confidence: trial.score > 70 ? 'high' : trial.score > 40 ? 'medium' : 'low',
        visibility: 'private',
        emailRequested: false,
        consentGiven: true,
        disclaimerAccepted: true,
        dataRetentionConsent: true,
        completedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date in last week
        duration: Math.floor(Math.random() * 300) + 60, // 1-6 minutes
        assessment: {
          overallEligibility: trial.status,
          confidence: trial.score / 100,
          summary: `Based on your health profile, you appear to be ${trial.status.toLowerCase().replace('_', ' ')} for this trial.`,
          qualifications: trial.score > 50 ? ['Stage IV NSCLC', 'Age within range'] : [],
          concerns: trial.score < 50 ? ['Prior therapy requirements not met'] : [],
          uncertainties: ['Performance status needs verification'],
        },
        matchedCriteria: trial.score > 50 ? ['Cancer type matches', 'Stage matches'] : [],
        unmatchedCriteria: trial.score < 50 ? ['Prior therapy requirements'] : [],
        uncertainCriteria: ['Performance status'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log(`   ✅ Created eligibility check for ${trial.nctId}`);
    }
    
    // Step 3: Create saved trials with eligibility references
    console.log('\n📋 Step 3: Creating saved trials with eligibility links...');
    
    // Get the eligibility checks we just created
    const checks = await db
      .select()
      .from(eligibilityCheck)
      .where(eq(eligibilityCheck.userId, userId))
      .orderBy(desc(eligibilityCheck.createdAt))
      .limit(3);
    
    for (const check of checks) {
      const savedTrialId = generateId();
      
      console.log(`   Creating saved trial for ${check.nctId}...`);
      
      await db.insert(savedTrials).values({
        id: savedTrialId,
        userId,
        nctId: check.nctId,
        title: check.trialTitle,
        notes: `This trial looks promising based on the eligibility check.`,
        tags: ['immunotherapy', 'local', 'recruiting'],
        trialSnapshot: {
          identificationModule: {
            nctId: check.nctId,
            briefTitle: check.trialTitle,
          },
          statusModule: {
            overallStatus: 'RECRUITING',
          },
        },
        lastEligibilityCheckId: check.id,
        eligibilityCheckCompleted: true,
        lastUpdated: new Date(),
        savedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last month
      });
      
      console.log(`   ✅ Created saved trial for ${check.nctId} with eligibility link`);
    }
    
    // Step 4: Verify the data
    console.log('\n📋 Step 4: Verifying test data...');
    
    // Check eligibility history
    const userChecks = await db
      .select()
      .from(eligibilityCheck)
      .where(eq(eligibilityCheck.userId, userId));
    
    console.log(`   ✅ Found ${userChecks.length} eligibility checks for test user`);
    
    // Check saved trials
    const userSavedTrials = await db
      .select()
      .from(savedTrials)
      .where(eq(savedTrials.userId, userId));
    
    console.log(`   ✅ Found ${userSavedTrials.length} saved trials for test user`);
    
    const trialsWithEligibility = userSavedTrials.filter(t => t.eligibilityCheckCompleted);
    console.log(`   ✅ ${trialsWithEligibility.length} saved trials have completed eligibility checks`);
    
    // Step 5: Display test summary
    console.log('\n' + '=' .repeat(60));
    console.log('✅ TEST DATA CREATED SUCCESSFULLY!\n');
    console.log('📌 What to test in the UI:\n');
    console.log('1. Open Settings Dialog');
    console.log('2. Go to "Eligibility" tab - should see 3 checks with different statuses');
    console.log('3. Go to "Saved Trials" tab - should see trials with eligibility badges');
    console.log('4. Click "View Results" links to see full eligibility pages');
    console.log('5. Try the eligibility checker modal from a saved trial without a check');
    console.log('6. Verify email CTA appears in results');
    console.log('7. Test the sharing functionality on eligibility result pages');
    console.log('\n📧 Test User Credentials:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   User ID: ${userId}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
  
  process.exit(0);
}

testEligibilityUI();
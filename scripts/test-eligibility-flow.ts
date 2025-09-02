#!/usr/bin/env tsx

import { config } from 'dotenv';
config();

import { db } from '../lib/db';
import { eligibilityCheck } from '../lib/db/schema';
import { 
  createEligibilityCheck, 
  updateEligibilityCheck,
  getEligibilityCheckById 
} from '../lib/db/eligibility-queries';

async function testEligibilityFlow() {
  console.log('🧪 Testing Eligibility Check Flow\n');
  
  try {
    // Test creating an eligibility check
    console.log('1. Creating eligibility check...');
    const check = await createEligibilityCheck({
      userId: 'test-user-123',
      nctId: 'NCT05568550',
      trialId: 'NCT05568550',
      trialTitle: 'Test Trial for NSCLC with KRAS G12C',
      healthProfileId: undefined,
    });
    
    console.log('✅ Created check:', {
      id: check.id,
      status: check.status,
      shareToken: check.shareToken
    });
    
    // Test updating the check with results
    console.log('\n2. Updating with results...');
    const updated = await updateEligibilityCheck({
      id: check.id,
      eligibilityStatus: 'LIKELY_ELIGIBLE',
      eligibilityScore: 85,
      confidence: 'high',
      criteria: { test: 'criteria' },
      questions: [{ id: 'q1', question: 'Test question' }],
      responses: [{ questionId: 'q1', value: true }],
      assessment: { 
        overallEligibility: 'ELIGIBLE',
        confidence: 0.85,
        summary: 'Test assessment'
      },
      matchedCriteria: ['Age criteria met', 'Cancer type matches'],
      unmatchedCriteria: [],
      uncertainCriteria: ['Prior treatment history'],
      completedAt: new Date(),
      duration: 120,
    });
    
    console.log('✅ Updated check:', {
      eligibilityStatus: updated.eligibilityStatus,
      eligibilityScore: updated.eligibilityScore,
      confidence: updated.confidence
    });
    
    // Test retrieving the check
    console.log('\n3. Retrieving check by ID...');
    const retrieved = await getEligibilityCheckById(check.id);
    console.log('✅ Retrieved check:', {
      id: retrieved?.id,
      status: retrieved?.status,
      eligibilityStatus: retrieved?.eligibilityStatus
    });
    
    // Clean up
    console.log('\n4. Cleaning up test data...');
    await db.delete(eligibilityCheck).where({ id: check.id } as any);
    console.log('✅ Test data cleaned up');
    
    console.log('\n✨ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

testEligibilityFlow();
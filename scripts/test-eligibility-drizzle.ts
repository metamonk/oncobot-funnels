import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';
import { generateId } from 'ai';
import { eligibilityCheck, user } from '../lib/db/schema';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

async function testDrizzleUpdate() {
  console.log('Testing Drizzle ORM update with dates...\n');
  
  const queryClient = postgres(DATABASE_URL);
  const db = drizzle(queryClient);
  
  try {
    // First, create a test user
    const userId = generateId();
    console.log('Creating test user...');
    await db.insert(user).values({
      id: userId,
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('✅ User created with ID:', userId);
    
    // Create an eligibility check
    const checkId = generateId();
    const shareToken = generateId();
    
    console.log('\nCreating eligibility check with Drizzle...');
    const [created] = await db.insert(eligibilityCheck).values({
      id: checkId,
      userId,
      trialId: 'NCT12345678',
      nctId: 'NCT12345678',
      trialTitle: 'Test Trial for Drizzle Update',
      shareToken,
      status: 'in_progress',
      visibility: 'private',
      emailRequested: false,
      consentGiven: false,
      disclaimerAccepted: false,
      dataRetentionConsent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    console.log('✅ Eligibility check created');
    
    // Now test updating it with dates
    console.log('\nTesting Drizzle update with Date objects...');
    const completedAt = new Date();
    
    const [updated] = await db
      .update(eligibilityCheck)
      .set({
        status: 'completed',
        eligibilityStatus: 'LIKELY_ELIGIBLE',
        eligibilityScore: 85,
        confidence: 'high',
        completedAt,
        duration: 120,
        updatedAt: new Date(),
      })
      .where(eq(eligibilityCheck.id, checkId))
      .returning();
    
    console.log('✅ Update successful!');
    console.log('  Status:', updated.status);
    console.log('  Eligibility Status:', updated.eligibilityStatus);
    console.log('  Score:', updated.eligibilityScore);
    console.log('  Completed At:', updated.completedAt);
    
    // Clean up
    console.log('\nCleaning up test data...');
    await db.delete(eligibilityCheck).where(eq(eligibilityCheck.id, checkId));
    await db.delete(user).where(eq(user.id, userId));
    console.log('✅ Cleanup successful');
    
    console.log('\n✅ All Drizzle tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
  
  process.exit(0);
}

testDrizzleUpdate();
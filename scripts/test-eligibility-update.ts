import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';
import { generateId } from 'ai';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

async function testEligibilityUpdate() {
  console.log('Testing eligibility check update flow...\n');
  
  const queryClient = postgres(DATABASE_URL);
  const db = drizzle(queryClient);
  
  try {
    // First, create a test user
    const userId = generateId();
    console.log('Creating test user...');
    await db.execute(sql`
      INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
      VALUES (${userId}, 'Test User', ${`test-${Date.now()}@example.com`}, false, NOW(), NOW())
    `);
    console.log('✅ User created with ID:', userId);
    
    // Create an eligibility check
    const checkId = generateId();
    const shareToken = generateId();
    
    console.log('\nCreating eligibility check...');
    await db.execute(sql`
      INSERT INTO eligibility_check (
        id, "userId", "trialId", "nctId", "trialTitle", "shareToken"
      ) VALUES (
        ${checkId}, 
        ${userId}, 
        'NCT12345678', 
        'NCT12345678', 
        'Test Trial for Update',
        ${shareToken}
      )
    `);
    console.log('✅ Eligibility check created with ID:', checkId);
    
    // Now test updating it with a date
    console.log('\nTesting update with date handling...');
    const completedAt = new Date();
    
    await db.execute(sql`
      UPDATE eligibility_check 
      SET 
        status = 'completed',
        "eligibilityStatus" = 'LIKELY_ELIGIBLE',
        "eligibilityScore" = 85,
        confidence = 'high',
        "completedAt" = ${completedAt.toISOString()},
        duration = 120,
        "updatedAt" = NOW()
      WHERE id = ${checkId}
    `);
    console.log('✅ Update successful with date:', completedAt.toISOString());
    
    // Verify the update
    const result = await db.execute(sql`
      SELECT id, status, "eligibilityStatus", "eligibilityScore", "completedAt"
      FROM eligibility_check 
      WHERE id = ${checkId}
    `);
    
    if (result.rows && result.rows.length > 0) {
      console.log('\n✅ Verification successful:');
      console.log('  Status:', result.rows[0].status);
      console.log('  Eligibility Status:', result.rows[0].eligibilityStatus);
      console.log('  Score:', result.rows[0].eligibilityScore);
      console.log('  Completed At:', result.rows[0].completedAt);
    }
    
    // Clean up
    console.log('\nCleaning up test data...');
    await db.execute(sql`DELETE FROM eligibility_check WHERE id = ${checkId}`);
    await db.execute(sql`DELETE FROM "user" WHERE id = ${userId}`);
    console.log('✅ Cleanup successful');
    
    console.log('\n✅ All tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
  
  process.exit(0);
}

testEligibilityUpdate();
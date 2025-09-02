import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { generateId } from 'ai';
import * as dotenv from 'dotenv';
import path from 'path';
import { eligibilityCheck } from '../lib/db/schema';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

async function testDirectInsert() {
  console.log('Testing direct database insert for eligibility check...\n');
  
  const queryClient = postgres(DATABASE_URL);
  const db = drizzle(queryClient);
  
  try {
    const id = generateId();
    const shareToken = generateId();
    
    const testData = {
      id,
      userId: 'test-user-123',
      nctId: 'NCT12345678',
      trialId: 'NCT12345678',
      trialTitle: 'Test Clinical Trial for NSCLC',
      healthProfileId: 'test-health-profile-456',
      shareToken,
      status: 'in_progress' as const,
      visibility: 'private' as const,
      emailRequested: false,
      consentGiven: false,
      disclaimerAccepted: false,
      dataRetentionConsent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('Inserting with data:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\n');
    
    const [result] = await db.insert(eligibilityCheck).values(testData).returning();
    
    console.log('✅ Success! Created eligibility check:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error: any) {
    console.error('❌ Error creating eligibility check:');
    console.error('Error message:', error.message);
    if (error.message?.includes('Failed query')) {
      console.error('Query details:', error.message);
    }
    process.exit(1);
  } finally {
    await queryClient.end();
  }
  
  console.log('\n✅ Test completed successfully!');
  process.exit(0);
}

testDirectInsert();
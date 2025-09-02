import { createEligibilityCheck } from '../lib/db/eligibility-queries';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function testEligibilityCreation() {
  console.log('Testing eligibility check creation...\n');
  
  try {
    // Test data
    const testData = {
      userId: 'test-user-123',
      nctId: 'NCT12345678',
      trialId: 'NCT12345678',
      trialTitle: 'Test Clinical Trial for NSCLC',
      healthProfileId: 'test-health-profile-456'
    };
    
    console.log('Creating eligibility check with data:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\n');
    
    const result = await createEligibilityCheck(testData);
    
    console.log('✅ Success! Created eligibility check:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error creating eligibility check:');
    console.error(error);
    process.exit(1);
  }
  
  console.log('\n✅ Test completed successfully!');
  process.exit(0);
}

testEligibilityCreation();
import { savedTrialsService } from '../lib/saved-trials/saved-trials-service';
import { db } from '../lib/db';

async function testSavedTrials() {
  console.log('🧪 Testing Saved Trials Feature...\n');

  // Test user ID (you'll need a real user ID from your database)
  const testUserId = 'test-user-123';
  
  // Sample trial data
  const sampleTrial = {
    protocolSection: {
      identificationModule: {
        nctId: 'NCT12345678',
        briefTitle: 'Test Clinical Trial for KRAS G12C'
      },
      statusModule: {
        overallStatus: 'RECRUITING'
      },
      contactsLocationsModule: {
        locations: [{
          city: 'Chicago',
          state: 'Illinois',
          country: 'United States'
        }]
      }
    }
  };

  try {
    console.log('1️⃣ Testing Save Trial...');
    const savedTrial = await savedTrialsService.saveTrial({
      userId: testUserId,
      nctId: sampleTrial.protocolSection.identificationModule.nctId,
      title: sampleTrial.protocolSection.identificationModule.briefTitle,
      trialSnapshot: sampleTrial,
      notes: 'This is a test note',
      tags: ['test', 'KRAS', 'Chicago'],
      searchContext: {
        query: 'KRAS G12C Chicago',
        location: 'Chicago, IL'
      }
    });
    console.log('✅ Trial saved successfully:', savedTrial.id);

    console.log('\n2️⃣ Testing Get User Saved Trials...');
    const userTrials = await savedTrialsService.getUserSavedTrials(testUserId);
    console.log(`✅ Found ${userTrials.length} saved trial(s)`);

    console.log('\n3️⃣ Testing Is Trial Saved...');
    const isSaved = await savedTrialsService.isTrialSaved(testUserId, sampleTrial.protocolSection.identificationModule.nctId);
    console.log(`✅ Trial saved status: ${isSaved}`);

    console.log('\n4️⃣ Testing Update Trial...');
    const updated = await savedTrialsService.updateSavedTrial({
      id: savedTrial.id,
      userId: testUserId,
      notes: 'Updated test note',
      tags: ['updated', 'test'],
      notificationSettings: {
        statusChange: true,
        enrollmentClosing: false
      }
    });
    console.log('✅ Trial updated successfully');

    console.log('\n5️⃣ Testing Get Saved NCT IDs...');
    const nctIds = await savedTrialsService.getUserSavedNctIds(testUserId);
    console.log(`✅ Found NCT IDs: ${nctIds.join(', ')}`);

    console.log('\n6️⃣ Testing Batch Check...');
    const batchCheck = await savedTrialsService.areTrialsSaved(testUserId, [
      'NCT12345678',
      'NCT87654321',
      'NCT11111111'
    ]);
    console.log('✅ Batch check results:', batchCheck);

    console.log('\n7️⃣ Testing Delete Trial...');
    const deleted = await savedTrialsService.unsaveTrial(testUserId, sampleTrial.protocolSection.identificationModule.nctId);
    console.log(`✅ Trial deleted: ${deleted}`);

    console.log('\n✨ All tests passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.$client.end();
  }
}

// Run the test
testSavedTrials();
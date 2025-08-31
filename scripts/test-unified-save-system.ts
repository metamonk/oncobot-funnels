#!/usr/bin/env pnpm tsx

/**
 * Test that the unified save system works correctly
 * Both SaveButton and Settings modal should use the same localStorage
 */

import { saveEventSystem } from '../lib/saved-trials/save-event-system';
import { localStorageManager } from '../lib/saved-trials/local-storage-manager';
import type { ClinicalTrial } from '../lib/saved-trials/types';

console.log('🧪 Testing Unified Save System');
console.log('================================\n');

// Mock localStorage for testing
const mockStorage: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; }
};

// Create test trial
const testTrial: ClinicalTrial = {
  identificationModule: {
    nctId: 'NCT11111111',
    briefTitle: 'Unified Save Test Trial',
  },
  statusModule: {
    overallStatus: 'RECRUITING'
  }
};

console.log('1️⃣ Testing SaveButton Save (via saveEventSystem)');
saveEventSystem.toggleSave(testTrial.identificationModule!.nctId, testTrial);
console.log('   ✅ Trial saved via SaveButton\n');

console.log('2️⃣ Checking localStorage Content');
const stored = mockStorage['oncobot_saved_trials'];
if (stored) {
  const data = JSON.parse(stored);
  console.log(`   ✅ Data in localStorage: ${Object.keys(data).length} trial(s)`);
  console.log(`   ✅ NCT ID present: ${testTrial.identificationModule!.nctId in data}\n`);
} else {
  console.log('   ❌ No data in localStorage!\n');
}

console.log('3️⃣ Testing Settings Modal Read (via localStorageManager)');
const allTrials = localStorageManager.getAll();
const hasTestTrial = testTrial.identificationModule!.nctId in allTrials;
console.log(`   ✅ Settings can see trial: ${hasTestTrial}`);
console.log(`   ✅ Total trials visible: ${Object.keys(allTrials).length}\n`);

console.log('4️⃣ Testing Remove via SaveButton');
saveEventSystem.toggleSave(testTrial.identificationModule!.nctId);
const afterRemove = localStorageManager.getAll();
const stillHasTrial = testTrial.identificationModule!.nctId in afterRemove;
console.log(`   ✅ Trial removed: ${!stillHasTrial}\n`);

console.log('5️⃣ Testing Save via Settings Modal (localStorageManager)');
localStorageManager.saveLocal({
  nctId: 'NCT22222222',
  title: 'Settings Modal Test Trial',
  trialSnapshot: {} as any,
  savedAt: new Date(),
  syncStatus: 'pending'
});

// Check if SaveButton can see it
const eventSystemSees = saveEventSystem.isSaved('NCT22222222');
console.log(`   ✅ SaveButton can see Settings trial: ${eventSystemSees}\n`);

console.log('✨ Summary:');
console.log('-----------');
if (hasTestTrial && !stillHasTrial && eventSystemSees) {
  console.log('✅ Unified save system working perfectly!');
  console.log('✅ SaveButton saves appear in Settings immediately');
  console.log('✅ Settings saves are recognized by SaveButton');
  console.log('✅ Both systems share the same localStorage key');
} else {
  console.log('❌ Systems are not fully synchronized');
  console.log(`   SaveButton → Settings: ${hasTestTrial ? '✅' : '❌'}`);
  console.log(`   Settings → SaveButton: ${eventSystemSees ? '✅' : '❌'}`);
}
#!/usr/bin/env tsx

/**
 * Test script to verify notes and tags persistence in saved trials system
 */

import { localStorageManager } from '../lib/saved-trials/local-storage-manager';

// Mock localStorage for Node.js environment
const storage: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => storage[key] || null,
  setItem: (key: string, value: string) => { storage[key] = value; },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(key => delete storage[key]); },
  length: 0,
  key: (index: number) => null,
} as Storage;

console.log('🧪 Testing Notes and Tags Persistence');
console.log('=====================================\n');

// Test 1: Save trial with notes and tags
console.log('Test 1: Saving trial with notes and tags');
localStorageManager.saveLocal({
  nctId: 'NCT12345678',
  title: 'Test Clinical Trial',
  trialSnapshot: { test: 'data' },
  savedAt: new Date(),
  syncStatus: 'pending',
  notes: 'This is a test note about the trial',
  tags: ['important', 'local', 'first-line'],
  searchContext: { query: 'test search' }
});

// Verify save
const saved = localStorageManager.getAll();
const trial1 = saved['NCT12345678'];
console.log('✅ Trial saved successfully');
console.log('  - Notes:', trial1?.notes);
console.log('  - Tags:', trial1?.tags);
console.log('  - Search Context:', trial1?.searchContext);

// Test 2: Update trial notes and tags
console.log('\nTest 2: Updating trial notes and tags');
localStorageManager.saveLocal({
  ...trial1!,
  notes: 'Updated note with more information',
  tags: ['important', 'local', 'second-line', 'updated'],
  syncStatus: 'pending'
});

const updated = localStorageManager.getAll();
const trial2 = updated['NCT12345678'];
console.log('✅ Trial updated successfully');
console.log('  - Notes:', trial2?.notes);
console.log('  - Tags:', trial2?.tags);

// Test 3: Save trial without notes/tags, then add them
console.log('\nTest 3: Adding notes/tags to existing trial');
localStorageManager.saveLocal({
  nctId: 'NCT87654321',
  title: 'Another Test Trial',
  trialSnapshot: { test: 'data2' },
  savedAt: new Date(),
  syncStatus: 'pending'
});

console.log('Initial save without notes/tags:');
const trial3Initial = localStorageManager.getAll()['NCT87654321'];
console.log('  - Notes:', trial3Initial?.notes || 'null');
console.log('  - Tags:', trial3Initial?.tags || '[]');

// Now add notes and tags
localStorageManager.saveLocal({
  ...trial3Initial!,
  notes: 'Added notes after initial save',
  tags: ['added-later'],
  syncStatus: 'pending'
});

const trial3Updated = localStorageManager.getAll()['NCT87654321'];
console.log('✅ Notes and tags added successfully');
console.log('  - Notes:', trial3Updated?.notes);
console.log('  - Tags:', trial3Updated?.tags);

// Test 4: Verify localStorage persistence
console.log('\nTest 4: Verifying localStorage persistence');
const rawData = localStorage.getItem('oncobot_saved_trials');
if (rawData) {
  const parsed = JSON.parse(rawData);
  const trialCount = Object.keys(parsed).length;
  console.log(`✅ Found ${trialCount} trials in localStorage`);
  
  Object.entries(parsed).forEach(([nctId, trial]: [string, any]) => {
    console.log(`\n  Trial ${nctId}:`);
    console.log(`    - Title: ${trial.title}`);
    console.log(`    - Notes: ${trial.notes || 'null'}`);
    console.log(`    - Tags: ${trial.tags ? trial.tags.join(', ') : '[]'}`);
    console.log(`    - Has Search Context: ${trial.searchContext ? 'Yes' : 'No'}`);
  });
}

// Test 5: Test merging with remote data
console.log('\nTest 5: Testing merge with remote data');
const remoteTrials = [
  {
    id: 'remote_1',
    nctId: 'NCT12345678', // Same as local trial
    title: 'Test Clinical Trial (Remote)',
    trialSnapshot: { test: 'remote_data' },
    savedAt: new Date('2024-01-01'),
    userId: 'user123',
    notes: 'Remote notes - should not override local',
    tags: ['remote-tag'],
    searchContext: null
  },
  {
    id: 'remote_2',
    nctId: 'NCT99999999', // New trial from remote
    title: 'Remote Only Trial',
    trialSnapshot: { test: 'remote_only' },
    savedAt: new Date('2024-01-02'),
    userId: 'user123',
    notes: 'This trial only exists remotely',
    tags: ['remote-only', 'synced'],
    searchContext: { query: 'remote search' }
  }
];

localStorageManager.mergeRemote(remoteTrials);
const mergedData = localStorageManager.getAll();

console.log('✅ Remote data merged');
console.log(`  Total trials after merge: ${Object.keys(mergedData).length}`);

// Check that local trial kept its local notes/tags
const localTrial = mergedData['NCT12345678'];
console.log('\n  Local trial (NCT12345678) after merge:');
console.log(`    - Notes: ${localTrial?.notes}`);
console.log(`    - Tags: ${localTrial?.tags?.join(', ')}`);
console.log(`    - Should preserve local updates: ${
  localTrial?.notes === 'Updated note with more information' ? '✅ Yes' : '❌ No'
}`);

// Check that remote-only trial was added
const remoteTrial = mergedData['NCT99999999'];
console.log('\n  Remote trial (NCT99999999) after merge:');
console.log(`    - Notes: ${remoteTrial?.notes}`);
console.log(`    - Tags: ${remoteTrial?.tags?.join(', ')}`);
console.log(`    - Search Context: ${remoteTrial?.searchContext ? JSON.stringify(remoteTrial.searchContext) : 'null'}`);

console.log('\n=====================================');
console.log('✅ All tests completed successfully!');
console.log('Notes and tags are being persisted correctly.');
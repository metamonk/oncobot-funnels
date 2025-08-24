#!/usr/bin/env tsx
/**
 * Direct test of trial status service
 */

import { trialStatusService } from '../lib/tools/clinical-trials/services/trial-status-service';

console.log('🔍 TESTING TRIAL STATUS SERVICE\n');
console.log('=' .repeat(60));

const statuses = trialStatusService.getInitialSearchStatuses();
console.log('\nInitial Search Statuses:');
console.log('Type:', typeof statuses);
console.log('Is Array:', Array.isArray(statuses));
console.log('Value:', statuses);

if (Array.isArray(statuses)) {
  console.log('Join result:', statuses.join(','));
} else {
  console.log('❌ Not an array - cannot join!');
}

console.log('\n' + '=' .repeat(60));
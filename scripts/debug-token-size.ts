#!/usr/bin/env tsx

/**
 * Debug script to see what's taking up so much space in the response
 */

import { clinicalTrialsRouter } from '../lib/tools/clinical-trials/router';
import type { RouterContext } from '../lib/tools/clinical-trials/types';

// Mock data stream for testing
const mockDataStream = {
  writeMessageAnnotation: (data: any) => {
    // Silent for this test
  }
} as any;

async function debugTokenSize() {
  console.log('=== Debugging Token Size Issue ===\n');
  
  const context: RouterContext = {
    query: 'breast cancer',
    dataStream: mockDataStream
  };
  
  const result = await clinicalTrialsRouter.routeWithContext(context);
  
  console.log('Result structure:');
  console.log('- success:', result.success);
  console.log('- matches:', result.matches?.length || 0);
  console.log('- totalCount:', result.totalCount);
  console.log('- message:', result.message);
  console.log('- metadata:', result.metadata ? Object.keys(result.metadata) : 'none');
  console.log('- trials included?:', 'trials' in result);
  
  if (result.matches && result.matches.length > 0) {
    const firstMatch = result.matches[0];
    console.log('\nFirst match structure:');
    console.log('Keys:', Object.keys(firstMatch));
    
    // Check size of each field
    for (const [key, value] of Object.entries(firstMatch)) {
      const size = JSON.stringify(value).length;
      console.log(`- ${key}: ${size} chars`);
    }
    
    // Check if trial object is there
    if (firstMatch.trial) {
      console.log('\n⚠️  PROBLEM: trial object is still included!');
      console.log('Trial size:', JSON.stringify(firstMatch.trial).length, 'chars');
    } else {
      console.log('\n✅ Good: trial object is undefined');
    }
  }
  
  // Calculate sizes
  const fullJson = JSON.stringify(result);
  const matchesOnly = JSON.stringify(result.matches || []);
  
  console.log('\nSize breakdown:');
  console.log('- Total response:', (fullJson.length / 1024).toFixed(2), 'KB');
  console.log('- Matches array:', (matchesOnly.length / 1024).toFixed(2), 'KB');
  console.log('- Overhead:', ((fullJson.length - matchesOnly.length) / 1024).toFixed(2), 'KB');
  
  // Show a sample match
  if (result.matches && result.matches.length > 0) {
    console.log('\n=== Sample Match (first trial) ===');
    console.log(JSON.stringify(result.matches[0], null, 2).substring(0, 1000) + '...');
  }
}

debugTokenSize().catch(console.error);
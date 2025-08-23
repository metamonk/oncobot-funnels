#!/usr/bin/env tsx

import { QueryClassifier } from '../lib/tools/clinical-trials/query-classifier';

const classifier = new QueryClassifier();

// Test with health profile
const testQueries = [
  "what trials are available to me?",
  "Find trials for my cancer",
  "Clinical trials for NSCLC",
  "Trials near Chicago"
];

const mockHealthProfile = {
  cancerType: "Non-Small Cell Lung Cancer",
  cancer_type: "NSCLC",
  diseaseStage: "STAGE_IV",
  molecularMarkers: {
    KRAS_G12C: 'POSITIVE'
  }
};

console.log("Testing Query Classification:\n");

testQueries.forEach(query => {
  console.log(`Query: "${query}"`);
  
  const result = classifier.classify(query, {
    healthProfile: mockHealthProfile,
    userCoordinates: { latitude: 41.8781, longitude: -87.6298 }
  });
  
  console.log(`  Intent: ${result.intent}`);
  console.log(`  Strategy: ${result.strategy}`);
  console.log(`  Confidence: ${result.confidence.toFixed(2)}`);
  console.log(`  Reasoning: ${result.reasoning}`);
  console.log();
});
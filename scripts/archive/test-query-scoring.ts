#!/usr/bin/env tsx

import { QueryClassifier } from '../lib/tools/clinical-trials/query-classifier';

const classifier = new QueryClassifier();

// Access private method for testing
const calculateIntentScores = (classifier as any).calculateIntentScores.bind(classifier);

const query = "what trials are available to me?";
const normalizedQuery = query.toLowerCase().trim();

console.log(`Query: "${query}"`);
console.log(`Normalized: "${normalizedQuery}"\n`);

// Test intent patterns
const intentPatterns = {
  eligibility: [
    { pattern: /\b(eligible|qualify|can\s+I\s+join)/i, weight: 0.9 },
    { pattern: /for\s+me\b/i, weight: 0.7 },
    { pattern: /available\s+to\s+me/i, weight: 0.85 },
    { pattern: /\bmy\s+(cancer|condition|diagnosis|profile)/i, weight: 0.85 },
    { pattern: /for\s+my\s+(cancer|condition|diagnosis)/i, weight: 0.85 },
    { pattern: /based\s+on\s+my\s+profile/i, weight: 0.95 },
    { pattern: /trials?\s+for\s+my/i, weight: 0.8 },
    { pattern: /trials?\s+.*\s+to\s+me/i, weight: 0.75 }
  ],
  condition_primary: [
    { pattern: /^(lung|breast|colon|pancreatic|prostate)\s+cancer/i, weight: 0.9 },
    { pattern: /^([A-Z]{2,5}[0-9]{0,3}(?:[-_]?[A-Z0-9]+)?)/i, weight: 0.95 },
    { pattern: /for\s+(lung|breast|colon)\s+cancer/i, weight: 0.85 },
    { pattern: /stage\s+(I{1,3}V?|[1-4])/i, weight: 0.8 },
    { pattern: /^(cancer|carcinoma|melanoma|lymphoma)/i, weight: 0.8 }
  ]
};

// Calculate scores manually
console.log("=== Manual Pattern Matching ===\n");

for (const [intent, patterns] of Object.entries(intentPatterns)) {
  console.log(`${intent}:`);
  let totalScore = 0;
  let matchCount = 0;
  
  for (const { pattern, weight } of patterns) {
    if (pattern.test(normalizedQuery)) {
      console.log(`  ✓ Pattern: ${pattern} (weight: ${weight})`);
      totalScore += weight;
      matchCount++;
    }
  }
  
  const finalScore = matchCount > 0 ? totalScore / Math.sqrt(matchCount) : 0;
  console.log(`  Total Score: ${totalScore.toFixed(2)}, Matches: ${matchCount}, Final: ${finalScore.toFixed(2)}\n`);
}

// Now test actual classification
console.log("=== Actual Classification ===\n");
const result = classifier.classify(query, {
  healthProfile: {
    cancerType: "Non-Small Cell Lung Cancer",
    cancer_type: "NSCLC",
    diseaseStage: "STAGE_IV",
    molecularMarkers: {
      KRAS_G12C: 'POSITIVE'
    }
  }
});

console.log(`Intent: ${result.intent}`);
console.log(`Strategy: ${result.strategy}`);
console.log(`Confidence: ${result.confidence.toFixed(2)}`);
console.log(`Reasoning: ${result.reasoning}`);

// Test hasPersonalReference
const hasPersonalReference = (query: string): boolean => {
  const personalPatterns = [
    /\bmy\s+(cancer|condition|diagnosis|disease|tumor|profile)/i,
    /for\s+my\s+(cancer|condition|diagnosis|disease)/i,
    /\bi\s+(have|was\s+diagnosed|am\s+eligible)/i,
    /trials?\s+for\s+me\b/i,
    /based\s+on\s+my/i,
    /available\s+to\s+me/i,  // Add this pattern
    /trials?\s+.*\s+to\s+me/i  // Add this pattern
  ];
  
  return personalPatterns.some(p => p.test(query));
};

console.log(`\nHasPersonalReference: ${hasPersonalReference(normalizedQuery)}`);
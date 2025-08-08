#!/usr/bin/env tsx

import { RelevanceScorer } from '../lib/tools/clinical-trials/relevance-scorer';

// Test health profile (KRAS G12C NSCLC)
const testProfile = {
  cancerType: 'Non-Small Cell Lung Cancer',
  molecularMarkers: {
    KRAS_G12C: 'POSITIVE',
    EGFR: 'NEGATIVE',
    ALK: 'NEGATIVE',
    PDL1: 'LOW'
  },
  stage: 'Stage IV',
  location: 'Chicago, IL'
};

// Mock trials (simplified)
const mockTrials = [
  {
    protocolSection: {
      identificationModule: {
        nctId: 'NCT04613596',
        briefTitle: 'Study of Sotorasib (AMG 510) in KRAS G12C Mutated Solid Tumors',
        officialTitle: 'A Phase 2 Study of Sotorasib in Participants With KRAS G12C-Mutated Advanced Solid Tumors'
      },
      descriptionModule: {
        briefSummary: 'This study evaluates sotorasib in patients with KRAS G12C mutations'
      },
      conditionsModule: {
        conditions: ['Non-Small Cell Lung Cancer', 'KRAS G12C Mutation'],
        keywords: ['KRAS G12C', 'Sotorasib', 'AMG 510']
      },
      statusModule: {
        overallStatus: 'RECRUITING'
      },
      designModule: {
        phases: ['PHASE2']
      },
      armsInterventionsModule: {
        interventions: [
          { name: 'Sotorasib', description: 'KRAS G12C inhibitor' }
        ]
      }
    }
  },
  {
    protocolSection: {
      identificationModule: {
        nctId: 'NCT05009329',
        briefTitle: 'A Study of JDQ443 in Patients With Advanced Solid Tumors Harboring the KRAS G12C Mutation',
        officialTitle: 'Phase Ib/II Study of JDQ443 in Patients With KRAS G12C Mutant Solid Tumors'
      },
      descriptionModule: {
        briefSummary: 'Study of JDQ443 in KRAS G12C mutant tumors'
      },
      conditionsModule: {
        conditions: ['Solid Tumors', 'KRAS G12C'],
        keywords: ['JDQ443', 'KRAS G12C']
      },
      statusModule: {
        overallStatus: 'RECRUITING'
      },
      designModule: {
        phases: ['PHASE1', 'PHASE2']
      },
      armsInterventionsModule: {
        interventions: [
          { name: 'JDQ443', description: 'KRAS G12C inhibitor' }
        ]
      }
    }
  },
  {
    protocolSection: {
      identificationModule: {
        nctId: 'NCT12345678',
        briefTitle: 'Generic Lung Cancer Study',
        officialTitle: 'A Study of Chemotherapy in Lung Cancer'
      },
      descriptionModule: {
        briefSummary: 'Standard chemotherapy for lung cancer patients'
      },
      conditionsModule: {
        conditions: ['Lung Cancer'],
        keywords: ['Chemotherapy', 'Lung Cancer']
      },
      statusModule: {
        overallStatus: 'RECRUITING'
      },
      designModule: {
        phases: ['PHASE3']
      },
      armsInterventionsModule: {
        interventions: [
          { name: 'Carboplatin', description: 'Standard chemotherapy' }
        ]
      }
    }
  },
  {
    protocolSection: {
      identificationModule: {
        nctId: 'NCT05920356',
        briefTitle: 'Study of Adagrasib With Pembrolizumab in KRAS G12C NSCLC',
        officialTitle: 'Phase 2 Study of Adagrasib Plus Pembrolizumab in KRAS G12C-Mutated NSCLC'
      },
      descriptionModule: {
        briefSummary: 'Combination therapy with adagrasib and pembrolizumab for KRAS G12C NSCLC'
      },
      conditionsModule: {
        conditions: ['Non-Small Cell Lung Cancer', 'KRAS G12C'],
        keywords: ['Adagrasib', 'Pembrolizumab', 'KRAS G12C', 'NSCLC']
      },
      statusModule: {
        overallStatus: 'RECRUITING'
      },
      designModule: {
        phases: ['PHASE2']
      },
      armsInterventionsModule: {
        interventions: [
          { name: 'Adagrasib', description: 'KRAS G12C inhibitor' },
          { name: 'Pembrolizumab', description: 'PD-1 inhibitor' }
        ]
      }
    }
  },
  {
    protocolSection: {
      identificationModule: {
        nctId: 'NCT98765432',
        briefTitle: 'Breast Cancer Immunotherapy Trial',
        officialTitle: 'Study of Immunotherapy in Breast Cancer'
      },
      descriptionModule: {
        briefSummary: 'Testing immunotherapy in breast cancer patients'
      },
      conditionsModule: {
        conditions: ['Breast Cancer'],
        keywords: ['Immunotherapy', 'Breast Cancer']
      },
      statusModule: {
        overallStatus: 'RECRUITING'
      },
      designModule: {
        phases: ['PHASE2']
      },
      armsInterventionsModule: {
        interventions: [
          { name: 'Atezolizumab', description: 'PD-L1 inhibitor' }
        ]
      }
    }
  }
];

// Test the scoring
console.log('Testing Relevance Scoring System\n');
console.log('=================================\n');

const scoringContext = {
  userQuery: 'KRAS G12C trials',
  healthProfile: testProfile,
  searchStrategy: 'profile-based'
};

// Score all trials
const scoredTrials = RelevanceScorer.scoreTrials(mockTrials, scoringContext);

// Display results
console.log('Trial Scores (sorted by relevance):\n');
scoredTrials.forEach((trial, index) => {
  const nctId = trial.protocolSection.identificationModule.nctId;
  const title = trial.protocolSection.identificationModule.briefTitle;
  const score = (trial as any).relevanceScore;
  
  // Check if it's one of the expected STUDIES.md trials
  const expectedTrials = ['NCT04613596', 'NCT05920356', 'NCT05009329'];
  const isExpected = expectedTrials.includes(nctId);
  
  console.log(`${index + 1}. ${nctId} ${isExpected ? '✅' : ''}`);
  console.log(`   Score: ${score}`);
  console.log(`   Title: ${title.substring(0, 70)}...`);
  
  // Debug score breakdown for KRAS trials
  if (nctId.startsWith('NCT0461') || nctId.startsWith('NCT0592') || nctId.startsWith('NCT0500')) {
    const debug = RelevanceScorer.debugScore(trial, scoringContext);
    console.log(`   Breakdown:`, debug.breakdown);
  }
  console.log();
});

// Summary
console.log('Summary:');
console.log('--------');
const krasTrials = scoredTrials.filter(t => 
  t.protocolSection.identificationModule.briefTitle.toLowerCase().includes('kras')
);
console.log(`KRAS-specific trials: ${krasTrials.length}`);
console.log(`Top 3 are all KRAS trials: ${scoredTrials.slice(0, 3).every(t => 
  t.protocolSection.identificationModule.briefTitle.toLowerCase().includes('kras')
)}`);

const topScores = scoredTrials.slice(0, 3).map(t => (t as any).relevanceScore);
console.log(`Top 3 scores: ${topScores.join(', ')}`);

// Test that generic trials score lower
const genericTrial = scoredTrials.find(t => 
  t.protocolSection.identificationModule.nctId === 'NCT12345678'
);
const genericScore = (genericTrial as any)?.relevanceScore || 0;
console.log(`Generic lung cancer trial score: ${genericScore}`);
console.log(`Generic trial ranks lower than KRAS trials: ${genericScore < topScores[0]}`);
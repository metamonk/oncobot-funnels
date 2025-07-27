#!/usr/bin/env tsx

// Simple script to fetch and display eligibility criteria from clinical trials
// No environment variables needed - direct API call

const BASE_URL = 'https://clinicaltrials.gov/api/v2/studies';

async function fetchTrialCriteria() {
  console.log('🔍 Fetching sample clinical trials to examine eligibility criteria...\n');

  try {
    // Search for some common cancer trials to see their eligibility criteria
    const searchParams = new URLSearchParams({
      'query.cond': 'lung cancer',
      'filter.overallStatus': 'RECRUITING',
      'pageSize': '3',
      'sort': 'StartDate:desc'
    });

    const response = await fetch(`${BASE_URL}?${searchParams}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const trials = data.studies || [];

    console.log(`Found ${trials.length} trials. Examining eligibility criteria:\n`);
    console.log('='.repeat(80) + '\n');

    trials.forEach((trial: any, index: number) => {
      const { protocolSection } = trial;
      const { identificationModule, eligibilityModule } = protocolSection;

      console.log(`TRIAL ${index + 1}: ${identificationModule.briefTitle}`);
      console.log(`NCT ID: ${identificationModule.nctId}`);
      console.log('-'.repeat(80));

      if (eligibilityModule) {
        console.log('\n📋 ELIGIBILITY SUMMARY:');
        console.log(`Sex: ${eligibilityModule.sex || 'Not specified'}`);
        console.log(`Age: ${eligibilityModule.minimumAge || 'No minimum'} - ${eligibilityModule.maximumAge || 'No maximum'}`);
        console.log(`Healthy Volunteers: ${eligibilityModule.healthyVolunteers || 'No'}`);

        if (eligibilityModule.eligibilityCriteria) {
          console.log('\n📄 FULL ELIGIBILITY CRITERIA:');
          console.log('(This is the raw text that would be analyzed)');
          console.log('-'.repeat(40));
          
          // Show first 2000 characters of criteria
          const criteria = eligibilityModule.eligibilityCriteria;
          if (criteria.length > 2000) {
            console.log(criteria.substring(0, 2000) + '...\n[TRUNCATED]');
          } else {
            console.log(criteria);
          }
        } else {
          console.log('\n❌ No detailed eligibility criteria available');
        }
      } else {
        console.log('\n❌ No eligibility module found');
      }

      console.log('\n' + '='.repeat(80) + '\n');
    });

    // Now let's search for a trial with specific molecular markers
    console.log('\n🧬 Searching for trials with molecular marker requirements...\n');

    const markerParams = new URLSearchParams({
      'query.cond': 'non-small cell lung cancer',
      'query.term': 'EGFR mutation',
      'filter.overallStatus': 'RECRUITING',
      'pageSize': '2'
    });

    const markerResponse = await fetch(`${BASE_URL}?${markerParams}`);
    const markerData = await markerResponse.json();
    const markerTrials = markerData.studies || [];

    markerTrials.forEach((trial: any, index: number) => {
      const { protocolSection } = trial;
      const { identificationModule, eligibilityModule } = protocolSection;

      console.log(`MOLECULAR MARKER TRIAL ${index + 1}: ${identificationModule.briefTitle}`);
      console.log(`NCT ID: ${identificationModule.nctId}`);
      console.log('-'.repeat(80));

      if (eligibilityModule?.eligibilityCriteria) {
        // Look for molecular marker mentions
        const criteria = eligibilityModule.eligibilityCriteria.toLowerCase();
        const markers = ['egfr', 'alk', 'ros1', 'kras', 'pd-l1', 'braf', 'her2', 'met'];
        
        console.log('\n🔬 MOLECULAR MARKERS MENTIONED:');
        markers.forEach(marker => {
          if (criteria.includes(marker)) {
            // Find context around the marker
            const index = criteria.indexOf(marker);
            const start = Math.max(0, index - 100);
            const end = Math.min(criteria.length, index + 100);
            const context = criteria.substring(start, end);
            console.log(`\n${marker.toUpperCase()}: "...${context}..."`);
          }
        });

        console.log('\n📄 FIRST 1000 CHARS OF CRITERIA:');
        console.log(eligibilityModule.eligibilityCriteria.substring(0, 1000) + '...');
      }

      console.log('\n' + '='.repeat(80) + '\n');
    });

  } catch (error) {
    console.error('Error fetching trials:', error);
  }
}

// Also check what the analyzeEligibility function does
console.log(`
📊 CURRENT ELIGIBILITY ANALYSIS METHOD:
The system currently uses a FUNCTION-BASED approach (not AI model):

1. The analyzeEligibility function in clinical-trials.ts:516-587
2. It does simple keyword matching:
   - Looks for cancer region, stage, molecular markers in the criteria text
   - Checks for exclusion keywords like "no prior chemotherapy"
   - Sets likelyEligible = false if exclusions found OR no matches found

❌ LIMITATIONS:
- No semantic understanding of complex criteria
- Can't interpret relationships (e.g., "must have X OR Y")
- Misses nuanced eligibility requirements
- Too strict: requires explicit text matches

💡 POTENTIAL IMPROVEMENTS:
- Use AI model to analyze eligibility criteria
- Understand complex boolean logic in criteria
- Extract structured requirements from free text
- Provide confidence scores instead of binary eligible/not eligible
`);

fetchTrialCriteria();
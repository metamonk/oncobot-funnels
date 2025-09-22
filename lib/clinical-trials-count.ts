/**
 * Fetch trial counts from ClinicalTrials.gov API
 * Simple, cached, with fallbacks
 */

import { unstable_cache } from 'next/cache';

interface TrialCountResult {
  condition: string;
  count: number;
  formatted: string;
}

// Fallback values if API fails
const FALLBACK_COUNTS: Record<string, number> = {
  'lung': 500,
  'prostate': 300,
  'gi': 400
};

// ClinicalTrials.gov API search terms - simplified to match website
const SEARCH_TERMS: Record<string, string> = {
  'lung': 'Lung Cancer',
  'prostate': 'Prostate Cancer',
  'gi': 'Colorectal Cancer OR Pancreatic Cancer OR Liver Cancer'
};

/**
 * Fetch trial count from ClinicalTrials.gov
 * Returns fallback value if API fails
 */
async function fetchTrialCount(conditionKey: string): Promise<TrialCountResult> {
  const searchTerm = SEARCH_TERMS[conditionKey];
  const fallbackCount = FALLBACK_COUNTS[conditionKey] || 100;

  try {
    // ClinicalTrials.gov API v2
    // Filter for actively recruiting trials only
    const params = new URLSearchParams({
      'query.cond': searchTerm,
      'filter.overallStatus': 'RECRUITING,NOT_YET_RECRUITING,ENROLLING_BY_INVITATION',
      'countTotal': 'true',
      'pageSize': '1' // We only need the count
    });

    const response = await fetch(
      `https://clinicaltrials.gov/api/v2/studies?${params.toString()}`,
      {
        next: { revalidate: 86400 }, // Cache for 24 hours
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const actualCount = data.totalCount || 0;

    // Use actual count if reasonable, otherwise fallback
    const count = actualCount > 0 ? actualCount : fallbackCount;

    // Format number with commas for thousands
    const formattedCount = count.toLocaleString();

    return {
      condition: conditionKey,
      count,
      formatted: `${formattedCount}+ open trials`
    };
  } catch (error) {
    // Return fallback on any error
    console.warn(`Failed to fetch trial count for ${conditionKey}:`, error);
    return {
      condition: conditionKey,
      count: fallbackCount,
      formatted: `${fallbackCount}+ open trials`
    };
  }
}

/**
 * Get all trial counts with caching
 * Cached for 24 hours, revalidated in background
 */
export const getTrialCounts = unstable_cache(
  async () => {
    // Fetch all counts in parallel
    const results = await Promise.allSettled([
      fetchTrialCount('lung'),
      fetchTrialCount('prostate'),
      fetchTrialCount('gi')
    ]);

    // Map results with fallbacks for any failures
    const counts: Record<string, string> = {};

    results.forEach((result, index) => {
      const key = ['lung', 'prostate', 'gi'][index];
      if (result.status === 'fulfilled') {
        counts[key] = result.value.formatted;
      } else {
        counts[key] = `${FALLBACK_COUNTS[key]}+ open trials`;
      }
    });

    return counts;
  },
  ['trial-counts'],
  {
    revalidate: 86400, // 24 hours
    tags: ['trial-counts']
  }
);

/**
 * Get single trial count
 */
export async function getSingleTrialCount(conditionKey: string): Promise<string> {
  const result = await fetchTrialCount(conditionKey);
  return result.formatted;
}
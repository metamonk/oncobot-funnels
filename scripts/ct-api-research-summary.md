# ClinicalTrials.gov API Research Summary

## Key Findings

### 1. Basic NSCLC Query (Current Approach)
- Query: `query.cond=lung cancer nsclc`
- Results: NO KRAS G12C trials in top 5
- Only 1/5 trials mentioned KRAS at all

### 2. Adding KRAS to Condition Field
- Query: `query.cond=lung cancer nsclc KRAS`
- Better results: 1 trial (NCT06936644) with KRAS G12C found!
- 3/5 trials mentioned KRAS

### 3. Best Results: KRAS G12C in Condition
- Query: `query.cond=lung cancer nsclc KRAS G12C`
- **EXCELLENT**: 4/5 trials specifically for KRAS G12C!
- Including 2 RECRUITING trials (NCT06127940, NCT06345729)

### 4. Drug-Specific Searches Work Well
- **Sotorasib** query: 5/5 trials were KRAS G12C specific
- **Adagrasib** query: 5/5 trials were KRAS G12C specific
- These are FDA-approved KRAS G12C inhibitors

### 5. Query Parameter Differences
- `query.cond`: Searches condition/disease fields only
- `query.term`: Broader search across multiple fields
- `query.intr`: Searches intervention/treatment fields

## Critical Insights

### The Problem with Current Approach
Our current search (`lung cancer nsclc`) is TOO BROAD and misses KRAS G12C trials because:
1. KRAS G12C is often in eligibility criteria, not the condition field
2. Generic NSCLC trials dominate the results
3. We're not using the molecular marker information in the search query

### Why KRAS G12C Trials Don't Rank High
1. They're a small subset of all NSCLC trials
2. Many are NOT_YET_RECRUITING (lower score)
3. Our query doesn't include KRAS terms
4. The API returns trials in relevance order - generic NSCLC trials are more "relevant" to "lung cancer nsclc"

## Recommended Search Strategy

### Option 1: Two-Phase Search
1. **Primary Search**: Include molecular markers in query
   ```
   query.cond: "lung cancer nsclc KRAS G12C"
   ```
2. **Fallback Search**: If few results, broaden to general NSCLC

### Option 2: Multi-Query Approach
Run multiple queries in parallel:
1. General: `lung cancer nsclc`
2. Specific: `lung cancer nsclc KRAS G12C`
3. Drug-based: `sotorasib OR adagrasib` in interventions

### Option 3: Smart Query Building
- If user has KRAS G12C → add it to query.cond
- If user has other markers → add those too
- Use `query.term` for broader matching

## Specific KRAS G12C Trials Found

### Currently RECRUITING:
1. **NCT06127940** - K-SAB Trial (Sotorasib + SBRT)
2. **NCT06345729** - MK-1084 + Pembrolizumab
3. **NCT04956640** - LY3537982 study
4. **NCT06875310** - Adagrasib + Pembrolizumab + Chemo
5. **NCT04613596** - Adagrasib combinations

### NOT_YET_RECRUITING but Relevant:
1. **NCT06936644** - IBI351 + AK112
2. **NCT07094204** - ASP5834 dose finding
3. **NCT07012031** - Sotorasib + Trastuzumab

## Conclusion

The current search strategy is fundamentally flawed for finding molecular marker-specific trials. We need to:
1. Include molecular markers in the search query when available
2. Consider drug names as search terms
3. Potentially run multiple queries to ensure comprehensive results
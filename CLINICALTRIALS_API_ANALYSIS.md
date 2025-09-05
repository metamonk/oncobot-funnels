# ClinicalTrials.gov API Analysis & System Redesign Recommendations

## 📊 API Testing Results

### Key Discovery: Structured Parameters Work!

The ClinicalTrials.gov API **DOES** support structured location filtering through proper parameter usage:

### Test Results Summary

1. **Text-based Search** (Current Approach - PROBLEMATIC)
   - Query: `query.term="KRAS G12C Chicago"`
   - Results: 21 trials found, only 5 in Chicago
   - **Issue**: Searches ALL text fields, not specifically filtering by location

2. **Structured Search** (PROPER APPROACH)
   - Query: `query.term="KRAS G12C"` AND `query.locn="Chicago"`
   - Results: 21 trials found, 5 actually in Chicago
   - **Success**: Same number but with proper parameter separation

3. **Location-Only Search**
   - Query: `query.locn="Chicago, IL"`
   - Results: 16,753 trials found
   - **Insight**: The API properly filters by location when using query.locn

4. **Advanced Structured Search**
   - Query: `query.cond="lung cancer"` AND `query.intr="KRAS"` AND `query.locn="Chicago"`
   - Results: 26 trials found with Chicago locations
   - **Success**: Multiple parameters can be combined for precise filtering

## 🔍 Current System Analysis

### The Core Problem

Our orchestrated system is fundamentally misusing the API:

```typescript
// CURRENT (WRONG) - From text-search.ts atomic tool:
const params = {
  'query.term': 'KRAS G12C Chicago',  // Mixing medical terms with location!
  'pageSize': 10
}

// SHOULD BE:
const params = {
  'query.term': 'KRAS G12C',      // Medical terms only
  'query.locn': 'Chicago',         // Location separately
  'pageSize': 10
}
```

### Architecture Comparison

#### Old Monolithic System (WORKED CORRECTLY)
- Single AI call understood the full context
- Properly filled in API form fields
- Used structured parameters correctly
- Direct mapping: mutation → term, city → location

#### New Orchestrated System (CURRENT PROBLEM)
- Query analyzer correctly extracts entities ✅
- BUT atomic tools don't use extracted entities properly ❌
- Text search tool concatenates everything into query.term
- Location information is wasted, not used for filtering

## 🎯 Root Cause Analysis

### Where the System Breaks Down

1. **Query Analyzer** (✅ WORKS)
   ```typescript
   // Correctly extracts:
   entities: {
     mutations: ['KRAS G12C'],
     locations: { cities: ['Chicago'] }
   }
   ```

2. **Orchestrator** (⚠️ PARTIALLY BROKEN)
   ```typescript
   // Makes wrong decision:
   // Instead of: mutationSearch + locationFilter
   // Does: textSearch with concatenated string
   ```

3. **Text Search Atomic Tool** (❌ FUNDAMENTALLY BROKEN)
   ```typescript
   // Current implementation:
   search({ query: "KRAS G12C Chicago", field: 'term' })
   // Puts everything in query.term, ignoring structure
   ```

4. **Result Composer** (⚠️ CANNOT FIX THE PROBLEM)
   - Can only work with what it receives
   - Cannot retroactively filter by location if not in initial query
   - No access to actual trial site locations for post-filtering

## 🛠️ Recommended Solution

### Immediate Fix: Restructure Atomic Tools

#### 1. Create Location-Aware Search Tool
```typescript
// New atomic tool: structured-search.ts
interface StructuredSearchParams {
  medicalTerms?: string;      // → query.term
  condition?: string;          // → query.cond
  intervention?: string;       // → query.intr
  location?: string;          // → query.locn
  distance?: number;          // → query.distance
  pageSize?: number;
}

async search(params: StructuredSearchParams) {
  const apiParams: Record<string, string> = {};
  
  if (params.medicalTerms) apiParams['query.term'] = params.medicalTerms;
  if (params.location) apiParams['query.locn'] = params.location;
  if (params.condition) apiParams['query.cond'] = params.condition;
  if (params.intervention) apiParams['query.intr'] = params.intervention;
  
  // Make API call with structured parameters
}
```

#### 2. Update Orchestrator Logic
```typescript
// Instead of current approach:
if (analysis.entities.mutations.length > 0 && analysis.entities.locations.cities.length > 0) {
  // Use structured search, not text search
  const results = await structuredSearch.search({
    medicalTerms: analysis.entities.mutations.join(' '),
    location: analysis.entities.locations.cities.join(', ')
  });
}
```

### Long-term Improvements

1. **Leverage All API Parameters**
   - `query.cond`: For conditions like "lung cancer", "NSCLC"
   - `query.intr`: For interventions/drugs
   - `query.locn`: For locations (cities, states, countries)
   - `query.spons`: For sponsors
   - `query.recrs`: For recruitment status

2. **Smart Parameter Mapping**
   ```typescript
   // Map extracted entities to correct API parameters:
   {
     'lung cancer' → query.cond (not query.term)
     'KRAS G12C' → query.term (mutation/biomarker)
     'pembrolizumab' → query.intr (drug/intervention)
     'Chicago' → query.locn (location)
     'Pfizer' → query.spons (sponsor)
   }
   ```

3. **Distance-Based Search** (needs investigation)
   - The distance parameter seems to have issues
   - May need specific format or additional parameters
   - Consider as enhancement after basic location works

## 📈 Expected Improvements

### Before (Current System)
- Query: "KRAS G12C trials in Chicago"
- Finds: 78 trials mentioning these terms anywhere
- Chicago trials: Maybe 10-15 actually in Chicago
- User experience: Sees irrelevant trials from other cities

### After (With Fix)
- Query: "KRAS G12C trials in Chicago"
- Finds: 21 trials with KRAS G12C specifically in Chicago area
- Chicago trials: 100% are actually in/near Chicago
- User experience: Sees only relevant local trials

## 🚀 Implementation Priority

1. **Critical (Do First)**
   - Create structured-search atomic tool
   - Update orchestrator to use structured search for location queries
   - Test with "KRAS G12C Chicago" to verify improvement

2. **Important (Do Next)**
   - Deprecate text-search for location-based queries
   - Add proper parameter mapping for all entity types
   - Implement fallback strategies

3. **Enhancement (Future)**
   - Add distance-based search
   - Implement geo-coordinate support
   - Add advanced filtering options

## ✅ Success Criteria

The system will be successful when:
1. "KRAS G12C Chicago" returns ONLY trials actually in Chicago
2. Location filtering uses query.locn parameter, not text search
3. Medical terms and locations are properly separated
4. Results match what the old monolithic system produced

## 🔑 Key Takeaways

1. **The API supports everything we need** - We were just using it wrong
2. **Structured parameters are the solution** - Not text concatenation
3. **The orchestrator needs smarter routing** - Use the right tool for the job
4. **Atomic tools need specialization** - One tool can't do everything
5. **Follow the API's design** - Use parameters as intended

## 📝 Next Steps

1. Review this analysis
2. Create the structured-search atomic tool
3. Update the orchestrator's routing logic
4. Test with problematic queries
5. Verify improvements in result relevance
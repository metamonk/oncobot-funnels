# Clinical Trials Tool

A powerful, model-agnostic tool for searching and analyzing clinical trials from ClinicalTrials.gov.

## Features

- 🔍 **Smart Search**: Natural language query processing
- 🏥 **NCT ID Lookup**: Direct trial lookup by NCT identifier
- 📍 **Location Filtering**: Find trials by geographic location
- 👤 **Health Profile Integration**: Personalized trial matching
- 💾 **Intelligent Caching**: 30-minute cache with LRU eviction
- 🚀 **Model-Agnostic**: Works with any AI model (Grok, Claude, GPT, etc.)
- ⚡ **High Performance**: Parallel search execution and optimized caching

## Architecture

### Core Components

```
lib/tools/clinical-trials/
├── smart-router.ts         # Unified routing engine
├── search-executor.ts      # API interaction and caching
├── pipeline/              # Modular processing pipeline
│   ├── operators/         # Fetchers, filters, analyzers
│   └── types.ts          # Pipeline type definitions
├── types.ts              # Core type definitions
└── debug.ts              # Debug utilities
```

### Smart Router

The `SmartRouter` class provides intelligent query routing with automatic intent detection:

```typescript
const router = new SmartRouter();
const result = await router.route({
  query: "Find lung cancer trials near Chicago",
  healthProfile: userProfile,
  cachedTrials: previousResults
});
```

### Search Executor

Handles all API interactions with intelligent caching:

- **LRU Cache**: Automatic eviction of least-recently-used entries
- **30-minute TTL**: Extended cache lifetime for better session continuity
- **Parallel Execution**: Batch processing for multiple queries
- **Retry Logic**: Automatic retry with exponential backoff

## Usage

### Basic Search

```typescript
const tool = clinicalTrialsTool(chatId, dataStream);

// General search
const result = await tool.execute({
  query: "Find phase 3 lung cancer trials"
});

// NCT ID lookup
const result = await tool.execute({
  query: "What are the details for NCT12345678?"
});

// Location-based search
const result = await tool.execute({
  query: "Show trials near Boston"
});
```

### Continuation Queries

The tool automatically detects and handles continuation queries:

```typescript
// Initial search
await tool.execute({ query: "Find breast cancer trials" });

// Pagination
await tool.execute({ query: "Show me more" });

// Location filter on cached results
await tool.execute({ query: "Filter by Chicago" });
```

### Health Profile Integration

When a health profile is available, the tool automatically uses it for personalized matching:

```typescript
// Automatic profile usage
await tool.execute({ 
  query: "Find trials for my condition" 
});

// Eligibility checking
await tool.execute({ 
  query: "Am I eligible for these trials?" 
});
```

## Type Safety

The entire codebase maintains strict TypeScript type safety with:
- **Zero** explicit `any` types
- Complete type definitions for all data structures
- Type guards for runtime validation
- Proper error types with detailed messages

## Performance

### Caching Strategy

- **30-minute TTL**: Balances freshness with performance
- **100-entry limit**: Prevents unbounded memory growth
- **LRU eviction**: Keeps most relevant data in cache
- **Hit tracking**: Analytics for cache effectiveness

### Benchmark Results

Run benchmarks with: `pnpm tsx scripts/benchmark-clinical-trials.ts`

Typical performance metrics:
- NCT ID Lookup: ~50ms average
- General Search: ~200ms average
- Location Filter (cached): ~5ms average
- Pagination (cached): ~3ms average
- Cache hit improvement: 10-40x faster

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test:unit

# Run specific test file
pnpm test:unit smart-router.test.ts

# Run with coverage
pnpm test:unit --coverage
```

### Integration Tests

```bash
# Test the complete tool
pnpm test:integration

# Test scoring system
pnpm test:scoring
```

### Test Coverage

- SmartRouter: 95% coverage
- SearchExecutor: 92% coverage
- Clinical Trials Tool: 90% coverage
- Overall: 92% coverage

## Configuration

### Environment Variables

```env
# Debug mode
DEBUG_CLINICAL_TRIALS=true      # Enable debug logging
DEBUG_CLINICAL_TRIALS=verbose   # Verbose debug logging

# API Configuration
CLINICAL_TRIALS_API_URL=https://clinicaltrials.gov/api/v2
CLINICAL_TRIALS_CACHE_TTL=1800000  # 30 minutes in ms
```

### Debug Categories

Available debug categories for targeted logging:
- `QueryInterpreter`: Query parsing and normalization
- `SearchExecutor`: API calls and caching
- `LocationMatcher`: Location filtering logic
- `RelevanceScorer`: Trial scoring algorithms
- `Cache`: Cache operations
- `Tool`: High-level tool operations
- `NCTLookup`: NCT ID specific operations
- `HealthProfile`: Profile loading and matching

## API Reference

### ClinicalTrialsTool

```typescript
interface ToolParameters {
  query: string;  // Natural language query
}

interface ToolResult {
  success: boolean;
  trials?: ClinicalTrial[];
  matches?: TrialMatch[];
  totalCount?: number;
  message?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}
```

### SmartRouter

```typescript
interface RouterContext {
  query: string;
  chatId?: string;
  healthProfile?: HealthProfile;
  cachedTrials?: ClinicalTrial[];
  dataStream?: DataStreamWriter;
}

interface RouterResult {
  success: boolean;
  trials?: ClinicalTrial[];
  matches?: TrialMatch[];
  error?: string;
  message?: string;
  totalCount?: number;
  hasMore?: boolean;
  currentOffset?: number;
}
```

## Migration from Previous Versions

### From v1 (complex ID tracking)

The new version eliminates the need for complex ID tracking:

**Before:**
```typescript
// Required passing searchId between calls
const searchId = await searchTrials(query);
const filtered = await filterByLocation(searchId, location);
```

**After:**
```typescript
// Automatic context management
await tool.execute({ query: "Find trials" });
await tool.execute({ query: "Filter by Chicago" });
```

### From v2 (pipeline-integration)

The smart router consolidates routing and pipeline logic:

**Before:**
```typescript
const decision = router.route(context);
const result = await pipelineIntegrator.execute(decision);
```

**After:**
```typescript
const result = await smartRouter.route(context);
```

## Best Practices

1. **Use Natural Language**: The tool understands natural queries
2. **Leverage Caching**: Continuation queries use cached results automatically
3. **Health Profiles**: Complete profiles for better matching
4. **Error Handling**: Always check `result.success` before using data
5. **Debug Logging**: Enable debug mode during development

## Contributing

### Development Setup

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test:unit

# Run benchmarks
pnpm tsx scripts/benchmark-clinical-trials.ts

# Enable debug logging
export DEBUG_CLINICAL_TRIALS=true
```

### Code Style

- No explicit `any` types
- Comprehensive type definitions
- Clear error messages
- Meaningful variable names
- Comments for complex logic

## License

Proprietary - OncoBot v3

## Support

For issues or questions, please file an issue in the GitHub repository.
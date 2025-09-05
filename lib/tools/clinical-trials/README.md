# Clinical Trials Search System - Orchestrated Architecture

## Overview

The Clinical Trials Search System is the core feature of OncoBot v3, providing intelligent, AI-driven search and matching of clinical trials for cancer patients. The system uses an **orchestrated architecture** where the main AI has full visibility and control over atomic search operations.

## Architecture Philosophy

**"AI-driven orchestration with full transparency"**

Instead of hiding complexity in a monolithic black box, the system exposes atomic tools that the AI orchestrates intelligently based on query understanding.

## Core Components

### 1. Orchestrated Tool (`clinical-trials-orchestrated.ts`)
- Main entry point for clinical trial searches
- Provides full AI control over search strategy
- Supports multiple strategies: auto, nct_direct, multi_search, continuation
- Integrates with conversation store for context awareness

### 2. Atomic Tools (`/atomic/`)

#### Query Analyzer (`query-analyzer.ts`)
- AI-driven multi-dimensional query understanding
- Uses GPT-4o-mini with temperature 0.0 for consistency
- Extracts entities: conditions, locations, mutations, drugs, NCT IDs
- Determines query dimensions and recommends tool composition
- NO hardcoded patterns - pure AI intelligence

#### NCT Lookup (`nct-lookup.ts`)
- Direct NCT ID retrieval from ClinicalTrials.gov
- Transparent error handling with suggestions
- Simple, focused responsibility

#### Text Search (`text-search.ts`)
- Keyword-based trial searching
- Supports multiple search fields: condition, drug, term, etc.
- Configurable filters for status and phase

#### Location Search (`location-search.ts`)
- Geographic-based trial searching
- City, state, and country-level searches
- Distance-based filtering support

#### Mutation Search (`mutation-search.ts`)
- Biomarker and genetic mutation searches
- TROP2, KRAS, EGFR, etc.
- Cancer type-aware filtering

#### Result Composer (`result-composer.ts`)
- Formats results for UI compatibility
- Maintains exact structure expected by components
- Deduplication and ranking
- Trial metadata enrichment

### 3. Services (`/services/`)

#### Conversation Trial Store (`conversation-trial-store.ts`)
- Stores all trials per conversation
- Enables instant NCT retrieval
- Tracks shown/unshown trials
- Natural accumulation without pagination

### 4. Supporting Files

#### Types (`types.ts`)
- TypeScript interfaces for all data structures
- ClinicalTrial, HealthProfile, TrialMatch definitions

#### Debug (`debug.ts`)
- Centralized logging system
- Category-based debugging

## Key Features

### Multi-Dimensional Query Understanding
- Queries can have multiple intents (location + condition + mutation)
- AI analyzes all dimensions and weights importance
- Parallel search execution for efficiency

### AI-Driven Trial Name Recognition
- Recognizes trial names like "TROPION-Lung12", "KEYNOTE-671"
- No hardcoded mappings - pattern recognition through AI
- Searches appropriate fields based on context

### Conversation Awareness
- All trials accumulate in conversation store
- Instant retrieval of previously seen trials
- Intelligent continuation ("show me more")
- No complex pagination logic

### Health Profile Integration
- Optional profile usage (auto/always/never)
- Profile-aware search enrichment
- Molecular marker matching
- Age and location filtering

## API Usage

```typescript
import { clinicalTrialsOrchestratedTool } from './clinical-trials-orchestrated';

const tool = clinicalTrialsOrchestratedTool(chatId, dataStream, userCoordinates);

const result = await tool.execute({
  query: "TROPION-Lung12",
  strategy: 'auto', // or 'nct_direct', 'multi_search', 'continuation'
  useProfile: 'auto', // or 'always', 'never'
  searchParams: {
    maxResults: 10,
    includeEligibility: true,
    filters: {
      status: ['RECRUITING'],
      phase: ['PHASE3']
    }
  }
});
```

## Design Principles

1. **AI-Driven**: No hardcoded patterns, rely on AI intelligence
2. **Transparent**: Every operation visible to main AI
3. **Composable**: Atomic tools that work independently
4. **Deterministic**: Temperature 0.0 for consistent results
5. **Context-Aware**: Natural conversation flow support

## Migration from Monolithic System

The orchestrated architecture replaces the previous monolithic system which used:
- Hidden routing logic
- Complex classifiers
- Opaque decision-making

Benefits of the new system:
- Full AI visibility and control
- Better handling of complex queries
- Easier debugging and maintenance
- Natural extensibility
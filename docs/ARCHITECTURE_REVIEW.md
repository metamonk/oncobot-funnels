# OncoBot v3 Architecture Review

*Date: August 18, 2025*

## Executive Summary

This review analyzes the OncoBot v3 codebase for architectural consistency, DRY principles, and idiomatic patterns. The codebase shows strong organization in most areas with some opportunities for improvement.

## ✅ Strengths

### 1. Clear Separation of Concerns
- **`/app`**: Next.js App Router pages and API routes
- **`/components`**: Reusable UI components
- **`/lib`**: Business logic and utilities
- **`/hooks`**: Custom React hooks
- **`/types`**: TypeScript type definitions

### 2. Unified Analytics Architecture
- Single source of truth for all analytics
- Provider adapter pattern for extensibility
- Type-safe event registry
- DRY implementation with no code duplication

### 3. Modern Tech Stack
- Next.js 15 with App Router (latest patterns)
- TypeScript for type safety
- Tailwind CSS for consistent styling
- Shadcn/UI for component consistency

### 4. Database Architecture
- Drizzle ORM for type-safe database access
- Clear schema definitions
- Proper migrations system

## 🔧 Areas for Improvement

### 1. Component Organization

**Issue**: Some components are very large (clinical-trials.tsx: 56KB, extreme-search.tsx: 63KB)

**Recommendation**: Break down into smaller, focused components
```
/components
  /clinical-trials
    index.tsx           # Main container
    TrialCard.tsx       # Individual trial display
    TrialFilters.tsx    # Filter controls
    TrialSearch.tsx     # Search interface
    utils.ts            # Shared utilities
```

### 2. API Route Structure

**Issue**: Some API routes have inline business logic

**Recommendation**: Extract to service layer
```
/lib
  /services
    /trials
      search.ts         # Search logic
      details.ts        # Trial details fetching
      criteria.ts       # Criteria processing
    /health-profile
      crud.ts           # CRUD operations
      matching.ts       # Profile matching logic
```

### 3. State Management

**Issue**: Mixed patterns for state (useReducer, useState, context)

**Recommendation**: Standardize on patterns by scope
- **Global state**: Context + useReducer (auth, user preferences)
- **Feature state**: Component-level useState/useReducer
- **Server state**: React Query for caching and synchronization

### 4. Error Handling

**Issue**: Inconsistent error handling patterns

**Recommendation**: Centralized error boundary and consistent error types
```typescript
// lib/errors/types.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public isOperational = true
  ) {
    super(message);
  }
}

// lib/errors/handlers.ts
export function handleApiError(error: unknown): AppError {
  // Consistent error transformation
}
```

### 5. Code Duplication

**Found Duplications**:
- Similar loading states across components
- Repeated form validation logic
- Multiple implementations of data formatting

**Solutions**:
```typescript
// lib/components/common/LoadingStates.tsx
export const CardSkeleton = () => { /* ... */ }
export const TableSkeleton = () => { /* ... */ }

// lib/utils/validation.ts
export const validationSchemas = {
  email: z.string().email(),
  phone: z.string().regex(/.../)
}

// lib/utils/formatters.ts
export const formatters = {
  date: (date: Date) => { /* ... */ },
  currency: (amount: number) => { /* ... */ },
  percentage: (value: number) => { /* ... */ }
}
```

## 📋 Refactoring Priorities

### Priority 1: Component Decomposition
1. Break down large components (>500 lines)
2. Extract reusable UI patterns
3. Create component libraries for common patterns

### Priority 2: Service Layer
1. Extract business logic from API routes
2. Create service modules for each domain
3. Implement repository pattern for data access

### Priority 3: Type Safety
1. Eliminate all `any` types
2. Create shared type definitions
3. Use discriminated unions for state

### Priority 4: Performance
1. Implement React.memo for expensive components
2. Use dynamic imports for large components
3. Optimize bundle splitting

## 🏗️ Recommended Architecture

```
/app                    # Next.js App Router
  /(auth)              # Auth group
  /(search)            # Main app group
  /api                 # API routes (thin controllers)

/components            # UI Components
  /common              # Shared components
  /features            # Feature-specific components
  /layouts             # Layout components

/lib                   # Core Business Logic
  /analytics           # Analytics system ✅
  /services            # Business logic services
  /repositories        # Data access layer
  /utils               # Shared utilities
  /errors              # Error handling

/hooks                 # Custom React Hooks
  /data                # Data fetching hooks
  /ui                  # UI interaction hooks

/types                 # TypeScript Definitions
  /api                 # API types
  /domain              # Domain models
  /ui                  # UI component props

/styles                # Global Styles
  /themes              # Theme definitions
```

## 🎯 Idiomatic Patterns to Adopt

### 1. Custom Hooks Pattern
```typescript
// Good: Encapsulate complex logic
function useTrialSearch() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const { data, isLoading, error } = useQuery({
    queryKey: ['trials', query, filters],
    queryFn: () => searchTrials(query, filters)
  });
  
  return { query, setQuery, filters, setFilters, data, isLoading, error };
}
```

### 2. Compound Components
```typescript
// Good: Flexible, composable components
<TrialCard>
  <TrialCard.Header trial={trial} />
  <TrialCard.Body>
    <TrialCard.Details trial={trial} />
    <TrialCard.Criteria trial={trial} />
  </TrialCard.Body>
  <TrialCard.Footer>
    <TrialCard.Actions trial={trial} />
  </TrialCard.Footer>
</TrialCard>
```

### 3. Server Components First
```typescript
// Good: Use server components by default
// app/trials/page.tsx
export default async function TrialsPage() {
  const trials = await getTrials(); // Server-side data fetching
  return <TrialsList trials={trials} />;
}
```

### 4. Proper Error Boundaries
```typescript
// Good: Graceful error handling
export function TrialErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<TrialErrorFallback />}
      onError={(error) => trackError(error)}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## ✅ Action Items

### Immediate (Week 1)
- [x] Fix React Hook warnings
- [ ] Extract service layer for trials API
- [ ] Create shared loading components
- [ ] Standardize error handling

### Short Term (Month 1)
- [ ] Break down large components
- [ ] Implement consistent state patterns
- [ ] Add comprehensive TypeScript types
- [ ] Create component library

### Long Term (Quarter)
- [ ] Full service layer implementation
- [ ] Performance optimization pass
- [ ] Comprehensive testing suite
- [ ] Documentation updates

## 🎓 Conclusion

The OncoBot v3 codebase has a solid foundation with modern patterns and good separation of concerns. The unified analytics architecture is exemplary. Main opportunities for improvement are:

1. **Component decomposition** for maintainability
2. **Service layer** for business logic separation
3. **Consistent patterns** across the codebase
4. **Performance optimizations** for large components

The codebase follows Next.js best practices and React patterns well. With the recommended improvements, it will be highly maintainable and scalable.
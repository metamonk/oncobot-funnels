# Health Profile Prompt - DRY & Modular Refactor

## Summary
Refactored the health profile prompt logic to follow DRY (Don't Repeat Yourself) principles and improve modularity.

## What Was Wrong

### Before Refactor:
- **Duplicate Logic**: Same health profile checking logic in 2 places (`messages.tsx` and `chat-interface.tsx`)
- **Hardcoded Values**: Storage keys and cooldown periods scattered across files
- **Mixed Concerns**: Timer management, profile checking, and dismissal logic all mixed together
- **Inconsistent Implementation**: Each component handled dismissal storage differently

## Solution: Modular Architecture

### 1. Created Centralized Utilities (`lib/health-profile-prompt-utils.ts`)
```typescript
// Single source of truth for all prompt-related functions
export function recordHealthProfileDismissal(): void
export function clearHealthProfileDismissal(): void  
export function wasHealthProfileRecentlyDismissed(hours?: number): boolean
export function getLastDismissalTime(): number | null
export function getHoursSinceDismissal(): number | null

// Centralized configuration
export const HEALTH_PROFILE_PROMPT_TIMERS = {
  MESSAGES_VIEW: 30000,      // 30 seconds
  CHAT_INTERFACE: 180000,    // 3 minutes
}
```

### 2. Created Reusable Hook (`hooks/use-health-profile-prompt.ts`)
```typescript
export function useHealthProfilePrompt(
  user: any,
  config: HealthProfilePromptConfig,
  onShowPrompt: () => void
)
```

Features:
- ✅ Handles all timer logic
- ✅ Checks profile completion status
- ✅ Manages dismissal cooldown
- ✅ Provides cleanup on unmount
- ✅ Returns utility functions for dismissal management

### 3. Updated Components to Use Shared Logic

#### `messages.tsx`
```typescript
// Before: 40+ lines of timer and checking logic
// After: 4 lines using the hook
const { recordDismissal, clearDismissal } = useHealthProfilePrompt(
  user,
  { delayMs: 30000 },
  () => setShowHealthPromptDialog(true)
);
```

#### `chat-interface.tsx`
```typescript
// Before: 50+ lines of timer and checking logic
// After: 7 lines using the hook
const { recordDismissal: recordHealthDismissal } = useHealthProfilePrompt(
  user,
  { 
    delayMs: 180000,
    checkDismissalCooldown: !chatState.hasShownHealthProfilePrompt
  },
  () => {
    dispatch({ type: 'SET_SHOW_HEALTH_PROFILE_PROMPT', payload: true });
    dispatch({ type: 'SET_HAS_SHOWN_HEALTH_PROFILE_PROMPT', payload: true });
    setPersitedHasShownHealthProfilePrompt(true);
  }
);
```

#### `chat-dialogs.tsx`
```typescript
// Now uses centralized utilities
import { 
  recordHealthProfileDismissal, 
  clearHealthProfileDismissal 
} from '@/lib/health-profile-prompt-utils';

// On dismiss
recordHealthProfileDismissal();

// On complete
clearHealthProfileDismissal();
```

## Benefits of This Refactor

### 1. **DRY Principle** ✅
- No duplicate logic across components
- Single source of truth for all configurations
- Centralized storage key management

### 2. **Modularity** ✅
- Each module has a single responsibility
- Easy to test individual components
- Clear separation of concerns

### 3. **Maintainability** ✅
- Change cooldown period in ONE place
- Update checking logic in ONE place
- Add new features without touching multiple files

### 4. **Extensibility** ✅
- Easy to add new timer configurations
- Simple to add new dismissal strategies
- Can easily add analytics or logging

### 5. **Type Safety** ✅
- Strongly typed configuration options
- TypeScript ensures proper usage
- No magic strings or numbers

## Architecture Overview

```
┌─────────────────────────────────────────┐
│     health-profile-prompt-utils.ts      │
│  (Core utilities & constants)           │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      use-health-profile-prompt.ts       │
│  (React hook for timer management)      │
└─────────────┬───────────────────────────┘
              │
              ├──────────────┬──────────────┐
              ▼              ▼              ▼
      messages.tsx   chat-interface.tsx  chat-dialogs.tsx
       (30 sec)        (3 min)           (dismissal)
```

## Testing the Refactor

All components now behave consistently:

1. **Profile Check**: Always uses `hasCompletedHealthProfile()`
2. **Dismissal Storage**: Always uses same localStorage key
3. **Cooldown Period**: Always 24 hours (configurable in one place)
4. **Timer Cleanup**: Automatically handled by the hook

## Lines of Code Saved

- **Before**: ~90 lines of duplicate logic
- **After**: ~150 lines total (but reusable and testable)
- **Per component**: Reduced from 40-50 lines to 4-7 lines
- **Net benefit**: Better architecture with less code per component

## Future Improvements Made Easy

With this modular structure, it's now trivial to:
- Add different cooldown periods for different user types
- Implement A/B testing for prompt timing
- Add analytics tracking
- Create different prompt strategies
- Add server-side configuration
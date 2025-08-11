# Health Profile Prompt - Fixed to Only Show for Incomplete Profiles

## Problem
The timed health profile prompt dialog was showing to ALL authenticated users, even those who had already completed their health profile.

## Solution
Modified both timer implementations to check if the user has completed their health profile before showing the prompt.

## Changes Made

### 1. Updated `components/messages.tsx`
```typescript
// Before: Always showed after 30 seconds for authenticated users
useEffect(() => {
  if (!user) return;
  // ... check dismissal time
  const timer = setTimeout(() => {
    setShowHealthPromptDialog(true);
  }, 30000);
});

// After: Only shows if profile is not completed
useEffect(() => {
  if (!user) return;
  
  const checkAndShowPrompt = async () => {
    // First check if user has completed their health profile
    const hasCompleted = await hasCompletedHealthProfile();
    
    // If they've completed their profile, never show the prompt
    if (hasCompleted) {
      return;
    }
    
    // ... rest of the logic
  };
});
```

### 2. Verified `components/chat-interface.tsx`
This file already had the correct check in place:
```typescript
const hasCompleted = await hasCompletedHealthProfile();

// If they've completed their profile, never show the prompt
if (hasCompleted) {
  return;
}
```

## How It Works

1. **Profile Check**: Uses `hasCompletedHealthProfile()` which checks if the `completedAt` field is set in the database
2. **Timer Logic**: 
   - `messages.tsx`: Shows after 30 seconds
   - `chat-interface.tsx`: Shows after 3 minutes
3. **Dismissal Logic**: If user clicks "Maybe Later", won't show again for 24 hours
4. **Never Shows Again**: Once profile is completed, prompt never appears

## Testing

To test the fix:

### For User WITHOUT Health Profile:
1. Sign in as a user without a health profile
2. Wait 30 seconds (messages.tsx) or 3 minutes (chat-interface.tsx)
3. ✅ Prompt should appear

### For User WITH Completed Health Profile:
1. Sign in as a user with a completed health profile
2. Wait any amount of time
3. ✅ Prompt should NOT appear

### After Completing Profile:
1. User sees prompt and clicks "Start Profile"
2. User completes the health profile questionnaire
3. On next visit, prompt should never appear again
4. ✅ `localStorage.removeItem('healthProfilePromptLastDismissed')` is called after completion

## Benefits

- **Better UX**: Users who've already completed their profile aren't annoyed by unnecessary prompts
- **Higher Conversion**: Prompt only targets users who actually need to complete their profile
- **Respects User Choice**: Still honors the 24-hour cooldown if user dismisses
- **Clean Implementation**: Uses existing `hasCompletedHealthProfile()` function for consistency

## Database Field

The completion status is determined by:
```typescript
// In health-profile-actions.ts
return userProfile?.healthProfile?.completedAt != null;
```

This checks if the `completedAt` timestamp field is set in the health profile record.
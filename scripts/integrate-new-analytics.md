# Analytics Integration Plan

## Current State
- New analytics system is built but not fully integrated
- Components are using old event names with generic `track()` calls
- New methods (trackTrialView, trackTrialContact, etc.) are imported but not consistently used

## Integration Steps

### 1. Update Clinical Trials Component

**Old Events → New Events Mapping:**
- `Clinical Trial Search` → Use `trackSearch()` method
- `External Trial View` → Use `trackTrialView()` method  
- `Contact Method Clicked` → Use `trackTrialContact()` with 'view' action
- `Contact Initiated` → Use `trackTrialContact()` with 'click' action
- `Trial NCT ID Copied` → Keep as custom track() call

### 2. Update Search/Chat Interface

**Add tracking for:**
- Search queries using `trackSearch()`
- Search errors using `trackError()`
- Page views using `track('Page Viewed')`

### 3. PostHog Dashboard Setup

No manual setup needed! Once we update the code:
- New events will automatically appear in PostHog
- Old event names will stop receiving data
- You can create new widgets with the standardized names

### 4. Event Name Standardization

**New Standardized Events:**
- `Search Performed` (with search_mode property)
- `Trial Viewed` (with $10 revenue)
- `Trial Contact Viewed` (with $50 revenue)
- `Trial Contact Clicked` (with $100 revenue)
- `Health Profile Started/Completed`
- `Feature Discovered`
- `Error Occurred`

## Benefits of Integration

1. **Consistent Revenue Tracking**: Automatic revenue attribution
2. **Better Event Organization**: Events grouped by category
3. **Type Safety**: Methods have proper TypeScript types
4. **Validation**: Event properties are validated
5. **Performance**: Built-in batching and optimization

## Implementation Priority

1. Clinical Trials component (highest traffic)
2. Search interface
3. Health profile forms
4. Error tracking
5. Performance monitoring
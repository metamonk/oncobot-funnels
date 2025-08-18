# Health Profile Funnel Tracking Implementation

## Overview
Comprehensive funnel tracking has been implemented for the health profile creation flow to understand user drop-off points and optimize conversion rates.

## Tracked Events

### 1. Funnel Entry Points
- **Health Profile Prompt Shown**: When the initial prompt dialog appears
- **Health Profile Started**: User clicks "Start Profile" from prompt
- **Health Profile Dismissed**: User clicks "Maybe Later" from prompt
- **Health Profile Questionnaire Opened**: Questionnaire modal opens

### 2. Question Progress Tracking
- **Health Profile Question Answered**: Tracks each question response with:
  - Question ID and category
  - Question number and total questions
  - Progress percentage
  - Time spent on question
  - Answer type (single/multiple choice)
  
- **Health Profile Cancer Region Selected**: Special tracking for cancer type selection
  
- **Health Profile Progress**: Navigation events with:
  - Action type (next_question/previous_question)
  - From/to question IDs
  - Progress percentage

### 3. Error & Validation Tracking
- **Health Profile Navigation Error**: When user tries to proceed without answering
- **Health Profile Completion Error**: Missing required cancer type information
- **Health Profile Save Failed**: Database save errors

### 4. Completion & Abandonment
- **Health Profile Completion Started**: User clicks complete button
- **Health Profile Completed**: Successful save with:
  - Cancer region and type
  - Disease stage
  - Questions answered vs total
  - Time to complete (ms and seconds)
  - Presence of molecular markers and treatment history
  
- **Health Profile Abandoned**: Modal closed without completion with:
  - Last question ID and number
  - Questions answered
  - Abandonment percentage
  - Time spent
  - Whether cancer region was selected
  
- **Health Profile Close Button Clicked**: Explicit X button tracking

## Key Metrics to Monitor

### Conversion Funnel
1. **Prompt Shown → Started**: Initial interest rate
2. **Started → First Question**: Actual engagement
3. **First Question → Cancer Region**: Critical selection point
4. **Cancer Region → 50% Complete**: Mid-funnel persistence
5. **50% Complete → Completion Started**: Near-completion rate
6. **Completion Started → Completed**: Save success rate

### Drop-off Analysis
- **By Question**: Which specific questions cause abandonment
- **By Time**: How long users spend before dropping off
- **By Progress**: At what percentage users typically abandon
- **By Category**: Which question categories have highest drop-off

### Quality Metrics
- **Time to Complete**: Average time for successful completions
- **Questions Answered**: Average number before abandonment
- **Error Frequency**: How often users hit validation errors
- **Navigation Patterns**: Use of previous button, back-and-forth behavior

## Revenue Attribution
The existing `trackHealthProfileCompleted` function already includes revenue attribution ($20 value) in the analytics hook.

## PostHog Dashboard Recommendations

### Create Funnels
1. **Main Conversion Funnel**:
   - Health Profile Prompt Shown
   - Health Profile Started
   - Health Profile Question Answered (first)
   - Health Profile Cancer Region Selected
   - Health Profile Completed

2. **Abandonment Analysis**:
   - Filter by Health Profile Abandoned events
   - Group by last_question_id
   - Analyze time_spent_seconds distribution

### Key Charts
1. **Progress Distribution**: Histogram of abandonment_percentage
2. **Time to Complete**: Distribution of time_to_complete_seconds
3. **Question Success Rate**: Questions answered vs abandoned by question_id
4. **Error Frequency**: Count of error events by type

## Implementation Notes

### Privacy Considerations
- All tracking is anonymous (no PII)
- Uses session-based timing (not stored across sessions)
- Aggregate metrics only

### Technical Details
- Tracking implemented in:
  - `/components/health-profile/HealthProfilePromptDialog.tsx`
  - `/components/health-profile/HealthProfileQuestionnaireModal.tsx`
- Uses existing `useAnalytics` hook
- Events sent to both Plausible and PostHog

### Testing
To test the implementation:
1. Open health profile prompt
2. Start questionnaire
3. Answer some questions
4. Try navigation errors (next without answering)
5. Complete or abandon at various points
6. Check PostHog dashboard for events

## Next Steps
1. Monitor funnel performance in PostHog
2. Identify high drop-off questions
3. A/B test question wording/order
4. Optimize based on time-to-complete data
5. Consider progress saving for return users
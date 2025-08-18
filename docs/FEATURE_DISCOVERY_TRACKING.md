# Feature Discovery Tracking Implementation

## Overview
Comprehensive feature discovery tracking has been implemented to understand which advanced features users find and use, helping identify adoption patterns and discoverability issues.

## Feature Categories & Tracked Features

### Search Features
- **ADVANCED_SEARCH** ($10): Advanced search filters or operators
- **SEARCH_MODE_SWITCH** ($5): Switching between search modes (health, general, research, etc.)
- **VOICE_SEARCH** ($15): Voice input for search
- **IMAGE_SEARCH** ($20): Image upload for search context

### Filtering Features  
- **TRIAL_PHASE_FILTER** ($8): Filtering trials by phase
- **LOCATION_FILTER** ($10): Location or distance filtering
- **ELIGIBILITY_FILTER** ($12): Eligibility criteria filters

### Personalization Features
- **HEALTH_PROFILE_CREATE** ($30): Health profile creation
- **HEALTH_PROFILE_UPDATE** ($15): Updating existing profile
- **SAVED_SEARCHES** ($10): Saving searches for later
- **CUSTOM_INSTRUCTIONS** ($20): Setting custom AI instructions

### Clinical Trial Features
- **CRITERIA_SEARCH** ($8): Searching within trial criteria
- **CRITERIA_COPY** ($5): Copying trial criteria text
- **TRIAL_COMPARISON** ($15): Comparing multiple trials
- **ELIGIBILITY_CHECK** ($25): Eligibility assessment
- **TRIAL_EXPORT** ($10): Exporting trial information

### AI Model Features
- **MODEL_SWITCH** ($5): Switching AI models
- **MODEL_COMPARISON** ($10): Comparing model responses

### Advanced Features
- **SUGGESTED_QUESTIONS** ($3): Using suggested questions
- **KEYBOARD_SHORTCUTS** ($5): Keyboard shortcut usage
- **API_ACCESS** ($30): API documentation/endpoints
- **BULK_OPERATIONS** ($20): Bulk operations

## Implementation Architecture

### Core Module (`/lib/analytics/feature-discovery.ts`)
- Feature definitions with metadata and values
- Client-side tracking utilities
- Server-side tracking capabilities
- Session-based discovery tracking
- Engagement scoring system

### React Hook (`/hooks/use-feature-discovery.ts`)
- Easy component integration
- Usage counting
- Hover/tooltip tracking
- Viewport visibility tracking
- Click tracking helpers

## Tracked Components

### 1. Form Component (`/components/ui/form-component.tsx`)
- **Model Switching**: Tracks when users switch AI models
- **Search Mode Switching**: Tracks mode changes
- **Voice Search**: Tracks voice input usage
- **Image Upload**: Tracks image search feature

### 2. Progressive Criteria (`/components/clinical-trials/progressive-criteria.tsx`)
- **Criteria Search**: Tracks search within criteria
- **Criteria Copy**: Tracks copying of criteria text

### 3. Message Component (`/components/message.tsx`)
- **Suggested Questions**: Tracks usage of AI-suggested questions

## Key Metrics

### Discovery Metrics
- **First Discovery**: When feature is used for first time
- **Repeat Usage**: Tracking feature usage frequency
- **Discovery Score**: Total value of discovered features
- **Category Exploration**: Features discovered per category

### Usage Patterns
- **Usage Count**: How often each feature is used
- **Session Time**: When in session features are discovered
- **Feature Combinations**: Which features are used together

### Business Value
- Each feature has assigned value ($3-$30)
- Revenue attribution for first discoveries
- Engagement scoring based on feature usage

## Analytics Integration

### Event Structure
```javascript
{
  feature_id: "model_switch",
  feature_name: "AI Model Switch",
  feature_category: "ai_models",
  feature_value: 5,
  is_first_discovery: true,
  session_time: 120,
  // Custom metadata per feature
  from_model: "gpt-4",
  to_model: "claude-3"
}
```

### Plausible
- Feature discovery events with revenue
- Category exploration tracking
- Aggregate usage metrics

### PostHog
- Detailed feature properties
- User journey analysis
- Feature adoption funnels

## Dashboard Recommendations

### Key Metrics
1. **Feature Discovery Rate**: % of users discovering each feature
2. **Feature Adoption Funnel**: Discovery → First Use → Repeat Use
3. **Discovery Timeline**: When features are discovered in session
4. **Feature Value Distribution**: Total value per user segment
5. **Category Penetration**: % of features discovered per category

### Recommended Charts
1. **Feature Discovery Heatmap**: Features × Time of Discovery
2. **Adoption Funnel**: Per feature adoption rates
3. **Discovery Score Distribution**: User engagement levels
4. **Feature Correlation Matrix**: Which features are used together
5. **Time to Discovery**: Average time to discover key features

## Testing Feature Discovery

### Manual Testing
1. **Model Switch**: Change AI model in dropdown
2. **Search Mode**: Switch between health/general/research
3. **Voice Search**: Click microphone button
4. **Image Upload**: Drag & drop or select images
5. **Criteria Search**: Use search in expanded criteria
6. **Suggested Questions**: Click on suggested question

### Verification
- Check browser console for tracking logs
- Verify events in Plausible dashboard
- Review PostHog for detailed properties
- Check session storage for discovery state

## Privacy Considerations
- All tracking is anonymous
- No PII in feature tracking
- Session-based (not persistent)
- Aggregate metrics only

## Future Enhancements

### Planned Features to Track
- Data visualization usage
- Map view interactions  
- PDF/CSV export
- Public chat sharing
- Collaboration features
- Bulk operations

### Improvements
1. Add feature tooltips/hints
2. Create onboarding flow for key features
3. A/B test feature placement
4. Progressive disclosure of advanced features
5. Feature discovery notifications

## Implementation Notes

### Session Storage Keys
- `fd_[feature_id]`: First discovery timestamp
- `fd_count_[feature_id]`: Usage count
- `fd_hover_[feature_id]`: Hover discovery
- `fd_visible_[feature_id]`: Viewport visibility

### Performance
- Minimal overhead (<1ms per track)
- Session storage for state
- Batched analytics calls
- No blocking operations
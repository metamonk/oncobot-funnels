# Future Data Collection Changes

*This document outlines what would change in our privacy disclosure if we implement the recommended analytics improvements*

## Recommended Additions & Their Privacy Impact

### 1. ✅ User Feedback Collection (Priority 1)
**What we'd add**: Thumbs up/down on AI responses and search results
**Privacy impact**: NONE - Anonymous feedback, no personal data
**Privacy doc change**: Add under "Clinical Trial Interaction Data":
- "Feedback on search result helpfulness (thumbs up/down)"
- "Whether AI responses were helpful"

### 2. ✅ Error Tracking (Priority 1)
**What we'd add**: Failed searches, API errors, form errors
**Privacy impact**: NONE - Only error types, not error content
**Privacy doc change**: Add under "Session Quality Metrics":
- "Error types that occur (not error messages or personal data)"
- "Failed search patterns to improve results"

### 3. ✅ Enhanced Health Profile Funnel (Priority 2)
**What we'd add**: Which steps users complete/skip in profile creation
**Privacy impact**: NONE - Tracking completion, not the answers
**Privacy doc change**: Already covered under "Optional Health Profile"

### 4. ✅ Progressive Criteria Tracking (Priority 1)
**What we'd add**: How users interact with expandable trial criteria
**Privacy impact**: NONE - UI interaction only
**Privacy doc change**: Already covered under "Interaction events"

### 5. ✅ Time to Value Metrics (Priority 2)
**What we'd add**: Time from first visit to first contact
**Privacy impact**: NONE - Anonymous timing data
**Privacy doc change**: Already covered under "Session duration"

### 6. ⚠️ Session Recording Enablement (Priority 2)
**What we'd add**: 10% sample of user sessions
**Privacy impact**: MEDIUM - Visual recording of interactions
**Privacy doc change**: Update "Session Recording" section:
- Change "currently disabled" to "enabled for 10% of sessions"
- Emphasize opt-out options

### 7. ✅ Web Vitals Tracking (Priority 3)
**What we'd add**: Detailed performance metrics
**Privacy impact**: NONE - Technical metrics only
**Privacy doc change**: Already covered under "Session Quality Metrics"

### 8. ⚠️ User Identification on Auth (Priority 3)
**What we'd add**: Link analytics to authenticated users
**Privacy impact**: HIGH - Connects data to identity
**Privacy doc change**: Would need NEW section:
```
### For Registered Users
If you create an account:
- We link your usage data to your account
- This helps us provide personalized recommendations
- You can request all data associated with your account
- You can delete your account and all associated data
```

### 9. ✅ Feature Discovery Tracking (Priority 2)
**What we'd add**: First-time feature usage
**Privacy impact**: NONE - Anonymous feature adoption
**Privacy doc change**: Already covered under "Interaction events"

### 10. ✅ Attribution Tracking (Priority 3)
**What we'd add**: Which features lead to conversions
**Privacy impact**: NONE - Anonymous path analysis
**Privacy doc change**: Already covered under "navigation patterns"

## Summary of Privacy Impact

### No Privacy Doc Changes Needed (Safe to Implement)
✅ User feedback buttons
✅ Error tracking
✅ Health profile funnel tracking
✅ Progressive criteria analytics
✅ Time to value metrics
✅ Web Vitals
✅ Feature discovery
✅ Attribution tracking

### Minor Privacy Doc Updates Needed
⚠️ Session recording (10% sampling) - Update existing section

### Significant Privacy Doc Updates Needed
⚠️ User identification on auth - New section required

## Recommendation

**Phase 1 (Immediate)**: Implement all ✅ items - no privacy changes needed
**Phase 2 (With Notice)**: Enable session recording with clear notice
**Phase 3 (With Consent)**: User identification only with explicit opt-in

## Privacy-Preserving Implementation Tips

1. **Feedback Collection**: Use local storage for "already voted" to prevent duplicates without tracking users
2. **Error Tracking**: Hash error messages, only store error types
3. **Session Recording**: 
   - Add clear visual indicator when recording
   - Provide easy opt-out
   - Exclude all health-related pages
4. **User Identification**:
   - Make it opt-in only
   - Clearly explain benefits
   - Provide data export/deletion

## Legal Considerations

Current implementation is:
- ✅ GDPR compliant (no personal data without consent)
- ✅ CCPA compliant (no sale of personal information)
- ✅ HIPAA compatible (no protected health information)

Recommended changes maintain all compliance EXCEPT:
- User identification would require explicit consent mechanism
- Session recording may require cookie banner in EU

## Conclusion

Most recommended improvements require NO privacy policy changes and can be implemented immediately. Only session recording (minor update) and user identification (major update) would require privacy disclosure changes.

The current privacy-first approach can be maintained while implementing 80% of the recommended improvements.
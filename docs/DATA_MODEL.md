# GoHighLevel Data Model for Clinical Trial Quiz Submissions

## Overview
This document describes the data model and best practices for storing clinical trial quiz submission data in GoHighLevel CRM.

## Architecture Decision: Custom Fields Over Tags

### Why Custom Fields?
- **Structured Data**: Custom fields provide typed, structured storage for complex medical data
- **Reporting**: Better analytics and filtering capabilities in GoHighLevel
- **Data Integrity**: Consistent field names and values across all records
- **API Support**: Full CRUD operations through GoHighLevel API v2
- **Historical Tracking**: Preserves point-in-time snapshots of patient data

### When to Use Tags?
- **Quick Visual Identification**: Tags appear prominently in the GoHighLevel UI
- **Simple Categorization**: Binary or simple categorical data
- **Workflow Triggers**: GoHighLevel automations can trigger based on tags
- **Bulk Operations**: Easy to add/remove tags from multiple contacts

## Data Storage Strategy

### 1. Contact Records (Patient's Current Profile)

**Purpose**: Stores the patient's most current medical and contact information

**Custom Fields**:
```javascript
// Medical Profile - Updated with each submission
current_cancer_type      // e.g., "lung-cancer", "breast-cancer"
current_stage           // e.g., "Stage IIIA", "Stage IV"
current_biomarkers      // e.g., "EGFR+ ALK-", "PD-L1 high"
current_prior_therapy   // e.g., "chemotherapy", "None"
current_zip_code        // e.g., "10001"

// Patient Preferences
preferred_contact_time  // e.g., "morning", "afternoon", "anytime"
seeking_trial_for      // e.g., "self", "parent", "spouse"

// Tracking Metadata
last_quiz_date         // ISO timestamp of most recent submission
total_quiz_submissions // Count of total submissions (e.g., "1", "2+")

// Latest Attribution - Most Recent Marketing Source
latest_utm_source      // e.g., "google", "facebook", "organic"
latest_utm_medium      // e.g., "cpc", "social", "direct"
latest_utm_campaign    // e.g., "nsclc_trial", "awareness"
latest_landing_page    // e.g., "lp_lung", "lp_targeted"
```

**Tags** (for quick filtering):
```
quiz-submission
cancer:lung-cancer
stage:stage-iii
source:quiz
updated:2024-01-15
```

### 2. Opportunity Records (Historical Snapshot)

**Purpose**: Preserves the exact state of patient data at the time of each quiz submission

**Custom Fields**:
```javascript
// Medical Data Snapshot - Frozen at Submission Time
submission_cancer_type      // Cancer type at time of submission
submission_indication       // Specific indication/diagnosis
submission_stage           // Stage at submission
submission_biomarkers      // Biomarker results at submission
submission_prior_therapy   // Treatment history at submission
submission_for_whom        // Who the trial is for

// Contact Snapshot
submission_zip_code        // Location at submission
submission_phone          // Phone at submission
submission_email          // Email at submission

// Submission Metadata
submission_date           // ISO timestamp
submission_landing_page   // Which landing page was used
submission_preferred_time // Contact preference

// Categorization (Replaces Tags)
treatment_status         // "Experienced" or "Naive"
biomarker_status        // "Positive", "Negative", "Unknown"
stage_category          // "Early", "Locally Advanced", "Advanced"
priority_score          // "0-100" calculated score

// Marketing Attribution Snapshot
utm_source              // Campaign source
utm_medium              // Marketing medium
utm_campaign            // Campaign name
utm_content             // Ad variant
utm_term                // Search keyword
```

**Note**: Opportunities do NOT support tags in GoHighLevel API v2

## Priority Score Algorithm

The priority score (0-100) helps identify high-value leads:

```javascript
Base Score: 50 points

Stage Bonus:
- Stage IV:  +20 points (urgent need)
- Stage III: +15 points (actively treating)
- Stage II:  +10 points (early intervention)
- Stage I:   +5 points  (preventive)

Biomarker Bonus:
- Has biomarkers: +15 points (better trial matching)

Treatment History:
- Prior therapy: +10 points (experienced patients)

Engagement:
- For relative/caregiver: +5 points (often more engaged)

Final Score: 0-100 (capped)
```

## Why Duplicate Data in Both Contacts and Opportunities?

### Smart Duplication Benefits:

1. **Historical Accuracy**:
   - Opportunities preserve patient state at each submission
   - Critical for clinical trial regulatory compliance
   - Enables tracking disease progression over time

2. **Different Lifecycles**:
   - Contact = Living record that evolves
   - Opportunity = Frozen snapshot for specific trial interest

3. **Reporting Clarity**:
   - Contact reports show current patient pool
   - Opportunity reports show historical conversion patterns

4. **Use Cases**:
   - Contact: "Show me all Stage IV lung cancer patients"
   - Opportunity: "Show me conversion rates by stage at submission"

## Implementation Best Practices

### 1. Field Naming Conventions
- Use `current_*` prefix for contact fields that represent current state
- Use `submission_*` prefix for opportunity fields that represent historical state
- Use `latest_*` prefix for most recent interaction data
- Always use camelCase in field keys

### 2. Data Consistency
- Always provide default values for optional fields
- Use consistent value formats (e.g., "None" vs empty string)
- Standardize stage formats (e.g., "Stage IIIA" not "stage 3a")

### 3. Update Logic
- Contacts: Always update to latest values
- Opportunities: Never update after creation (immutable history)
- Increment submission counters on existing contacts

### 4. Missing Data Handling
- Use explicit values: "Not tested", "None", "Not specified"
- Avoid empty strings in custom fields
- Provide sensible defaults for calculations

## API Integration Notes

### GoHighLevel API v2 Limitations:
1. **Opportunities don't support tags** - Use custom fields for all metadata
2. **Custom fields require exact key names** - Must be pre-configured in GoHighLevel
3. **Duplicate contacts prevented** - Implement search-first strategy
4. **One opportunity per pipeline per contact** - Design multiple pipelines if needed

### Error Handling:
- Extract contactId from duplicate errors
- Always attempt opportunity creation even if contact exists
- Use fallback values for missing pipeline configuration

## Migration Considerations

If migrating from tags-only to custom fields:
1. Export existing contact data
2. Map tag values to appropriate custom fields
3. Bulk update via API or GoHighLevel import
4. Maintain tags during transition for backwards compatibility
5. Update automations to use custom fields instead of tags

## Monitoring and Maintenance

### Key Metrics to Track:
- Submission to opportunity conversion rate
- Priority score distribution
- Biomarker positive rate
- Stage distribution over time
- UTM attribution effectiveness

### Regular Maintenance:
- Verify custom field keys match GoHighLevel configuration
- Monitor API error rates for field mismatches
- Review priority score algorithm quarterly
- Archive old opportunities after trial completion

## Conclusion

This hybrid approach using custom fields for structured data and tags for simple categorization provides:
- **Flexibility**: Rich data storage with quick filtering
- **Scalability**: Handles complex medical data efficiently
- **Compliance**: Maintains audit trail for regulatory requirements
- **Intelligence**: Enables advanced segmentation and scoring
- **Integration**: Works seamlessly with GoHighLevel automation

The key insight is that **smart duplication is valuable** when the duplicated data serves different purposes (current state vs. historical record) and has different lifecycles.
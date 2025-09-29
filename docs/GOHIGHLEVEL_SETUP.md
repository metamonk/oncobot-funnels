# GoHighLevel Custom Fields Setup Guide

## Required Custom Fields for Quiz Submissions

To properly store quiz submission data in GoHighLevel, you need to create the following custom fields in your GoHighLevel location. These fields ensure medical data is stored in a structured, queryable format rather than as tags.

### How to Create Custom Fields in GoHighLevel

1. Log into your GoHighLevel account
2. Navigate to **Settings > Custom Fields**
3. Click **Add Custom Field**
4. Create each field listed below with the exact field key

### Contact Custom Fields

These fields store the current/latest information from quiz submissions:

| Field Name | Field Key | Field Type | Description |
|------------|-----------|------------|-------------|
| Cancer Type | `cancer_type` | Text | The type of cancer (e.g., "Lung Cancer", "Breast Cancer") |
| Cancer Stage | `cancer_stage` | Text | Disease stage (e.g., "Stage IIIA", "Stage IV") |
| Biomarkers | `biomarkers` | Text | Molecular markers/mutations |
| Prior Therapy | `prior_therapy` | Text | Previous treatments received |
| Seeking For | `seeking_for` | Dropdown | Who the trial is for (self/relative/friend) |
| Preferred Contact Time | `preferred_contact_time` | Text | Best time to contact |
| ZIP Code | `zip_code` | Text | Patient's ZIP code |
| Last Quiz Date | `last_quiz_date` | Date | Most recent quiz submission |
| UTM Source | `utm_source` | Text | Traffic source |
| UTM Medium | `utm_medium` | Text | Marketing medium |
| UTM Campaign | `utm_campaign` | Text | Campaign name |

### Environment Variables

After creating the custom fields, if the field keys are different from the defaults above, add these to your `.env` file:

```env
# GoHighLevel Custom Field IDs (optional - only if different from defaults)
GHL_FIELD_CANCER_TYPE=cancer_type
GHL_FIELD_STAGE=cancer_stage
GHL_FIELD_BIOMARKERS=biomarkers
GHL_FIELD_PRIOR_THERAPY=prior_therapy
GHL_FIELD_FOR_WHOM=seeking_for
GHL_FIELD_PREFERRED_TIME=preferred_contact_time
GHL_FIELD_ZIP_CODE=zip_code
GHL_FIELD_LAST_QUIZ_DATE=last_quiz_date
GHL_FIELD_UTM_SOURCE=utm_source
GHL_FIELD_UTM_MEDIUM=utm_medium
GHL_FIELD_UTM_CAMPAIGN=utm_campaign
```

### Tags (Metadata Only)

The following tags are automatically added to contacts for filtering and organization:
- `quiz-submission` - Identifies leads from the quiz funnel
- `source:quiz` - Source identifier
- `updated:YYYY-MM-DD` - Last update date

### Data Storage Strategy

- **Custom Fields**: All medical and structured data (cancer type, stage, biomarkers, etc.)
- **Tags**: Only metadata for filtering (source, type, update date)
- **Opportunities**: Store snapshot of quiz data at submission time

### Verification

After setting up the custom fields:

1. Submit a test quiz
2. Check the contact in GoHighLevel
3. Verify that medical data appears in custom fields (not tags)
4. Confirm all fields are populated correctly

### Important Notes

1. **Pre-creation Required**: Custom fields MUST be created in GoHighLevel before they can be used
2. **Field Keys Matter**: The field key (not the display name) is what the API uses
3. **No Arrays in Custom Fields**: GoHighLevel doesn't support array values - we store as comma-separated text
4. **Opportunity Custom Fields**: May need separate configuration depending on your GoHighLevel setup

### Troubleshooting

If custom fields aren't appearing:
1. Verify fields are created in the correct location
2. Check that field keys match exactly (case-sensitive)
3. Ensure API token has permission to update custom fields
4. Test with GoHighLevel's API playground to verify field IDs
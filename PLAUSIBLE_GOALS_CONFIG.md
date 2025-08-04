# Plausible Goals Configuration

## Goals to Configure

Here are all the goals to set up in Plausible, with exact event names and suggested display names:

### 🎯 Primary Conversion Goal

| Event Name (exact) | Display Name | Description | Priority |
|-------------------|--------------|-------------|----------|
| `Contact Initiated` | Contact Initiated | User clicked phone/email to contact a clinical trial facility | **PRIMARY** |

### 📊 Clinical Trial Journey Goals

| Event Name (exact) | Display Name | Description | Priority |
|-------------------|--------------|-------------|----------|
| `Trial Search` | Clinical Trial Search | User searched for clinical trials | High |
| `Trial View` | Trial Details Viewed | User viewed specific trial details | High |
| `Eligibility Check` | Eligibility Analyzed | AI analyzed user's eligibility for a specific trial | High |
| `External Trial View` | ClinicalTrials.gov Click | User clicked to view trial on ClinicalTrials.gov | Medium |
| `Contact Info Viewed` | Contact Info Revealed | User clicked to view contact information | High |
| `Trial ID Copied` | Trial ID Copied | User copied NCT ID to clipboard | Low |

### 🏥 Health Profile Goals

| Event Name (exact) | Display Name | Description | Priority |
|-------------------|--------------|-------------|----------|
| `Health Profile Completed` | Health Profile Done | User completed health questionnaire | High |
| `Health Profile Skipped` | Health Profile Skipped | User chose to skip health profile | Low |

### 🔗 General Engagement Goals (New)

| Event Name (exact) | Display Name | Description | Priority |
|-------------------|--------------|-------------|----------|
| `Link Click` | AI Response Link Click | User clicked any link in AI-generated response | Medium |
| `Content Copied` | Content Copied | User copied content (code, phone, email, etc.) | Medium |
| `Contact Method Clicked` | Contact Method Click | Phone/email clicked from any source | High |

### 🔍 Search & Discovery Goals

| Event Name (exact) | Display Name | Description | Priority |
|-------------------|--------------|-------------|----------|
| `Place Interaction` | Location/Place Click | User interacted with place card (maps) | Low |
| `Search Result Engagement` | Search Result Click | User clicked on any search result | Medium |

## Naming Convention

We're using a clear, action-based naming convention:

1. **Action + Object**: `Contact Initiated`, `Trial View`, `Link Click`
2. **Past Tense for Completions**: `Health Profile Completed`, `Contact Info Viewed`
3. **Specific Platform Names**: `External Trial View` could be `ClinicalTrials.gov Click` in display
4. **No Underscores**: Use spaces in event names for readability

## Implementation Order

1. **First Priority** (Do these now):
   - Contact Initiated
   - Trial View
   - Eligibility Check
   - Health Profile Completed
   - Contact Info Viewed

2. **Second Priority** (After first week):
   - Trial Search
   - Link Click
   - Content Copied
   - External Trial View

3. **Third Priority** (Optional):
   - Trial ID Copied
   - Place Interaction
   - Health Profile Skipped

## Custom Properties per Goal

These will automatically appear once events start flowing:

### Contact Initiated Properties:
- `trial_id` - NCT number (e.g., "NCT12345678")
- `method` - "phone" or "email"
- `facility` - Hospital/facility name
- `contact_value` - Actual phone/email clicked

### Eligibility Check Properties:
- `trial_id` - NCT number
- `likely_eligible` - "true" or "false"
- `match_score` - Numeric score

### Link Click Properties:
- `link_type` - "phone", "email", "external", "document"
- `actual_value` - The URL/phone/email
- `link_text` - Text of the link
- `source` - "clinical_trial", "ai_response", "place_card"

### Content Copied Properties:
- `content_type` - "inline_code", "code_block", "phone", "email"
- `actual_content` - What was copied
- `source` - Where it was copied from

## Verification

After adding each goal:
1. The goal will appear in your Goals list
2. It will show 0 conversions initially
3. Once events flow in, you'll see conversions and can click to see properties
4. Properties will auto-populate - no need to define them in advance

## Notes

- Event names are **case-sensitive** - must match exactly
- Display names can be anything you want for clarity
- The "Outbound Link: Click" goal is automatically created by Plausible
- Custom properties will only show for events that include them
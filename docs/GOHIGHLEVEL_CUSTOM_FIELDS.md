# GoHighLevel Custom Fields Configuration

## Data Storage Strategy

Our system uses a **consistent three-tier storage approach**:

1. **Database (quiz_submissions table)**: Complete record for analytics and automation
2. **GoHighLevel Contacts**: Basic info and preferences only
3. **GoHighLevel Opportunities**: Full medical data snapshot for each submission

## Custom Fields to Create in GoHighLevel

### 1. CONTACT Custom Fields (General Information Group)

Create these fields under **Settings > Custom Fields > Contact Fields** in the **General Information** group:

| Field Name | Field Key | **Field Type** | Description |
|------------|-----------|----------------|-------------|
| Last Quiz Date | `last_quiz_date` | **Date Picker** | Most recent quiz submission |
| Preferred Contact Time | `preferred_contact_time` | **Single Line** | Best time to contact |
| Total Quiz Submissions | `total_quiz_submissions` | **Number** | Count of submissions |

### 2. OPPORTUNITY Custom Fields (Opportunity Details)

Create these fields under **Settings > Custom Fields > Opportunity Fields** in the **Opportunity Details** folder:

| Field Name | Field Key | **Field Type** | Description | Section |
|------------|-----------|----------------|-------------|---------|
| **Health Profile Section** |
| Cancer Type | `cancer_type` | **Single Line** | Type of cancer (e.g., "Lung Cancer") | Health Profile |
| Stage | `stage` | **Single Line** | Disease stage (e.g., "Stage IV") | Health Profile |
| Biomarkers | `biomarkers` | **Multi Line** | Molecular markers/mutations | Health Profile |
| Prior Therapy | `prior_therapy` | **Multi Line** | Previous treatments | Health Profile |
| For Whom | `for_whom` | **Dropdown (Single)** | self, relative, friend | Health Profile |
| **Additional Fields** |
| ZIP Code | `zip_code` | **Single Line** | Patient's ZIP code | Opportunity Details |
| UTM Source | `utm_source` | **Single Line** | Traffic source | Opportunity Details |
| UTM Medium | `utm_medium` | **Single Line** | Marketing medium | Opportunity Details |
| UTM Campaign | `utm_campaign` | **Single Line** | Campaign name | Opportunity Details |

### Dropdown Options for "For Whom" Field

Add these options when creating the `for_whom` dropdown:
- self
- relative
- friend

## Data Consistency Map

This table shows how data flows consistently across all three systems:

| Data Point | Database Field | Contact Field | Opportunity Field | GoHighLevel Section |
|------------|---------------|---------------|-------------------|---------------------|
| **Contact Info** |
| Email | `email` | (native field) | (linked via contact) | Native |
| Name | `fullName` | (native field) | (linked via contact) | Native |
| Phone | `phone` | (native field) | (linked via contact) | Native |
| **Health Profile Data** |
| Cancer Type | `cancerType` | - | `cancer_type` | Health Profile |
| Stage | `stage` | - | `stage` | Health Profile |
| Biomarkers | `biomarkers` | - | `biomarkers` | Health Profile |
| Prior Therapy | `priorTherapy` | - | `prior_therapy` | Health Profile |
| For Whom | `forWhom` | - | `for_whom` | Health Profile |
| **Preferences** |
| Contact Time | `preferredTime` | `preferred_contact_time` | - | General Information |
| **Location** |
| ZIP Code | `zipCode` | - | `zip_code` | Opportunity Details |
| **Tracking** |
| UTM Source | `utmSource` | - | `utm_source` | Opportunity Details |
| UTM Medium | `utmMedium` | - | `utm_medium` | Opportunity Details |
| UTM Campaign | `utmCampaign` | - | `utm_campaign` | Opportunity Details |
| **Metadata** |
| Quiz Date | `completedAt` | `last_quiz_date` | (creation date) | General Information |
| Total Count | - | `total_quiz_submissions` | - | General Information |

## Why This Structure?

1. **Contacts = Person**: Basic, current information about the individual
2. **Opportunities = Submission**: Complete medical snapshot at time of quiz
3. **Database = Everything**: Full record for analytics and automation

This ensures:
- No data loss when patients update their information
- Sales team sees all medical data in opportunity view
- Historical tracking of disease progression
- Consistent field naming across systems

## Tags (Contact Level Only)

These tags are automatically added to contacts:
- `quiz-submission` - Identifies quiz leads
- `source:quiz` - Source tracking
- `updated:YYYY-MM-DD` - Last update date

## Verification Steps

1. Create all custom fields with exact field keys
2. Submit a test quiz
3. Verify in GoHighLevel:
   - Contact has basic info + tags
   - Opportunity has all medical data
4. Check database for complete record
5. Confirm all three locations have consistent data

## Environment Variables (Optional)

Only needed if your field keys differ from the defaults:

```env
# Contact fields
GHL_CONTACT_FIELD_LAST_QUIZ_DATE=last_quiz_date
GHL_CONTACT_FIELD_PREFERRED_TIME=preferred_contact_time
GHL_CONTACT_FIELD_TOTAL_SUBMISSIONS=total_quiz_submissions

# Opportunity fields
GHL_OPP_FIELD_CANCER_TYPE=cancer_type
GHL_OPP_FIELD_STAGE=stage
GHL_OPP_FIELD_BIOMARKERS=biomarkers
GHL_OPP_FIELD_PRIOR_THERAPY=prior_therapy
GHL_OPP_FIELD_FOR_WHOM=for_whom
GHL_OPP_FIELD_ZIP_CODE=zip_code
GHL_OPP_FIELD_UTM_SOURCE=utm_source
GHL_OPP_FIELD_UTM_MEDIUM=utm_medium
GHL_OPP_FIELD_UTM_CAMPAIGN=utm_campaign
```
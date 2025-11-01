# GoHighLevel Custom Fields Setup Guide

## 🚨 The Problem

**Symptoms:**
- Opportunities are being created in GoHighLevel ✅
- Contacts are NOT being created in GoHighLevel ❌

**Root Cause:**
Your code was trying to create contacts with custom fields that don't exist in GoHighLevel. The GHL API v2 **rejects** contact/opportunity creation requests if they reference non-existent custom fields.

**Code location:** `app/api/quiz/route.ts:148-186`

---

## ✅ What Was Fixed

### 1. **Made Custom Fields Optional**

**BEFORE:**
```typescript
// Always tried to set custom fields (would fail if they don't exist)
customFields: [
  { key: 'last_quiz_date', value: new Date().toISOString() },
  { key: 'preferred_contact_time', value: validatedData.preferredTime || '' },
  { key: 'total_quiz_submissions', value: '1' }
]
```

**AFTER:**
```typescript
// Only includes custom fields if env vars are set (fields exist in GHL)
const contactCustomFields = [];
if (process.env.GHL_CONTACT_FIELD_LAST_QUIZ_DATE) {
  contactCustomFields.push({...});
}
// ... only adds if configured

// Only include if we have any
if (contactCustomFields.length > 0) {
  baseContactData.customFields = contactCustomFields;
}
```

### 2. **Added Fallback for Opportunities**

If opportunity custom fields aren't configured, medical data is stored in the `notes` field instead:

```typescript
// Fallback if no custom fields exist
opportunityData.notes = `Medical Profile:
Cancer Type: lung-cancer
Stage: Stage 4
Biomarkers: EGFR
...`;
```

---

## 🎯 Two Paths Forward

### **Option A: Run Without Custom Fields (Works Immediately)**

**What happens:**
- ✅ Contacts created with basic info (name, email, phone, tags)
- ✅ Opportunities created with medical data in `notes` field
- ⚠️ Medical data not searchable/filterable in GHL
- ⚠️ Can't build automations based on cancer type, stage, etc.

**To use this:**
1. Just deploy your code as-is
2. Don't set any `GHL_*_FIELD_*` env vars
3. Contacts will now be created successfully!

**When to choose this:**
- Need it working ASAP
- Don't need advanced GHL automations yet
- Will set up custom fields later

---

### **Option B: Set Up Custom Fields (Recommended)**

**What you get:**
- ✅ Contacts with tracking metadata (last quiz date, total submissions)
- ✅ Opportunities with structured medical data (searchable, filterable)
- ✅ Can build GHL automations based on cancer type, stage, biomarkers
- ✅ Can segment leads by medical criteria
- ✅ Better reporting in GHL

**How to set up:**

#### Step 1: Run the Setup Script

```bash
pnpm tsx scripts/setup-ghl-custom-fields.ts
```

This script will:
1. Create all 12 required custom fields in GoHighLevel
2. Print out the field IDs
3. Give you env vars to copy

#### Step 2: Add Field IDs to .env

Copy the output from the script to your `.env` file:

```bash
# Contact Custom Fields
GHL_CONTACT_FIELD_LAST_QUIZ_DATE=abc123
GHL_CONTACT_FIELD_PREFERRED_TIME=def456
GHL_CONTACT_FIELD_TOTAL_SUBMISSIONS=ghi789

# Opportunity Custom Fields
GHL_OPP_FIELD_CANCER_TYPE=jkl012
GHL_OPP_FIELD_STAGE=mno345
GHL_OPP_FIELD_BIOMARKERS=pqr678
GHL_OPP_FIELD_PRIOR_THERAPY=stu901
GHL_OPP_FIELD_FOR_WHOM=vwx234
GHL_OPP_FIELD_ZIP_CODE=yza567
GHL_OPP_FIELD_UTM_SOURCE=bcd890
GHL_OPP_FIELD_UTM_MEDIUM=efg123
GHL_OPP_FIELD_UTM_CAMPAIGN=hij456
```

#### Step 3: Redeploy

```bash
pnpm build
# Deploy to production
```

---

## 📋 Custom Fields Reference

### **Contact Fields (3 total)**

| Field Name | Purpose | Type |
|------------|---------|------|
| Last Quiz Date | When they last submitted | DATE |
| Preferred Contact Time | Morning/Afternoon/Evening | TEXT |
| Total Quiz Submissions | How many times submitted | NUMBER |

### **Opportunity Fields (9 total)**

| Field Name | Purpose | Example |
|------------|---------|---------|
| Cancer Type | Type of cancer | lung-cancer |
| Cancer Stage | Disease stage | Stage 4 |
| Biomarkers | Genetic markers | EGFR, ALK |
| Prior Therapy | Treatments tried | chemotherapy |
| For Whom | Self/family/friend | self |
| ZIP Code | Location | 12345 |
| UTM Source | Traffic source | google |
| UTM Medium | Traffic medium | cpc |
| UTM Campaign | Campaign name | lung-q4 |

---

## 🔍 Troubleshooting

### "Script fails with 401 Unauthorized"
**Fix:** Check your `GHL_INTEGRATION_TOKEN` in `.env`

### "Script fails with 404 Not Found"
**Fix:** Check your `GHL_LOCATION_ID` in `.env`

### "Field already exists error"
**Fix:** The script will automatically fetch the existing field ID - no action needed!

### "Contacts still not showing up"
**Checklist:**
1. Check GHL Contacts tab (not just Opportunities)
2. Clear any filters in GHL UI
3. Check server logs for errors:
   ```bash
   # Look for these log messages:
   "Created new contact in GoHighLevel"
   "Failed to create contact in GoHighLevel"
   ```
4. Verify `.env` variables are loaded:
   ```bash
   echo $GHL_INTEGRATION_TOKEN
   echo $GHL_LOCATION_ID
   ```

### "Opportunities are created but without custom fields"
**This means:**
- Your opportunity custom field env vars are not set
- Medical data is in the `notes` field instead
- Solution: Run the setup script and add env vars

---

## 🎯 Next Steps

1. **Decide:** Option A (no custom fields) or Option B (with custom fields)?
2. **If Option A:** Just deploy - contacts will be created
3. **If Option B:**
   - Run `pnpm tsx scripts/setup-ghl-custom-fields.ts`
   - Copy field IDs to `.env`
   - Redeploy

4. **Test:**
   - Submit a quiz
   - Check GHL Contacts tab
   - Check GHL Opportunities tab
   - Verify medical data is captured

---

## 📊 Monitoring

After deployment, check your logs for:

```bash
# Success indicators:
✅ "Created new contact in GoHighLevel"
✅ "Successfully created opportunity in pipeline"

# Warning indicators:
⚠️  "Field already exists - fetching existing ID"
⚠️  "Skipping opportunity creation - missing required data"

# Error indicators:
❌ "Failed to create contact in GoHighLevel"
❌ "Failed to create opportunity"
```

---

## 💡 Pro Tips

1. **Start with Option A** if you're in a hurry, migrate to Option B later
2. **Keep custom field IDs** backed up (they're stable, won't change)
3. **Use GHL automations** to trigger workflows based on custom fields
4. **Build segments** in GHL based on cancer type, stage, etc.
5. **Report on medical data** using opportunity custom fields

---

**Questions?** Check the code at `app/api/quiz/route.ts:148-348`

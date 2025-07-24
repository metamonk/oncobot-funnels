# Dynamic Questionnaire Flow Architecture

## Core Design Principles

1. **One Question at a Time**: Present only one question per screen/interaction
2. **Branching Logic**: Skip irrelevant questions based on previous answers
3. **Minimal Questions**: Get maximum information with fewest questions
4. **Standardized Responses**: Only yes/no or multiple choice (no free text input)
5. **Database Compatibility**: All responses map to standardized field values

## Primary Flow Structure

### Level 1: Initial Cancer Classification
**Question 1: Cancer Region**
- Purpose: Route to appropriate question tree
- Response Type: Single choice from 12 main regions
- Branches to: Region-specific question trees

### Level 2: Region-Specific Core Questions
Each region follows this pattern:
1. **Primary Site/Location** (if region has multiple sites)
2. **Cancer Type/Histology** (if multiple types possible)
3. **Disease Stage** (standardized staging)
4. **Treatment History** (region-specific treatments)
5. **Molecular/Biomarker Status** (region-specific markers)
6. **Performance Status** (universal ECOG scale)
7. **Current Complications** (region-specific complications)

### Level 3: Conditional Deep-Dive Questions
Based on previous answers, ask specific follow-up questions:
- Molecular marker details (if testing done)
- Specific treatment details (if treatments received)
- Complication specifics (if complications present)

## Branching Logic Rules

### Universal Skip Logic:
- If "Not sure" selected for cancer type → Skip molecular testing questions
- If "No treatment yet" → Skip treatment history details
- If "No complications" → Skip complication details
- If "No molecular testing" → Skip all biomarker questions

### Region-Specific Skip Logic:
- **Hematologic**: Skip staging questions (use different classification)
- **Pediatric**: Skip certain adult-specific treatments
- **CNS**: Skip certain systemic treatment questions
- **Skin**: Skip internal organ-specific complications

## Question Optimization Strategy

### Priority Ordering:
1. **High Impact Questions First**: Cancer region, type, stage
2. **Treatment-Relevant Questions**: Previous treatments, molecular markers
3. **Trial Eligibility Questions**: Performance status, complications
4. **Optional Details Last**: Additional notes, rare complications

### Efficiency Rules:
- Combine related concepts into single multiple-choice questions
- Use "None of the above" options to avoid multiple negative responses
- Group rare conditions together with "Other" options
- Limit molecular marker questions to most common/actionable markers per region

## Flow Control Mechanisms

### Question Dependencies:
```
Q1 (Cancer Region) → Q2 (Primary Site) → Q3 (Cancer Type) → Q4 (Stage)
                                                          ↓
Q8 (Complications) ← Q7 (Performance) ← Q6 (Molecular) ← Q5 (Treatment)
```

### Conditional Branching:
- **IF** Q1 = "Hematologic" **THEN** skip Q4 (Stage), use Q4b (Disease Status)
- **IF** Q5 = "No treatment yet" **THEN** skip Q5a-Q5d (Treatment details)
- **IF** Q6 = "No testing done" **THEN** skip Q6a-Q6f (Molecular details)

### Early Termination:
- **IF** Performance Status = ECOG 4 **THEN** flag for palliative care focus
- **IF** Stage = "Localized" + "No treatment" **THEN** flag for early-stage trials

## Question Format Standards

### Multiple Choice Structure:
- Maximum 8 options per question
- Always include "Not sure" option
- Use "None of the above" for negative responses
- Group similar options logically

### Yes/No Questions:
- Use for binary decisions only
- Follow with conditional multiple choice if "Yes"
- Examples: "Have you had molecular testing?" → If Yes → "Which markers?"

### Response Validation:
- Require selection before proceeding
- No free text input allowed
- Standardized terminology across all questions



## Shared Node Architecture

### Common Node Identification

Many questions across different cancer regions are identical and should be treated as the same node in the questionnaire flow. This approach ensures consistency, reduces maintenance overhead, and provides a better user experience.

### Universal Nodes (Used by All Cancer Regions)

These nodes appear in every cancer region's question tree:

#### Node: Performance Status
- **Question ID**: `PERF_STATUS_ECOG`
- **Question Text**: "How would you describe your current ability to perform daily activities?"
- **Response Options**:
  - `ECOG_0`: "Fully active, no restrictions"
  - `ECOG_1`: "Some restrictions in strenuous activity"
  - `ECOG_2`: "Limited but able to walk and care for myself"
  - `ECOG_3`: "Limited self-care, in bed/chair more than 50% of time"
  - `ECOG_4`: "Completely disabled, no self-care"
  - `UNKNOWN`: "Not sure"

#### Node: Treatment History - Surgery
- **Question ID**: `TREATMENT_SURGERY`
- **Question Text**: "Have you had surgery for your cancer?"
- **Response Options**:
  - `YES`: "Yes"
  - `NO`: "No"
  - `UNKNOWN`: "Not sure"

#### Node: Treatment History - Chemotherapy
- **Question ID**: `TREATMENT_CHEMOTHERAPY`
- **Question Text**: "Have you received chemotherapy?"
- **Response Options**:
  - `YES`: "Yes"
  - `NO`: "No"
  - `UNKNOWN`: "Not sure"

#### Node: Treatment History - Radiation
- **Question ID**: `TREATMENT_RADIATION`
- **Question Text**: "Have you received radiation therapy?"
- **Response Options**:
  - `YES`: "Yes"
  - `NO`: "No"
  - `UNKNOWN`: "Not sure"

#### Node: Treatment History - Immunotherapy
- **Question ID**: `TREATMENT_IMMUNOTHERAPY`
- **Question Text**: "Have you received immunotherapy (checkpoint inhibitors)?"
- **Response Options**:
  - `YES`: "Yes"
  - `NO`: "No"
  - `UNKNOWN`: "Not sure"

#### Node: Molecular Testing Status
- **Question ID**: `MOLECULAR_TESTING_STATUS`
- **Question Text**: "Have you had molecular or genetic testing of your tumor?"
- **Response Options**:
  - `YES`: "Yes"
  - `NO`: "No"
  - `UNKNOWN`: "Not sure"

#### Node: Disease Stage Category
- **Question ID**: `STAGE_CATEGORY`
- **Question Text**: "What is the current extent of your cancer?"
- **Response Options**:
  - `LOCALIZED`: "Localized (confined to the original organ)"
  - `LOCALLY_ADVANCED`: "Locally advanced (spread to nearby areas)"
  - `METASTATIC`: "Metastatic (spread to distant parts of the body)"
  - `RECURRENT`: "Recurrent (cancer has returned after treatment)"
  - `UNKNOWN`: "Not sure"

### Multi-Region Shared Nodes

These nodes are shared by multiple (but not all) cancer regions:

#### Node: Brain Metastases (Shared by: Thoracic, Breast, GI, GYN, Skin)
- **Question ID**: `COMPLICATION_BRAIN_METS`
- **Question Text**: "Do you currently have brain metastases?"
- **Response Options**:
  - `YES`: "Yes"
  - `NO`: "No"
  - `UNKNOWN`: "Not sure"

#### Node: Liver Metastases (Shared by: GI, Breast, Thoracic, GYN)
- **Question ID**: `COMPLICATION_LIVER_METS`
- **Question Text**: "Do you currently have liver metastases?"
- **Response Options**:
  - `YES`: "Yes"
  - `NO`: "No"
  - `UNKNOWN`: "Not sure"

#### Node: Hormone Receptor Status (Shared by: Breast, GYN)
- **Question ID**: `BIOMARKER_HORMONE_RECEPTORS`
- **Question Text**: "What is your hormone receptor status?"
- **Response Options**:
  - `ER_PR_POSITIVE`: "ER and/or PR positive"
  - `ER_PR_NEGATIVE`: "ER and PR negative"
  - `UNKNOWN`: "Not sure"

#### Node: MSI Status (Shared by: GI, GYN, GU)
- **Question ID**: `BIOMARKER_MSI_STATUS`
- **Question Text**: "Have you been tested for microsatellite instability (MSI)?"
- **Response Options**:
  - `MSI_HIGH`: "MSI-high"
  - `MSI_STABLE`: "MSI-stable (MSS)"
  - `NOT_TESTED`: "Not tested"
  - `UNKNOWN`: "Not sure"

### Region-Specific Nodes

These nodes are unique to specific cancer regions:

#### Thoracic-Specific Nodes
- **Node ID**: `THORACIC_HISTOLOGY_NSCLC`
- **Question**: "What type of non-small cell lung cancer do you have?"
- **Options**: Adenocarcinoma, Squamous cell, Large cell, Not sure

#### Hematologic-Specific Nodes
- **Node ID**: `HEMATOLOGIC_DISEASE_STATUS`
- **Question**: "What is your current disease status?"
- **Options**: Newly diagnosed, First relapse, Multiple relapses, Refractory, In remission

#### GYN-Specific Nodes
- **Node ID**: `GYN_BRCA_STATUS`
- **Question**: "Have you been tested for BRCA1/BRCA2 mutations?"
- **Options**: BRCA1 positive, BRCA2 positive, Both positive, Negative, Not tested

### Node Reusability Matrix

| Node Type | Thoracic | GU | GI | GYN | Breast | H&N | CNS | Heme | Skin | Sarcoma | Peds | CUP |
|-----------|----------|----|----|-----|--------|-----|-----|------|------|---------|------|-----|
| Performance Status | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Surgery History | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Chemotherapy History | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Radiation History | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Immunotherapy History | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Molecular Testing | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Stage Category | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - | ✓ | ✓ | ✓ | ✓ |
| Brain Metastases | ✓ | - | ✓ | ✓ | ✓ | - | - | - | ✓ | ✓ | ✓ | ✓ |
| Liver Metastases | ✓ | ✓ | ✓ | ✓ | ✓ | - | - | - | ✓ | ✓ | ✓ | ✓ |
| MSI Status | - | ✓ | ✓ | ✓ | - | - | - | - | - | - | - | ✓ |
| Hormone Receptors | - | - | - | ✓ | ✓ | - | - | - | - | - | - | - |

### Implementation Benefits of Shared Nodes

#### Consistency Assurance
Using the same node across multiple cancer regions ensures that identical questions have identical response options and validation rules. This eliminates discrepancies that could affect trial matching algorithms.

#### Maintenance Efficiency
When a universal question needs updating (e.g., adding a new performance status option), the change only needs to be made once rather than across multiple cancer-specific question sets.

#### Data Standardization
Shared nodes automatically ensure that the same concepts are captured using identical field names and values across all cancer types, facilitating cross-cancer analysis and reporting.

#### User Experience Optimization
Patients with multiple cancer types or those unsure of their exact diagnosis will encounter consistent question formats, reducing confusion and improving completion rates.

### Node Reference Architecture

```json
{
  "node_library": {
    "universal_nodes": [
      {
        "node_id": "PERF_STATUS_ECOG",
        "category": "performance_status",
        "question_text": "How would you describe your current ability to perform daily activities?",
        "response_type": "single_choice",
        "options": [
          {"value": "ECOG_0", "label": "Fully active, no restrictions"},
          {"value": "ECOG_1", "label": "Some restrictions in strenuous activity"},
          {"value": "ECOG_2", "label": "Limited but able to walk and care for myself"},
          {"value": "ECOG_3", "label": "Limited self-care, in bed/chair more than 50% of time"},
          {"value": "ECOG_4", "label": "Completely disabled, no self-care"},
          {"value": "UNKNOWN", "label": "Not sure"}
        ],
        "used_by_regions": ["ALL"]
      }
    ],
    "shared_nodes": [
      {
        "node_id": "COMPLICATION_BRAIN_METS",
        "category": "complications",
        "question_text": "Do you currently have brain metastases?",
        "response_type": "single_choice",
        "options": [
          {"value": "YES", "label": "Yes"},
          {"value": "NO", "label": "No"},
          {"value": "UNKNOWN", "label": "Not sure"}
        ],
        "used_by_regions": ["THORACIC", "BREAST", "GI", "GYN", "SKIN", "SARCOMA", "PEDIATRIC", "UNKNOWN_PRIMARY"]
      }
    ],
    "region_specific_nodes": [
      {
        "node_id": "THORACIC_HISTOLOGY_NSCLC",
        "category": "cancer_type",
        "question_text": "What type of non-small cell lung cancer do you have?",
        "response_type": "single_choice",
        "options": [
          {"value": "ADENOCARCINOMA", "label": "Adenocarcinoma"},
          {"value": "SQUAMOUS_CELL", "label": "Squamous cell carcinoma"},
          {"value": "LARGE_CELL", "label": "Large cell carcinoma"},
          {"value": "UNKNOWN", "label": "Not sure"}
        ],
        "used_by_regions": ["THORACIC"],
        "conditional_display": {
          "depends_on": "THORACIC_PRIMARY_SITE",
          "required_value": "LUNG_NSCLC"
        }
      }
    ]
  }
}
```

This shared node architecture ensures that the questionnaire system is both efficient and consistent while maintaining the flexibility needed for cancer-specific requirements.


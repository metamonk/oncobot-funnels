/**
 * GoHighLevel Custom Fields Setup Script
 *
 * This script creates all required custom fields in your GoHighLevel account
 * for both Contacts and Opportunities.
 *
 * Run: pnpm tsx scripts/setup-ghl-custom-fields.ts
 */

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_API_KEY = process.env.GHL_INTEGRATION_TOKEN || '';
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || '';

interface CustomFieldDefinition {
  name: string;
  key: string; // What we'll store in .env
  dataType: 'TEXT' | 'LARGE_TEXT' | 'NUMBER' | 'MONETARY' | 'DATE' | 'PHONE' | 'CHECKBOX' | 'DROPDOWN' | 'RADIO';
  model: 'contact' | 'opportunity';
  position?: number;
  placeholder?: string;
  options?: string[]; // For dropdown/radio
}

// Define all custom fields we need
const CUSTOM_FIELDS: CustomFieldDefinition[] = [
  // ============ CONTACT FIELDS ============
  {
    name: 'Last Quiz Date',
    key: 'GHL_CONTACT_FIELD_LAST_QUIZ_DATE',
    dataType: 'DATE',
    model: 'contact',
    placeholder: 'Date of last quiz submission'
  },
  {
    name: 'Preferred Contact Time',
    key: 'GHL_CONTACT_FIELD_PREFERRED_TIME',
    dataType: 'TEXT',
    model: 'contact',
    placeholder: 'Morning/Afternoon/Evening'
  },
  {
    name: 'Total Quiz Submissions',
    key: 'GHL_CONTACT_FIELD_TOTAL_SUBMISSIONS',
    dataType: 'NUMBER',
    model: 'contact',
    placeholder: 'Number of times submitted quiz'
  },

  // ============ OPPORTUNITY FIELDS ============
  {
    name: 'Cancer Type',
    key: 'GHL_OPP_FIELD_CANCER_TYPE',
    dataType: 'TEXT',
    model: 'opportunity',
    placeholder: 'e.g., lung-cancer, breast-cancer'
  },
  {
    name: 'Cancer Stage',
    key: 'GHL_OPP_FIELD_STAGE',
    dataType: 'TEXT',
    model: 'opportunity',
    placeholder: 'e.g., Stage 1, Stage 4, Metastatic'
  },
  {
    name: 'Biomarkers',
    key: 'GHL_OPP_FIELD_BIOMARKERS',
    dataType: 'TEXT',
    model: 'opportunity',
    placeholder: 'e.g., EGFR, ALK, PD-L1'
  },
  {
    name: 'Prior Therapy',
    key: 'GHL_OPP_FIELD_PRIOR_THERAPY',
    dataType: 'TEXT',
    model: 'opportunity',
    placeholder: 'e.g., chemotherapy, immunotherapy'
  },
  {
    name: 'For Whom',
    key: 'GHL_OPP_FIELD_FOR_WHOM',
    dataType: 'TEXT',
    model: 'opportunity',
    placeholder: 'self, family, friend'
  },
  {
    name: 'ZIP Code',
    key: 'GHL_OPP_FIELD_ZIP_CODE',
    dataType: 'TEXT',
    model: 'opportunity',
    placeholder: '12345'
  },
  {
    name: 'UTM Source',
    key: 'GHL_OPP_FIELD_UTM_SOURCE',
    dataType: 'TEXT',
    model: 'opportunity',
    placeholder: 'google, facebook, organic'
  },
  {
    name: 'UTM Medium',
    key: 'GHL_OPP_FIELD_UTM_MEDIUM',
    dataType: 'TEXT',
    model: 'opportunity',
    placeholder: 'cpc, social, email'
  },
  {
    name: 'UTM Campaign',
    key: 'GHL_OPP_FIELD_UTM_CAMPAIGN',
    dataType: 'TEXT',
    model: 'opportunity',
    placeholder: 'lung-cancer-q4'
  }
];

async function createCustomField(field: CustomFieldDefinition): Promise<string | null> {
  console.log(`\n📋 Creating ${field.model} field: ${field.name}...`);

  try {
    const endpoint = field.model === 'contact'
      ? `${GHL_API_BASE}/locations/${GHL_LOCATION_ID}/customFields`
      : `${GHL_API_BASE}/locations/${GHL_LOCATION_ID}/customFields`;

    const payload: any = {
      name: field.name,
      dataType: field.dataType,
      model: field.model,
      placeholder: field.placeholder || ''
    };

    if (field.position) {
      payload.position = field.position;
    }

    if (field.options && field.options.length > 0) {
      payload.options = field.options;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version': '2021-07-28'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      const fieldId = data.customField?.id || data.id;
      console.log(`✅ Created successfully! ID: ${fieldId}`);
      return fieldId;
    } else {
      const errorText = await response.text();
      console.error(`❌ Failed to create field: ${response.status}`);
      console.error(`   Error: ${errorText}`);

      // Try to extract field ID if it already exists
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.msg?.includes('already exists') || errorText.includes('already exists')) {
          console.log(`⚠️  Field already exists - fetching existing ID...`);
          return await getExistingFieldId(field);
        }
      } catch (e) {
        // Ignore parse errors
      }

      return null;
    }
  } catch (error) {
    console.error(`❌ Error creating field:`, error);
    return null;
  }
}

async function getExistingFieldId(field: CustomFieldDefinition): Promise<string | null> {
  try {
    const endpoint = `${GHL_API_BASE}/locations/${GHL_LOCATION_ID}/customFields`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version': '2021-07-28'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const existingField = data.customFields?.find((f: any) =>
        f.name === field.name && f.model === field.model
      );

      if (existingField) {
        console.log(`✅ Found existing field ID: ${existingField.id}`);
        return existingField.id;
      }
    }

    return null;
  } catch (error) {
    console.error(`❌ Error fetching existing field:`, error);
    return null;
  }
}

async function main() {
  console.log('🚀 GoHighLevel Custom Fields Setup\n');

  // Validate environment variables
  if (!GHL_API_KEY || GHL_API_KEY.includes('YOUR_')) {
    console.error('❌ ERROR: GHL_INTEGRATION_TOKEN not set in .env');
    console.error('   Please set GHL_INTEGRATION_TOKEN in your .env file');
    process.exit(1);
  }

  if (!GHL_LOCATION_ID) {
    console.error('❌ ERROR: GHL_LOCATION_ID not set in .env');
    console.error('   Please set GHL_LOCATION_ID in your .env file');
    process.exit(1);
  }

  console.log(`📍 Location ID: ${GHL_LOCATION_ID}`);
  console.log(`🔑 API Key: ${GHL_API_KEY.substring(0, 10)}...`);

  const results: { [key: string]: string | null } = {};

  // Create all custom fields
  for (const field of CUSTOM_FIELDS) {
    const fieldId = await createCustomField(field);
    results[field.key] = fieldId;

    // Rate limiting - wait 500ms between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Print summary
  console.log('\n\n========================================');
  console.log('📊 SETUP SUMMARY');
  console.log('========================================\n');

  console.log('Add these to your .env file:\n');

  const successfulFields = Object.entries(results).filter(([_, id]) => id !== null);
  const failedFields = Object.entries(results).filter(([_, id]) => id === null);

  if (successfulFields.length > 0) {
    console.log('# Custom Field IDs (✅ Successfully Created)');
    successfulFields.forEach(([key, id]) => {
      console.log(`${key}=${id}`);
    });
  }

  if (failedFields.length > 0) {
    console.log('\n# Failed Fields (❌ Manual Setup Required)');
    failedFields.forEach(([key]) => {
      console.log(`# ${key}=<NEEDS_MANUAL_SETUP>`);
    });
  }

  console.log('\n========================================');
  console.log(`✅ Success: ${successfulFields.length}/${CUSTOM_FIELDS.length} fields`);
  console.log(`❌ Failed: ${failedFields.length}/${CUSTOM_FIELDS.length} fields`);
  console.log('========================================\n');

  if (successfulFields.length === CUSTOM_FIELDS.length) {
    console.log('🎉 All custom fields created successfully!');
    console.log('📝 Copy the env vars above to your .env file');
  } else {
    console.log('⚠️  Some fields failed to create.');
    console.log('   You may need to create them manually in GoHighLevel');
  }
}

main().catch(console.error);
